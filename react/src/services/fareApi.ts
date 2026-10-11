import type {
  OptionsRequest,
  OptionsResponse,
  QuoteRequest,
  QuoteResponse,
  CreateBookingRequest,
} from "../contracts/fare-system.js";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export class FareApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public details?: any
  ) {
    super(message);
    this.name = "FareApiError";
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new FareApiError(
      data.error || "API_ERROR",
      data.message || res.statusText,
      res.status,
      data
    );
  }
  return data as T;
}

export async function fetchQuoteOptions(req: OptionsRequest): Promise<OptionsResponse> {
  return request<OptionsResponse>("/quotes/options", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export async function fetchQuote(req: QuoteRequest): Promise<QuoteResponse> {
  return request<QuoteResponse>("/quotes", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export async function createBooking(req: CreateBookingRequest): Promise<{ booking: any }> {
  return request<{ booking: any }>("/bookings", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export async function createBookingPayment(bookingId: string): Promise<{ payment: any }> {
  return request<{ payment: any }>(`/bookings/${bookingId}/payment`, {
    method: "POST",
  });
}

export async function fetchPublicReviews(): Promise<any[]> {
  const res = await request<{ reviews: any[] }>("/public/reviews");
  return res.reviews || [];
}

export async function fetchPublicGallery(): Promise<any[]> {
  const res = await request<{ gallery: any[] }>("/public/gallery");
  return res.gallery || [];
}
