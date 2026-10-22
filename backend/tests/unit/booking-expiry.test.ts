import { describe, expect, it } from "vitest";
import type pg from "pg";
import { BookingsRepository, type BookingEntity } from "../../src/modules/bookings/bookings.repository.js";

type QueryCall = {
  sql: string;
  params?: readonly unknown[];
};

function recordingPool(rows: BookingEntity[]) {
  const calls: QueryCall[] = [];
  const pool = {
    calls,
    query: async (sql: string, params?: readonly unknown[]) => {
      calls.push({ sql, params });
      return { rows };
    },
  };

  return pool;
}

function normalizeSql(sql: string): string {
  return sql.replace(/\s+/g, " ").trim();
}

const cancelledBooking = {
  id: "88000000-0000-0000-0000-000000000001",
  status: "cancelled",
} as BookingEntity;

describe("BookingsRepository.cancelExpiredPendingBookings", () => {
  it("cancels only expired pending-payment bookings and marks their pending payments failed", async () => {
    const pool = recordingPool([cancelledBooking]);
    const repository = new BookingsRepository(pool as unknown as pg.Pool);

    const result = await repository.cancelExpiredPendingBookings(45);

    expect(result).toEqual([cancelledBooking]);
    expect(pool.calls).toHaveLength(2);

    const bookingUpdate = pool.calls[0]!;
    expect(normalizeSql(bookingUpdate.sql)).toContain("UPDATE bookings");
    expect(normalizeSql(bookingUpdate.sql)).toContain("SET status = 'cancelled'");
    expect(normalizeSql(bookingUpdate.sql)).toContain("WHERE status = 'pending_payment'");
    expect(normalizeSql(bookingUpdate.sql)).toContain("created_at < NOW() - ($1 || ' minutes')::interval");
    expect(bookingUpdate.params).toEqual([45]);

    const paymentUpdate = pool.calls[1]!;
    expect(normalizeSql(paymentUpdate.sql)).toContain("UPDATE payments");
    expect(normalizeSql(paymentUpdate.sql)).toContain("SET status = 'failed'");
    expect(normalizeSql(paymentUpdate.sql)).toContain("WHERE booking_id = ANY($1::uuid[])");
    expect(normalizeSql(paymentUpdate.sql)).toContain("AND status = 'pending'");
    expect(paymentUpdate.params).toEqual([[cancelledBooking.id]]);
  });

  it("does not update payments when no pending-payment bookings have expired", async () => {
    const pool = recordingPool([]);
    const repository = new BookingsRepository(pool as unknown as pg.Pool);

    const result = await repository.cancelExpiredPendingBookings();

    expect(result).toEqual([]);
    expect(pool.calls).toHaveLength(1);
    expect(normalizeSql(pool.calls[0]!.sql)).toContain("WHERE status = 'pending_payment'");
    expect(pool.calls[0]!.params).toEqual([30]);
  });
});
