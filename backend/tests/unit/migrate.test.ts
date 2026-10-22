import { createHash } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type MockClient = {
  connect: ReturnType<typeof vi.fn>;
  query: ReturnType<typeof vi.fn>;
  end: ReturnType<typeof vi.fn>;
};

const pgMock = vi.hoisted(() => ({
  clients: [] as MockClient[],
  Client: vi.fn(),
}));

vi.mock("pg", () => ({ default: { Client: pgMock.Client } }));

import { runMigrations } from "../../src/db/migrate.js";

const temporaryDirectories: string[] = [];

function checksum(sql: string): string {
  return createHash("sha256").update(sql.replace(/\r\n/g, "\n")).digest("hex");
}

async function makeMigrationDirectory(files: Record<string, string>): Promise<string> {
  const directory = await mkdtemp(path.join(os.tmpdir(), "run-migrations-"));
  temporaryDirectories.push(directory);
  for (const [name, sql] of Object.entries(files)) {
    await writeFile(path.join(directory, name), sql, "utf8");
  }
  return directory;
}

function queryTexts(client: MockClient): string[] {
  return client.query.mock.calls.map(([text]) => text as string);
}

describe("runMigrations", () => {
  beforeEach(() => {
    pgMock.clients.length = 0;
    pgMock.Client.mockReset();
    pgMock.Client.mockImplementation(() => {
      const client: MockClient = {
        connect: vi.fn().mockResolvedValue(undefined),
        query: vi.fn(),
        end: vi.fn().mockResolvedValue(undefined),
      };
      pgMock.clients.push(client);
      return client;
    });
  });

  afterEach(async () => {
    await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
  });

  it("does not rerun an applied migration when its checksum matches", async () => {
    const sql = "select 1;\n";
    const file = "001_existing.sql";
    const directory = await makeMigrationDirectory({ [file]: sql });
    pgMock.Client.mockImplementationOnce(() => {
      const mockClient: MockClient = {
        connect: vi.fn().mockResolvedValue(undefined),
        query: vi.fn(async (text: string) => {
          if (text.startsWith("select checksum")) {
            return { rowCount: 1, rows: [{ checksum: checksum(sql) }] };
          }
          return { rowCount: 0, rows: [] };
        }),
        end: vi.fn().mockResolvedValue(undefined),
      };
      pgMock.clients.push(mockClient);
      return mockClient;
    });

    await expect(runMigrations({ connectionString: "postgres://test", migrationsDir: directory, silent: true })).resolves.toEqual({
      applied: [],
      total: 1,
    });

    const mockClient = pgMock.clients[0] as MockClient;
    expect(mockClient.connect).toHaveBeenCalledOnce();
    expect(mockClient.query).toHaveBeenCalledWith("select pg_advisory_lock(hashtext($1))", ["arenaai:migrations"]);
    expect(mockClient.query).toHaveBeenCalledWith("select checksum from schema_migrations where id=$1", [file]);
    expect(queryTexts(mockClient)).not.toContain(sql);
    expect(queryTexts(mockClient)).not.toContain("begin");
    expect(queryTexts(mockClient)).not.toContain("commit");
    expect(mockClient.query).toHaveBeenCalledWith("select pg_advisory_unlock(hashtext($1))", ["arenaai:migrations"]);
    expect(mockClient.end).toHaveBeenCalledOnce();
  });

  it("rejects checksum drift before executing the changed migration SQL", async () => {
    const sql = "alter table users add column changed text;\n";
    const file = "002_changed.sql";
    const directory = await makeMigrationDirectory({ [file]: sql });
    pgMock.Client.mockImplementationOnce(() => {
      const mockClient: MockClient = {
        connect: vi.fn().mockResolvedValue(undefined),
        query: vi.fn(async (text: string) => {
          if (text.startsWith("select checksum")) {
            return { rowCount: 1, rows: [{ checksum: "old-checksum" }] };
          }
          return { rowCount: 0, rows: [] };
        }),
        end: vi.fn().mockResolvedValue(undefined),
      };
      pgMock.clients.push(mockClient);
      return mockClient;
    });

    await expect(runMigrations({ connectionString: "postgres://test", migrationsDir: directory, silent: true })).rejects.toThrow(
      `Migration drift detected for ${file}: stored checksum does not match the repository file`,
    );

    const client = pgMock.clients[0] as MockClient;
    expect(queryTexts(client)).not.toContain(sql);
    expect(queryTexts(client)).not.toContain("begin");
    expect(queryTexts(client)).not.toContain("commit");
    expect(queryTexts(client)).not.toContain("rollback");
    expect(client.query).toHaveBeenCalledWith("select pg_advisory_unlock(hashtext($1))", ["arenaai:migrations"]);
    expect(client.end).toHaveBeenCalledOnce();
  });

  it("backfills a null checksum without rerunning the applied migration", async () => {
    const sql = "create index users_email_idx on users(email);\n";
    const file = "003_legacy.sql";
    const directory = await makeMigrationDirectory({ [file]: sql });
    pgMock.Client.mockImplementationOnce(() => {
      const mockClient: MockClient = {
        connect: vi.fn().mockResolvedValue(undefined),
        query: vi.fn(async (text: string) => {
          if (text.startsWith("select checksum")) {
            return { rowCount: 1, rows: [{ checksum: null }] };
          }
          return { rowCount: 0, rows: [] };
        }),
        end: vi.fn().mockResolvedValue(undefined),
      };
      pgMock.clients.push(mockClient);
      return mockClient;
    });

    await expect(runMigrations({ connectionString: "postgres://test", migrationsDir: directory, silent: true })).resolves.toEqual({
      applied: [],
      total: 1,
    });

    const client = pgMock.clients[0] as MockClient;
    expect(client.query).toHaveBeenCalledWith("update schema_migrations set checksum=$2 where id=$1", [file, checksum(sql)]);
    expect(queryTexts(client)).not.toContain(sql);
    expect(queryTexts(client)).not.toContain("begin");
    expect(client.query).toHaveBeenCalledWith("select pg_advisory_unlock(hashtext($1))", ["arenaai:migrations"]);
  });

  it("applies a new migration in a transaction and records its checksum", async () => {
    const sql = "create table migration_probe (id integer);\n";
    const file = "004_new.sql";
    const directory = await makeMigrationDirectory({ [file]: sql });
    pgMock.Client.mockImplementationOnce(() => {
      const mockClient: MockClient = {
        connect: vi.fn().mockResolvedValue(undefined),
        query: vi.fn(async (text: string) => {
          if (text.startsWith("select checksum")) {
            return { rowCount: 0, rows: [] };
          }
          return { rowCount: 1, rows: [] };
        }),
        end: vi.fn().mockResolvedValue(undefined),
      };
      pgMock.clients.push(mockClient);
      return mockClient;
    });

    await expect(runMigrations({ connectionString: "postgres://test", migrationsDir: directory, silent: true })).resolves.toEqual({
      applied: [file],
      total: 1,
    });

    const client = pgMock.clients[0] as MockClient;
    expect(client.query).toHaveBeenNthCalledWith(4, "select checksum from schema_migrations where id=$1", [file]);
    expect(client.query).toHaveBeenNthCalledWith(5, "begin");
    expect(client.query).toHaveBeenNthCalledWith(6, sql);
    expect(client.query).toHaveBeenNthCalledWith(7, "insert into schema_migrations(id, checksum) values ($1, $2)", [file, checksum(sql)]);
    expect(client.query).toHaveBeenNthCalledWith(8, "commit");
    expect(queryTexts(client)).not.toContain("rollback");
    expect(client.query).toHaveBeenLastCalledWith("select pg_advisory_unlock(hashtext($1))", ["arenaai:migrations"]);
    expect(client.end).toHaveBeenCalledOnce();
  });

  it("rolls back and rethrows when migration SQL fails", async () => {
    const sql = "create table migration_failure (id integer);\n";
    const file = "005_failure.sql";
    const directory = await makeMigrationDirectory({ [file]: sql });
    const migrationError = new Error("migration SQL failed");
    pgMock.Client.mockImplementationOnce(() => {
      const mockClient: MockClient = {
        connect: vi.fn().mockResolvedValue(undefined),
        query: vi.fn(async (text: string) => {
          if (text.startsWith("select checksum")) {
            return { rowCount: 0, rows: [] };
          }
          if (text === sql) {
            throw migrationError;
          }
          return { rowCount: 1, rows: [] };
        }),
        end: vi.fn().mockResolvedValue(undefined),
      };
      pgMock.clients.push(mockClient);
      return mockClient;
    });

    await expect(runMigrations({ connectionString: "postgres://test", migrationsDir: directory, silent: true })).rejects.toBe(migrationError);

    const client = pgMock.clients[0] as MockClient;
    expect(client.query).toHaveBeenNthCalledWith(5, "begin");
    expect(client.query).toHaveBeenNthCalledWith(6, sql);
    expect(client.query).toHaveBeenNthCalledWith(7, "rollback");
    expect(queryTexts(client)).not.toContain("insert into schema_migrations(id, checksum) values ($1, $2)");
    expect(queryTexts(client)).not.toContain("commit");
    expect(client.query).toHaveBeenLastCalledWith("select pg_advisory_unlock(hashtext($1))", ["arenaai:migrations"]);
    expect(client.end).toHaveBeenCalledOnce();
  });

  it("still closes the client when advisory unlock itself fails", async () => {
    const directory = await makeMigrationDirectory({});
    const unlockError = new Error("unlock failed");
    pgMock.Client.mockImplementationOnce(() => {
      const mockClient: MockClient = {
        connect: vi.fn().mockResolvedValue(undefined),
        query: vi.fn(async (text: string) => {
          if (text.startsWith("select pg_advisory_unlock")) {
            throw unlockError;
          }
          return { rowCount: 0, rows: [] };
        }),
        end: vi.fn().mockResolvedValue(undefined),
      };
      pgMock.clients.push(mockClient);
      return mockClient;
    });

    await expect(runMigrations({ connectionString: "postgres://test", migrationsDir: directory, silent: true })).resolves.toEqual({
      applied: [],
      total: 0,
    });

    const client = pgMock.clients[0] as MockClient;
    expect(client.query).toHaveBeenCalledWith("select pg_advisory_lock(hashtext($1))", ["arenaai:migrations"]);
    expect(client.query).toHaveBeenCalledWith("select pg_advisory_unlock(hashtext($1))", ["arenaai:migrations"]);
    expect(client.end).toHaveBeenCalledOnce();
  });

  it("ends the client without unlocking when advisory lock acquisition fails", async () => {
    const directory = await makeMigrationDirectory({});
    const lockError = new Error("lock failed");
    pgMock.Client.mockImplementationOnce(() => {
      const mockClient: MockClient = {
        connect: vi.fn().mockResolvedValue(undefined),
        query: vi.fn(async (text: string) => {
          if (text.startsWith("select pg_advisory_lock")) {
            throw lockError;
          }
          return { rowCount: 0, rows: [] };
        }),
        end: vi.fn().mockResolvedValue(undefined),
      };
      pgMock.clients.push(mockClient);
      return mockClient;
    });

    await expect(runMigrations({ connectionString: "postgres://test", migrationsDir: directory, silent: true })).rejects.toBe(lockError);

    const client = pgMock.clients[0] as MockClient;
    expect(queryTexts(client)).not.toContain("select pg_advisory_unlock(hashtext($1))");
    expect(client.end).toHaveBeenCalledOnce();
  });
});
