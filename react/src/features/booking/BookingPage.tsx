import { CleanBookingPage } from "./clean/CleanBookingPage";

/**
 * Clean Server-Authoritative Booking Flow
 * Replaces legacy client-side fareEngine, static catalogue imports, and legacy booking-intents
 * with canonical /api/v1/quotes and /api/v1/bookings pipeline.
 */
export function BookingPage() {
  return <CleanBookingPage />;
}

export default BookingPage;
