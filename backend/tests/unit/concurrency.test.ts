import { describe, expect, it } from "vitest";
import {
  ConcurrencyError,
  updateWithOptimisticLock,
  withRowLock,
  type SqlQueryable,
} from "../../src/db/concurrency.js";

interface TestRow {
  id: string;
  status: string;
  version: number;
  updatedBy: string;
}

type QueryCall = { sql: string; params: unknown[] };

type QueryResult = { rowCount: number | null; rows: unknown[] };

class OptimisticLockClient implements SqlQueryable {
  readonly calls: QueryCall[] = [];
  private row: TestRow | undefined;

  constructor(row?: TestRow) {
    this.row = row;
  }

  async query(sql: string, params: unknown[] = []): Promise<QueryResult> {
    this.calls.push({ sql, params });

    if (sql.includes("UPDATE")) {
      const [status, updatedBy, id, expectedVersion, newVersion] = params;
      if (
        this.row &&
        this.row.id === id &&
        this.row.version === expectedVersion
      ) {
        this.row = {
          ...this.row,
          status: String(status),
          updatedBy: String(updatedBy),
          version: Number(newVersion),
        };
        return { rowCount: 1, rows: [this.row] };
      }
      return { rowCount: 0, rows: [] };
    }

    if (sql.includes("SELECT version")) {
      return {
        rowCount: this.row ? 1 : 0,
        rows: this.row ? [{ version: this.row.version }] : [],
      };
    }

    throw new Error(`Unexpected SQL: ${sql}`);
  }
}

describe("concurrency helpers", () => {
  it("updates atomically, increments version, and preserves the caller mapping", async () => {
    const client = new OptimisticLockClient({
      id: "booking-1",
      status: "pending",
      version: 3,
      updatedBy: "old-user",
    });
    const mapRow = (row: Record<string, unknown>) => ({
      id: row.id,
      state: row.status,
      version: row.version,
      editor: row.updatedBy,
    });

    const result = await updateWithOptimisticLock({
      client,
      table: "bookings",
      id: "booking-1",
      expectedVersion: 3,
      setClause: "status = $1, updated_by = $2",
      params: ["confirmed", "new-user"],
      mapRow,
    });

    expect(result).toEqual({
      id: "booking-1",
      state: "confirmed",
      version: 4,
      editor: "new-user",
    });
    expect(client.calls[0]).toMatchObject({
      sql: expect.stringContaining("version = $5"),
      params: ["confirmed", "new-user", "booking-1", 3, 4],
    });
  });

  it("allows exactly one winner for concurrent updates using the same expected version", async () => {
    const client = new OptimisticLockClient({
      id: "booking-1",
      status: "pending",
      version: 3,
      updatedBy: "old-user",
    });
    const update = (status: string) =>
      updateWithOptimisticLock({
        client,
        table: "bookings",
        id: "booking-1",
        expectedVersion: 3,
        setClause: "status = $1, updated_by = $2",
        params: [status, `${status}-user`],
        mapRow: (row) => row,
      });

    const settled = await Promise.allSettled([update("confirmed"), update("cancelled")]);
    const successes = settled.filter((entry) => entry.status === "fulfilled");
    const failures = settled.filter((entry) => entry.status === "rejected");

    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatchObject({ status: "rejected" });
    if (failures[0]!.status === "rejected") {
      expect(failures[0]!.reason).toBeInstanceOf(ConcurrencyError);
      expect(failures[0]!.reason).toMatchObject({
        code: "CONCURRENCY_CONFLICT",
        statusCode: 409,
        currentVersion: 4,
        expectedVersion: 3,
      });
    }
  });

  it("returns a 404 when the optimistic-lock target does not exist", async () => {
    const client = new OptimisticLockClient();

    await expect(
      updateWithOptimisticLock({
        client,
        table: "bookings",
        id: "missing-booking",
        expectedVersion: 1,
        setClause: "status = $1",
        params: ["confirmed"],
        mapRow: (row) => row,
      }),
    ).rejects.toMatchObject({
      code: "RECORD_NOT_FOUND",
      statusCode: 404,
    });
  });

  it("uses NOWAIT and maps PostgreSQL lock contention to ConcurrencyError", async () => {
    const calls: QueryCall[] = [];
    const client: SqlQueryable = {
      async query(sql, params = []) {
        calls.push({ sql, params });
        throw Object.assign(new Error("could not obtain lock"), { code: "55P03" });
      },
    };

    await expect(
      withRowLock({ client, table: "bookings", id: "booking-1", noWait: true }),
    ).rejects.toMatchObject({
      code: "CONCURRENCY_CONFLICT",
      statusCode: 409,
      name: "ConcurrencyError",
    });
    expect(calls[0]).toMatchObject({
      sql: expect.stringContaining("FOR UPDATE NOWAIT"),
      params: ["booking-1"],
    });
  });

  it("returns a 404 when no row is available to lock", async () => {
    const client: SqlQueryable = {
      async query() {
        return { rowCount: 0, rows: [] };
      },
    };

    await expect(
      withRowLock({ client, table: "bookings", id: "missing-booking" }),
    ).rejects.toMatchObject({
      code: "RECORD_NOT_FOUND",
      statusCode: 404,
    });
  });
});
