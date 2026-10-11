import {
  OptionsRequest,
  OptionsResponse,
  QuoteRequest,
  QuoteResponse,
  CreateBookingRequest,
  BookingCreateResponse,
  BookingDetailResponse,
  PaymentOrderResponse,
  PublishedCatalogResponse,
  PublishedProductDetail,
  PublicReviewItem,
  PublicGalleryItem,
  type CategoryCode,
} from "../contracts/fare-system.js";
import { z } from "zod";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export class CleanFareApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public details?: any
  ) {
    super(message);
    this.name = "CleanFareApiError";
  }
}

async function apiRequest<T>(
  path: string,
  options?: RequestInit,
  schema?: z.ZodType<T>
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new CleanFareApiError(
      body.error || "API_ERROR",
      body.message || res.statusText,
      res.status,
      body.details || body
    );
  }

  if (schema) {
    const parseResult = schema.safeParse(body);
    if (!parseResult.success) {
      console.warn(`[CleanFareApi] Validation warning for ${path}:`, parseResult.error);
      // Return body anyway in case of loose optional fields, but schema verifies types
    }
    return body as T;
  }

  return body as T;
}

// 1. Published Catalog
export async function fetchPublishedCatalog(): Promise<PublishedCatalogResponse> {
  return apiRequest<PublishedCatalogResponse>(
    "/api/v1/catalog",
    { method: "GET" },
    PublishedCatalogResponse
  );
}

// 2. Published Product Detail
export async function fetchPublishedProduct(
  category: CategoryCode | string,
  code: string
): Promise<PublishedProductDetail> {
  return apiRequest<PublishedProductDetail>(
    `/api/v1/catalog/${category}/${code}`,
    { method: "GET" },
    PublishedProductDetail
  );
}

// 3. Quotes Options (Grouped Availability)
export async function fetchQuoteOptions(req: OptionsRequest): Promise<OptionsResponse> {
  const validatedReq = OptionsRequest.parse(req);
  return apiRequest<OptionsResponse>(
    "/api/v1/quotes/options",
    {
      method: "POST",
      body: JSON.stringify(validatedReq),
    },
    OptionsResponse
  );
}

// 4. Exact Fare Quote
export async function fetchQuote(req: QuoteRequest): Promise<QuoteResponse> {
  const validatedReq = QuoteRequest.parse(req);
  return apiRequest<QuoteResponse>(
    "/api/v1/quotes",
    {
      method: "POST",
      body: JSON.stringify(validatedReq),
    },
    QuoteResponse
  );
}

// 5. Create Booking
export async function createBooking(req: CreateBookingRequest): Promise<BookingCreateResponse> {
  const validatedReq = CreateBookingRequest.parse(req);
  return apiRequest<BookingCreateResponse>(
    "/api/v1/bookings",
    {
      method: "POST",
      body: JSON.stringify(validatedReq),
    },
    BookingCreateResponse
  );
}

// 6. Booking Detail / Status
export async function fetchBookingById(
  id: string,
  guestToken?: string
): Promise<BookingDetailResponse> {
  const headers: Record<string, string> = {};
  if (guestToken) {
    headers["x-guest-token"] = guestToken;
  }
  return apiRequest<BookingDetailResponse>(
    `/api/v1/bookings/${id}`,
    { method: "GET", headers },
    BookingDetailResponse
  );
}

// 7. Payment Order (Razorpay)
export async function createBookingPayment(bookingId: string): Promise<PaymentOrderResponse> {
  return apiRequest<PaymentOrderResponse>(
    `/api/v1/bookings/${bookingId}/payment`,
    { method: "POST" },
    PaymentOrderResponse
  );
}

// 8. Public Reviews
export async function fetchPublicReviews(): Promise<PublicReviewItem[]> {
  const data = await apiRequest<any>("/api/v1/public/reviews", { method: "GET" });
  const list = Array.isArray(data) ? data : data.reviews || [];
  return list;
}

// 9. Public Gallery
export async function fetchPublicGallery(): Promise<PublicGalleryItem[]> {
  const data = await apiRequest<any>("/api/v1/public/gallery", { method: "GET" });
  const list = Array.isArray(data) ? data : data.gallery || [];
  return list;
}

// 10. Review Link & Submission
export async function fetchReviewLink(token: string): Promise<any> {
  return apiRequest<any>(`/api/v1/reviews/links/${token}`, { method: "GET" });
}

export async function submitReview(token: string, payload: any): Promise<any> {
  return apiRequest<any>(`/api/v1/reviews/links/${token}/submissions`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
