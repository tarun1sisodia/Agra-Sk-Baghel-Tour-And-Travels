import type pg from "pg";
import { AppError } from "../../shared/errors.js";

export interface PaymentEntity {
  id: string;
  bookingId: string;
  provider: string;
  providerOrderId: string;
  providerPaymentId: string | null;
  amountPaise: number;
  status: "pending" | "captured" | "failed" | "needs_review" | "refunded" | "partially_refunded";
  failureReason: string | null;
  paymentMethod?: string | null;
  verifiedAt?: string | null;
  reconciliationStatus?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentWebhookEventEntity {
  id: string;
  provider: string;
  event_id: string;
  event_type: string;
  payload: unknown;
  processed: boolean;
  received_at: string;
}

export class PaymentsRepository {
  constructor(private pool: pg.Pool) { }

  async create(data: {
    booking_id: string;
    provider: string;
    provider_order_id: string;
    amount_paise: number;
  }): Promise<PaymentEntity> {
    const res = await this.pool.query(
      `
      INSERT INTO payments (booking_id, provider, provider_order_id, amount_paise, status)
      VALUES ($1, $2, $3, $4, 'pending')
      RETURNING *
    `,
      [data.booking_id, data.provider, data.provider_order_id, data.amount_paise]
    );
    const r = res.rows[0];
    return {
      id: r.id,
      bookingId: r.booking_id,
      provider: r.provider,
      providerOrderId: r.provider_order_id,
      providerPaymentId: r.provider_payment_id,
      amountPaise: Number(r.amount_paise),
      status: r.status,
      failureReason: r.failure_reason,
      paymentMethod: r.payment_method,
      verifiedAt: r.verified_at,
      reconciliationStatus: r.reconciliation_status,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  async getPendingByBookingId(bookingId: string): Promise<PaymentEntity | null> {
    const res = await this.pool.query(
      `SELECT * FROM payments WHERE booking_id = $1 AND status = 'pending' LIMIT 1`,
      [bookingId]
    );
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      id: r.id,
      bookingId: r.booking_id,
      provider: r.provider,
      providerOrderId: r.provider_order_id,
      providerPaymentId: r.provider_payment_id,
      amountPaise: Number(r.amount_paise),
      status: r.status,
      failureReason: r.failure_reason,
      paymentMethod: r.payment_method,
      verifiedAt: r.verified_at,
      reconciliationStatus: r.reconciliation_status,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  async getByProviderOrderId(orderId: string): Promise<PaymentEntity | null> {
    const res = await this.pool.query(
      `SELECT * FROM payments WHERE provider_order_id = $1 LIMIT 1`,
      [orderId]
    );
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      id: r.id,
      bookingId: r.booking_id,
      provider: r.provider,
      providerOrderId: r.provider_order_id,
      providerPaymentId: r.provider_payment_id,
      amountPaise: Number(r.amount_paise),
      status: r.status,
      failureReason: r.failure_reason,
      paymentMethod: r.payment_method,
      verifiedAt: r.verified_at,
      reconciliationStatus: r.reconciliation_status,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  async recordWebhookEvent(data: {
    provider: string;
    event_id: string;
    event_type: string;
    payload: unknown;
    processed?: boolean;
  }): Promise<{ inserted: boolean; event: PaymentWebhookEventEntity | null }> {
    const res = await this.pool.query(
      `
      INSERT INTO payment_webhook_events (provider, event_id, event_type, payload, processed)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (provider, event_id) DO NOTHING
      RETURNING *
    `,
      [data.provider, data.event_id, data.event_type, JSON.stringify(data.payload), data.processed ?? false]
    );

    if (res.rows.length === 0) {
      const existing = await this.pool.query(
        `SELECT * FROM payment_webhook_events WHERE provider = $1 AND event_id = $2 LIMIT 1`,
        [data.provider, data.event_id]
      );
      return { inserted: false, event: existing.rows[0] ?? null };
    }
    return { inserted: true, event: res.rows[0] };
  }

  async markWebhookEventProcessed(id: string): Promise<void> {
    await this.pool.query(
      `UPDATE payment_webhook_events SET processed = true WHERE id = $1`,
      [id]
    );
  }

  async processCaptured(params: {
    paymentId: string;
    bookingId: string;
    providerPaymentId: string;
    webhookEventId?: string;
    paymentMethod?: string | null;
  }): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      // Verify booking state: cannot capture payment for cancelled or refunded bookings
      const bookingRes = await client.query(
        `SELECT id, status FROM bookings WHERE id = $1 FOR UPDATE`,
        [params.bookingId]
      );
      if (bookingRes.rows.length === 0) {
        throw new AppError("NOT_FOUND", "Booking not found", 404);
      }
      const booking = bookingRes.rows[0];
      if (booking.status === "cancelled" || booking.status === "refunded") {
        throw new AppError("BOOKING_NOT_PAYABLE", "This booking is cancelled and cannot accept payment.", 409);
      }

      await client.query(
        `UPDATE payments 
         SET status = 'captured', 
             provider_payment_id = $1, 
             reconciliation_status = 'matched',
             verified_at = NOW(),
             payment_method = COALESCE($3, payment_method),
             updated_at = NOW() 
         WHERE id = $2`,
        [params.providerPaymentId, params.paymentId, params.paymentMethod ?? null]
      );

      await client.query(
        `UPDATE bookings 
         SET status = 'confirmed', updated_at = NOW() 
         WHERE id = $1 AND status = 'pending_payment'`,
        [params.bookingId]
      );

      if (params.webhookEventId) {
        await client.query(
          `UPDATE payment_webhook_events SET processed = true WHERE id = $1`,
          [params.webhookEventId]
        );
      }

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async processNeedsReview(params: {
    paymentId: string;
    reason: string;
    providerPaymentId?: string;
    webhookEventId?: string;
  }): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      await client.query(
        `UPDATE payments SET status = 'needs_review', failure_reason = $1, provider_payment_id = COALESCE($2, provider_payment_id), updated_at = NOW() WHERE id = $3`,
        [params.reason, params.providerPaymentId ?? null, params.paymentId]
      );

      if (params.webhookEventId) {
        await client.query(
          `UPDATE payment_webhook_events SET processed = true WHERE id = $1`,
          [params.webhookEventId]
        );
      }

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async processFailed(params: {
    paymentId: string;
    reason: string;
    webhookEventId?: string;
  }): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      await client.query(
        `UPDATE payments SET status = 'failed', failure_reason = $1, updated_at = NOW() WHERE id = $2`,
        [params.reason, params.paymentId]
      );

      if (params.webhookEventId) {
        await client.query(
          `UPDATE payment_webhook_events SET processed = true WHERE id = $1`,
          [params.webhookEventId]
        );
      }

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
}
