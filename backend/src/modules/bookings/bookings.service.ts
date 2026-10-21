import crypto from "node:crypto";
import type { CreateBookingRequest, QuoteResponse, BookingDetailResponse } from "../../contracts/fare-system.js";
import type { BookingsRepository, BookingEntity } from "./bookings.repository.js";
import type { QuotesService } from "../quotes/quotes.service.js";

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export class PriceChangedError extends Error {
  constructor(public freshQuote: QuoteResponse) {
    super("PRICE_CHANGED");
    this.name = "PriceChangedError";
  }
}

export class BookingsService {
  constructor(
    private bookingsRepo: BookingsRepository,
    private quotesService: QuotesService
  ) {}

  async createBooking(req: CreateBookingRequest, userId?: string | null): Promise<BookingEntity> {
    // 1. Recompute the quote on the server
    const freshQuote = await this.quotesService.quote(req.quote);

    // 2. Check if total matches quoted_total
    if (freshQuote.total !== req.quoted_total) {
      throw new PriceChangedError(freshQuote);
    }

    // 3. Generate reference identifiers
    const ticketId = this.generateTicketId();
    const guestAccessToken = crypto.randomBytes(32).toString("hex");

    // 4. Create booking in repository
    const routeId = req.quote.category === "outstation" ? req.quote.route_id : null;
    const localPackageId = req.quote.category === "local_package" ? req.quote.local_package_id : null;
    const transferId = req.quote.category === "transfer" ? req.quote.transfer_id : null;
    const tourPackageId = req.quote.category === "tour_package" ? req.quote.tour_package_id : null;
    const tripType = req.quote.category === "outstation" ? req.quote.trip_type : null;
    const returnAt = req.quote.category === "outstation" && req.quote.trip_type === "round_trip" ? req.quote.return_at : null;

    const booking = await this.bookingsRepo.create({
      ticket_id: ticketId,
      user_id: userId,
      guest_access_token: guestAccessToken,
      customer_name: req.customer_name.trim(),
      customer_phone: req.customer_phone.trim(),
      customer_email: req.customer_email?.trim() || null,
      category: req.quote.category,
      vehicle_model_id: req.quote.vehicle_model_id,
      passenger_count: req.quote.passenger_count,
      route_id: routeId,
      local_package_id: localPackageId,
      transfer_id: transferId,
      tour_package_id: tourPackageId,
      trip_type: tripType,
      pickup_at: req.quote.pickup_at,
      return_at: returnAt,
      pickup_address: req.pickup_address.trim(),
      drop_address: req.drop_address?.trim() || null,
      flight_train_number: req.flight_train_number?.trim() || null,
      special_notes: req.special_notes?.trim() || null,
      fare_breakdown: freshQuote,
      total_amount: freshQuote.total,
      advance_amount: freshQuote.advance,
    });

    await this.quotesService.consumePromo(req.quote.promo_code);

    return booking;
  }

  async getBookingById(id: string): Promise<BookingEntity | null> {
    if (!UUID_REGEX.test(id)) {
      return null;
    }
    return this.bookingsRepo.getById(id);
  }

  async getBookingByTicketId(ticketId: string): Promise<BookingEntity | null> {
    return this.bookingsRepo.getByTicketId(ticketId);
  }

  async getBookingByGuestToken(token: string): Promise<BookingEntity | null> {
    return this.bookingsRepo.getByGuestAccessToken(token);
  }

  async getBookingDetail(idOrTicketId: string): Promise<BookingDetailResponse | null> {
    return this.bookingsRepo.getBookingDetail(idOrTicketId);
  }

  async expirePendingBookings(expiryMinutes: number = 30): Promise<BookingEntity[]> {
    return this.bookingsRepo.cancelExpiredPendingBookings(expiryMinutes);
  }

  private generateTicketId(): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const rand = crypto.randomInt(1000, 9999);
    return `AGR-${dateStr}-${rand}`;
  }
}
