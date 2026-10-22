import { describe, expect, it } from "vitest";
import type pg from "pg";
import { PaymentsRepository } from "../../src/modules/payments/payments.repository.js";

function repositoryReturning(row: Record<string, unknown>, seenSql: string[] = []): PaymentsRepository {
  const pool = {
    query: async (sql: string) => {
      seenSql.push(sql);
      return { rows: [row] };
    },
  };
  return new PaymentsRepository(pool as unknown as pg.Pool);
}

const rowBase = {
  id: "99000000-0000-0000-0000-000000000001",
  booking_id: "88000000-0000-0000-0000-000000000001",
  provider: "razorpay",
  provider_order_id: "order_test_123",
  provider_payment_id: null,
  status: "pending",
  failure_reason: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe("PaymentsRepository amount mapping", () => {
  it("inserts using the canonical column and maps PostgreSQL bigint strings", async () => {
    const sql: string[] = [];
    const repo = repositoryReturning({ ...rowBase, amount_paise: "98000" }, sql);
    const payment = await repo.create({
      booking_id: rowBase.booking_id,
      provider: "razorpay",
      provider_order_id: rowBase.provider_order_id,
      amountPaise: 98000,
    });
    expect(sql[0]).toContain("amount_paise");
    expect(payment.amountPaise).toBe(98000);
    expect(Number.isInteger(payment.amountPaise)).toBe(true);
  });

  it("continues to read the legacy PostgreSQL-folded amountpaise key", async () => {
    const repo = repositoryReturning({ ...rowBase, amountpaise: "98000" });
    const payment = await repo.getPendingByBookingId(rowBase.booking_id);
    expect(payment?.amountPaise).toBe(98000);
  });

  it("fails closed for missing, fractional, unsafe, or non-positive amounts", async () => {
    for (const amount of [undefined, "12.5", "9007199254740992", "0"]) {
      const repo = repositoryReturning({ ...rowBase, amount_paise: amount });
      await expect(repo.getByProviderOrderId(rowBase.provider_order_id)).rejects.toMatchObject({
        code: "DATA_CORRUPTION",
        statusCode: 500,
      });
    }
  });
});
