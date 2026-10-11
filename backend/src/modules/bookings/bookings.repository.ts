import type pg from "pg";
import type { CategoryCode, QuoteResponse } from "../../contracts/fare-system.js";

export interface BookingEntity {
  id: string;
  ticket_id: string;
  user_id: string | null;
  guest_access_token: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  category: CategoryCode;
  vehicle_model_id: string;
  passenger_count: number;
  route_id: string | null;
  local_package_id: string | null;
  transfer_id: string | null;
  tour_package_id: string | null;
  trip_type: "one_way" | "round_trip" | null;
  pickup_at: string;
  return_at: string | null;
  pickup_address: string;
  drop_address: string | null;
  flight_train_number: string | null;
  special_notes: string | null;
  fare_breakdown: QuoteResponse;
  total_amount: number;
  advance_amount: number;
  balance_amount: number;
  status: "pending_payment" | "confirmed" | "driver_assigned" | "in_transit" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
}

export class BookingsRepository {
  constructor(private pool: pg.Pool) {}

  async create(data: {
    ticket_id: string;
    user_id?: string | null;
    guest_access_token: string;
    customer_name: string;
    customer_phone: string;
    customer_email?: string | null;
    category: CategoryCode;
    vehicle_model_id: string;
    passenger_count: number;
    route_id?: string | null;
    local_package_id?: string | null;
    transfer_id?: string | null;
    tour_package_id?: string | null;
    trip_type?: "one_way" | "round_trip" | null;
    pickup_at: string;
    return_at?: string | null;
    pickup_address: string;
    drop_address?: string | null;
    flight_train_number?: string | null;
    special_notes?: string | null;
    fare_breakdown: QuoteResponse;
    total_amount: number;
    advance_amount: number;
  }): Promise<BookingEntity> {
    const res = await this.pool.query(
      `
      INSERT INTO bookings (
        ticket_id, user_id, guest_access_token, customer_name, customer_phone, customer_email,
        category, vehicle_model_id, passenger_count, route_id, local_package_id, transfer_id, tour_package_id,
        trip_type, pickup_at, return_at, pickup_address, drop_address, flight_train_number, special_notes,
        fare_breakdown, total_amount, advance_amount, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, 'pending_payment')
      RETURNING *
    `,
      [
        data.ticket_id,
        data.user_id ?? null,
        data.guest_access_token,
        data.customer_name,
        data.customer_phone,
        data.customer_email ?? null,
        data.category,
        data.vehicle_model_id,
        data.passenger_count,
        data.route_id ?? null,
        data.local_package_id ?? null,
        data.transfer_id ?? null,
        data.tour_package_id ?? null,
        data.trip_type ?? null,
        data.pickup_at,
        data.return_at ?? null,
        data.pickup_address,
        data.drop_address ?? null,
        data.flight_train_number ?? null,
        data.special_notes ?? null,
        JSON.stringify(data.fare_breakdown),
        data.total_amount,
        data.advance_amount,
      ]
    );

    const r = res.rows[0];
    return {
      ...r,
      fare_breakdown: typeof r.fare_breakdown === "string" ? JSON.parse(r.fare_breakdown) : r.fare_breakdown,
      total_amount: Number(r.total_amount),
      advance_amount: Number(r.advance_amount),
      balance_amount: Number(r.balance_amount),
      passenger_count: Number(r.passenger_count),
    };
  }

  async getById(id: string): Promise<BookingEntity | null> {
    const res = await this.pool.query("SELECT * FROM bookings WHERE id = $1", [id]);
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      ...r,
      fare_breakdown: typeof r.fare_breakdown === "string" ? JSON.parse(r.fare_breakdown) : r.fare_breakdown,
      total_amount: Number(r.total_amount),
      advance_amount: Number(r.advance_amount),
      balance_amount: Number(r.balance_amount),
      passenger_count: Number(r.passenger_count),
    };
  }

  async getByTicketId(ticketId: string): Promise<BookingEntity | null> {
    const res = await this.pool.query("SELECT * FROM bookings WHERE ticket_id = $1", [ticketId]);
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      ...r,
      fare_breakdown: typeof r.fare_breakdown === "string" ? JSON.parse(r.fare_breakdown) : r.fare_breakdown,
      total_amount: Number(r.total_amount),
      advance_amount: Number(r.advance_amount),
      balance_amount: Number(r.balance_amount),
      passenger_count: Number(r.passenger_count),
    };
  }

  async getByGuestAccessToken(token: string): Promise<BookingEntity | null> {
    const res = await this.pool.query("SELECT * FROM bookings WHERE guest_access_token = $1", [token]);
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      ...r,
      fare_breakdown: typeof r.fare_breakdown === "string" ? JSON.parse(r.fare_breakdown) : r.fare_breakdown,
      total_amount: Number(r.total_amount),
      advance_amount: Number(r.advance_amount),
      balance_amount: Number(r.balance_amount),
      passenger_count: Number(r.passenger_count),
    };
  }

  async updateStatus(
    id: string,
    status: "confirmed" | "driver_assigned" | "in_transit" | "completed" | "cancelled"
  ): Promise<boolean> {
    const res = await this.pool.query(
      "UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2",
      [status, id]
    );
    return (res.rowCount ?? 0) > 0;
  }
}
