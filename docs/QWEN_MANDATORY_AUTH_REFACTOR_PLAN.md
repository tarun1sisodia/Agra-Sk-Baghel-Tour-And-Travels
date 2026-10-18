Here's a production-ready, security-hardened refactor to enforce **mandatory authentication for bookings**, removing all guest token logic and aligning with Supabase + Google Sign-In.

---

### ✅ 1. `CleanBookingPage.tsx`

```tsx
// CleanBookingPage.tsx
import { useCustomerAuth } from '@/lib/auth';
import { useState } from 'react';
import { createBooking } from '@/api/cleanFareApi';

export default function CleanBookingPage() {
  const { user, signInWithGoogle, signInWithEmail } = useCustomerAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('Please log in to book a service.');
      // Optional: trigger modal or redirect to /login
      return;
    }

    setIsSubmitting(true);
    try {
      // Pass Supabase JWT directly as `accessToken`
      const booking = await createBooking(
        {
          from: 'Agra',
          to: 'Delhi',
          date: new Date().toISOString(),
        },
        user.access_token // ✅ Supabase JWT
      );
      // Redirect to confirmation with booking ID
      window.location.href = `/booking/confirmation?id=${booking.id}`;
    } catch (err: any) {
      console.error('Booking failed:', err);
      alert(err.message || 'Failed to book. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleBook}>
      {!user && (
        <div className="auth-prompt">
          <p>You must be logged in to book.</p>
          <button type="button" onClick={signInWithGoogle}>Sign in with Google</button>
          <button type="button" onClick={() => signInWithEmail('user@example.com', 'password')}>
            Sign in with Email
          </button>
        </div>
      )}
      {/* Booking form fields */}
      <button type="submit" disabled={isSubmitting || !user}>
        {isSubmitting ? 'Booking...' : 'Book Now'}
      </button>
    </form>
  );
}
```

> ✅ **No `guest_token`, no `sessionStorage`, no fallback.**  
> ✅ Uses `user.access_token` (Supabase JWT) directly.

---

### ✅ 2. `cleanFareApi.ts`

```ts
// cleanFareApi.ts
import { API_BASE_URL } from '@/config';

interface BookingRequest {
  from: string;
  to: string;
  date: string;
  // ... other fields
}

interface BookingResponse {
  id: string;
  status: string;
  // ...
}

// ✅ All functions now require `accessToken`
export async function createBooking(
  payload: BookingRequest,
  accessToken: string
): Promise<BookingResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`, // ✅ Mandatory
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create booking');
  }
  return res.json();
}

export async function fetchBookingById(
  id: string,
  accessToken: string
): Promise<BookingResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/bookings/${id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to fetch booking');
  }
  return res.json();
}

export async function createBookingPayment(
  bookingId: string,
  accessToken: string
): Promise<{ clientSecret: string }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/payments/create-intent/${bookingId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Payment intent creation failed');
  }
  return res.json();
}

export async function verifyBookingPayment(
  bookingId: string,
  paymentIntentId: string,
  accessToken: string
): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/payments/verify/${bookingId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ paymentIntentId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Payment verification failed');
  }
  return res.json();
}
```

> ✅ **No `guestToken`, no optional params.**  
> ✅ All endpoints require `Authorization: Bearer ${accessToken}`.

---

### ✅ 3. `BookingConfirmationPage.tsx`

```tsx
// BookingConfirmationPage.tsx
import { useEffect, useState } from 'react';
import { useCustomerAuth } from '@/lib/auth';
import { fetchBookingById } from '@/api/cleanFareApi';
import { useSearchParams } from 'react-router-dom';

export default function BookingConfirmationPage() {
  const { user } = useCustomerAuth();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('id');
  const [booking, setBooking] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setError('Please log in to view your booking.');
      return;
    }

    if (!bookingId) {
      setError('Invalid booking ID.');
      return;
    }

    fetchBookingById(bookingId, user.access_token)
      .then(setBooking)
      .catch(setError);
  }, [user, bookingId]);

  if (!user) {
    return (
      <div className="auth-prompt">
        <p>{error}</p>
        {/* Trigger login modal or redirect */}
      </div>
    );
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!booking) return <div>Loading...</div>;

  return (
    <div className="confirmation">
      <h2>Booking Confirmed!</h2>
      <p>ID: {booking.id}</p>
      <p>Status: {booking.status}</p>
    </div>
  );
}
```

> ✅ **No `?token=` parsing**, no `x-guest-token` reading.  
> ✅ Uses `user.access_token` only.

---

### ✅ 4. `backend/src/modules/bookings/bookings.routes.ts`

```ts
// backend/src/modules/bookings/bookings.routes.ts
import { Router } from 'express';
import { authMiddleware } from '../auth/auth.middleware';
import { BookingsController } from './bookings.controller';

const router = Router();

// ✅ All booking routes require authenticated user
router.use(authMiddleware); // attaches `req.user`

// POST /api/v1/bookings — create booking
router.post('/', BookingsController.createBooking);

// GET /api/v1/bookings/:id — fetch booking
router.get('/:id', BookingsController.getBookingById);

export default router;
```

#### ✅ `authMiddleware.ts`

```ts
// backend/src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { supabase } from '../supabase/client';

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'AUTH_REQUIRED' });
  }

  const token = authHeader.slice(7);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: 'INVALID_TOKEN' });
  }

  req.user = user; // ✅ Supabase user object (includes `id`, `email`, `role`)
  next();
};
```

#### ✅ `BookingsController.ts`

```ts
// backend/src/modules/bookings/bookings.controller.ts
import { Request, Response } from 'express';
import { BookingsService } from './bookings.service';

export class BookingsController {
  static async createBooking(req: Request, res: Response) {
    const user = req.user; // ✅ Guaranteed by middleware
    const { from, to, date, ...rest } = req.body;

    try {
      const booking = await BookingsService.createBooking({
        ...rest,
        from,
        to,
        date,
        user_id: user.id,
        customer_email: user.email,
      });

      res.status(201).json(booking);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async getBookingById(req: Request, res: Response) {
    const user = req.user;
    const { id } = req.params;

    try {
      const booking = await BookingsService.getBookingById(id);

      // ✅ Ownership check: user.id OR user.email OR admin
      const isOwner =
        booking.user_id === user.id ||
        booking.customer_email === user.email ||
        user.role === 'admin';

      if (!isOwner) {
        return res.status(403).json({ error: 'FORBIDDEN' });
      }

      res.json(booking);
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  }
}
```

> ✅ **No `timingSafeEqual`, no guest token fallback.**  
> ✅ Strict ownership: `user.id === booking.user_id` OR `user.email === booking.customer_email` OR admin.

---

### ✅ 5. `backend/src/modules/payments/payments.routes.ts` & `payments.service.ts`

#### ✅ `payments.routes.ts`

```ts
// backend/src/modules/payments/payments.routes.ts
import { Router } from 'express';
import { authMiddleware } from '../auth/auth.middleware';
import { PaymentsController } from './payments.controller';

const router = Router();
router.use(authMiddleware); // ✅ All routes require auth

router.post('/create-intent/:bookingId', PaymentsController.createPaymentIntent);
router.post('/verify/:bookingId', PaymentsController.verifyPayment);

export default router;
```

#### ✅ `payments.service.ts`

```ts
// backend/src/modules/payments/payments.service.ts
import { supabase } from '../supabase/client';

export class PaymentsService {
  static async assertBookingOwnership(booking: any, user: any) {
    const isOwner =
      booking.user_id === user.id ||
      booking.customer_email === user.email ||
      user.role === 'admin';

    if (!isOwner) {
      throw new Error('FORBIDDEN');
    }
  }

  static async createPaymentIntent(bookingId: string, user: any) {
    const booking = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (!booking) throw new Error('BOOKING_NOT_FOUND');

    await this.assertBookingOwnership(booking, user);

    // ... Stripe/Payments logic
    return { clientSecret: '...' };
  }

  static async verifyPayment(bookingId: string, paymentIntentId: string, user: any) {
    const booking = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (!booking) throw new Error('BOOKING_NOT_FOUND');

    await this.assertBookingOwnership(booking, user);

    // ... verify with Stripe/Payments provider
    return { success: true };
  }
}
```

> ✅ **No `extractCallerToken`, no `callerToken`.**  
> ✅ Ownership enforced via `assertBookingOwnership`.

---

### ✅ 6. `backend/src/app.ts` — CORS Cleanup

```ts
// backend/src/app.ts
import express from 'express';
import cors from 'cors';

const app = express();

// ✅ Restrict CORS to known origins (e.g., production frontend)
const allowedOrigins = ['https://your-frontend.com', 'http://localhost:3000'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS_NOT_ALLOWED'));
      }
    },
    credentials: true,
  })
);

// ... rest of middleware & routes
```

> ✅ **No wildcard `*` CORS.**  
> ✅ Prevents unauthorized cross-origin requests.

---

## ✅ Final Notes

- **Supabase JWT** (`user.access_token`) is now the *only* auth token used for bookings/payments.
- **Guest flow is fully removed** — unauthenticated users can browse, but cannot book.
- **Ownership checks** are strict and role-aware (`admin` bypass).
- **All APIs are now auditable**: every booking/payment is tied to a real user.

Let me know if you'd like:
- A test script for the Agra→Delhi booking flow (Cypress/Puppeteer)
- Migration script to clean up old guest bookings
- Frontend redirect to `/login` instead of `alert()`