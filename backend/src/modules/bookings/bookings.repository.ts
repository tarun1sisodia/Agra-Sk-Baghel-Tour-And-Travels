import type pg from "pg";
import type { CategoryCode, QuoteResponse, BookingDetailResponse } from "../../contracts/fare-system.js";

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
    let effectiveUserId: string | null = null;
    if (data.user_id) {
      try {
        const check = await this.pool.query("SELECT id FROM profiles WHERE id = $1 LIMIT 1", [data.user_id]);
        if (check.rows.length > 0) {
          effectiveUserId = data.user_id;
        } else {
          // Profile row does not exist for this authenticated user yet. Attempt to auto-provision.
          const phone = data.customer_phone?.trim() || "+910000000000";
          const email = data.customer_email?.trim() || null;
          try {
            // If auth.users exists, ensure user record exists
            try {
              await this.pool.query(
                `INSERT INTO auth.users (id, email, created_at)
                 VALUES ($1, $2, NOW())
                 ON CONFLICT (id) DO NOTHING`,
                [data.user_id, email]
              );
            } catch {
              // Ignore if auth schema is managed externally or permissions restricted
            }

            await this.pool.query(
              `INSERT INTO profiles (id, full_name, phone, email, role, created_at, updated_at)
               VALUES ($1, $2, $3, $4, 'customer', NOW(), NOW())
               ON CONFLICT (id) DO UPDATE SET
                 full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
                 updated_at = NOW()`,
              [data.user_id, data.customer_name, phone, email]
            );
            effectiveUserId = data.user_id;
          } catch (profileErr: any) {
            // If phone or email uniqueness fails, generate safe distinct phone identifier
            if (profileErr?.code === "23505") {
              const safePhone = `+91${data.user_id.replace(/[^0-9]/g, "").slice(0, 9).padEnd(10, "0")}`;
              try {
                await this.pool.query(
                  `INSERT INTO profiles (id, full_name, phone, email, role, created_at, updated_at)
                   VALUES ($1, $2, $3, NULL, 'customer', NOW(), NOW())
                   ON CONFLICT (id) DO UPDATE SET
                     full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
                     updated_at = NOW()`,
                  [data.user_id, data.customer_name, safePhone]
                );
                effectiveUserId = data.user_id;
              } catch {
                // Secondary fallback
              }
            }
            console.warn(`[bookings] Profile auto-provision attempt for ${data.user_id}: ${profileErr?.message || profileErr}`);
            const recheck = await this.pool.query("SELECT id FROM profiles WHERE id = $1 LIMIT 1", [data.user_id]);
            effectiveUserId = recheck.rows.length > 0 ? data.user_id : null;
          }
        }
      } catch (err: any) {
        console.warn(`[bookings] Error verifying profile for ${data.user_id}: ${err?.message || err}`);
        effectiveUserId = null;
      }
    }

    const insertSql = `
      INSERT INTO bookings (
        ticket_id, user_id, guest_access_token, customer_name, customer_phone, customer_email,
        category, vehicle_model_id, passenger_count, route_id, local_package_id, transfer_id, tour_package_id,
        trip_type, pickup_at, return_at, pickup_address, drop_address, flight_train_number, special_notes,
        fare_breakdown, total_amount, advance_amount, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, 'pending_payment')
      RETURNING *
    `;

    const buildParams = (uid: string | null) => [
      data.ticket_id,
      uid,
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
    ];

    let res;
    try {
      res = await this.pool.query(insertSql, buildParams(effectiveUserId));
    } catch (insertErr: any) {
      if (insertErr?.code === "23503" && effectiveUserId) {
        // FK violation fallback: retry with null user_id so customer booking is never aborted
        console.warn(`[bookings] FK constraint violation on user_id ${effectiveUserId}. Retrying booking with null user_id.`);
        res = await this.pool.query(insertSql, buildParams(null));
      } else {
        throw insertErr;
      }
    }

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

  async getBookingDetail(idOrTicketId: string): Promise<BookingDetailResponse | null> {
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(idOrTicketId);
    const query = isUuid
      ? "SELECT * FROM bookings WHERE id = $1"
      : "SELECT * FROM bookings WHERE ticket_id = $1";
    const res = await this.pool.query(query, [idOrTicketId]);
    if (res.rows.length === 0) return null;
    const r = res.rows[0];

    const fareBreakdown: QuoteResponse = typeof r.fare_breakdown === "string" ? JSON.parse(r.fare_breakdown) : r.fare_breakdown;

    let productCode = "";
    let productName = "";

    if (r.category === "tour_package" && r.tour_package_id) {
      const pRes = await this.pool.query("SELECT code, name FROM tour_packages WHERE id = $1", [r.tour_package_id]);
      if (pRes.rows[0]) {
        productCode = pRes.rows[0].code;
        productName = pRes.rows[0].name;
      }
    } else if (r.category === "local_package" && r.local_package_id) {
      const pRes = await this.pool.query("SELECT code, name FROM local_packages WHERE id = $1", [r.local_package_id]);
      if (pRes.rows[0]) {
        productCode = pRes.rows[0].code;
        productName = pRes.rows[0].name;
      }
    } else if (r.category === "transfer" && r.transfer_id) {
      const pRes = await this.pool.query("SELECT code, name FROM transfers WHERE id = $1", [r.transfer_id]);
      if (pRes.rows[0]) {
        productCode = pRes.rows[0].code;
        productName = pRes.rows[0].name;
      }
    } else if (r.category === "outstation" && r.route_id) {
      const pRes = await this.pool.query("SELECT code, origin_name, destination_name FROM outstation_routes WHERE id = $1", [r.route_id]);
      if (pRes.rows[0]) {
        productCode = pRes.rows[0].code;
        productName = `${pRes.rows[0].origin_name} to ${pRes.rows[0].destination_name}`;
      }
    }

    if (!productCode) {
      productCode = (r.route_id || r.tour_package_id || r.local_package_id || r.transfer_id || r.category || "custom-booking").toString();
    }
    if (!productName) {
      productName = r.pickup_address && r.drop_address
        ? `${r.pickup_address} to ${r.drop_address}`
        : `${r.category ? r.category.replace(/_/g, " ").toUpperCase() : "Travel"} Booking`;
    }

    const vehicleId = fareBreakdown?.vehicle?.vehicle_model_id || r.vehicle_model_id || "standard-vehicle";
    const vehicleName = fareBreakdown?.vehicle?.display_name || "Standard Chauffeur Vehicle";
    const vehicleGroup = fareBreakdown?.vehicle?.group_code || "standard";

    return {
      booking_id: r.id,
      ticket_id: r.ticket_id,
      status: r.status,
      category: r.category,
      product_code: productCode,
      product_name: productName,
      customer_name: r.customer_name,
      customer_phone: r.customer_phone,
      customer_email: r.customer_email || undefined,
      pickup_address: r.pickup_address,
      drop_address: r.drop_address || undefined,
      pickup_at: r.pickup_at,
      return_at: r.return_at || undefined,
      passenger_count: Number(r.passenger_count),
      vehicle_model: {
        id: vehicleId,
        display_name: vehicleName,
        group_code: vehicleGroup,
      },
      total_amount: Number(r.total_amount),
      advance_amount: Number(r.advance_amount),
      balance_amount: Number(r.balance_amount),
      fare_breakdown: fareBreakdown,
      payment_status: r.status,
      created_at: r.created_at,
    };
  }
}
