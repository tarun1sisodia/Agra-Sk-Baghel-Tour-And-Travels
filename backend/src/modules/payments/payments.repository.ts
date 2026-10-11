import type pg from "pg";

export interface PaymentEntity {
  id: string;
  booking_id: string;
  provider: string;
  provider_order_id: string;
  provider_payment_id: string | null;
  amount_paise: number;
  status: "pending" | "captured" | "failed" | "needs_review";
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
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
  constructor(private pool: pg.Pool) {}

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
      ...r,
      amount_paise: Number(r.amount_paise),
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
      ...r,
      amount_paise: Number(r.amount_paise),
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
      ...r,
      amount_paise: Number(r.amount_paise),
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
      return { inserted: false, event: null };
    }
    return { inserted: true, event: res.rows[0] };
  }

  async processCaptured(params: {
    paymentId: string;
    bookingId: string;
    providerPaymentId: string;
    webhookEventId?: string;
  }): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      await client.query(
        `UPDATE payments SET status = 'captured', provider_payment_id = $1, updated_at = NOW() WHERE id = $2`,
        [params.providerPaymentId, params.paymentId]
      );

      await client.query(
        `UPDATE bookings SET status = 'confirmed', updated_at = NOW() WHERE id = $1 AND status = 'pending_payment'`,
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
