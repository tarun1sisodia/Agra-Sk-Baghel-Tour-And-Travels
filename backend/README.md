# Agra SK Baghel Tour & Travels — Backend API

Node.js 22 + TypeScript + Fastify service that owns fares, bookings, payments, admin dispatch, catalog, reviews, and notifications.

PostgreSQL (Supabase) is the system of record. MongoDB is optional and never holds money or booking state. The browser is never trusted for amounts or payment success.

## Quick start

```bash
cd backend
cp .env.example .env
npm install
npm run typecheck
npm test
npm run dev
```

The API listens on `http://localhost:4000`.

```bash
curl -s http://localhost:4000/health
curl -s http://localhost:4000/ready
```

Without `DATABASE_URL` the process still starts in development and test using an in-memory store so engineers can exercise the first vertical slice locally. Production refuses to boot without PostgreSQL.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Fastify with hot reload |
| `npm test` | Unit, integration, and contract tests |
| `npm run typecheck` | Strict TypeScript |
| `npm run migrate` | Apply `migrations/*.sql` to `DATABASE_URL` |
| `npm run seed` | Development reference data |

## First vertical slice

1. `POST /api/v1/fares/calculate` — server-authoritative fare.
2. `POST /api/v1/bookings/draft` — persist fare snapshot + `AGR-YYYYMMDD-XXXX`.
3. `GET /api/v1/bookings/:ticketId` — verified, masked voucher.
4. `POST /api/v1/payments/create-checkout` — provider checkout from persisted advance.
5. `POST /api/v1/payments/webhooks/:provider` — signed reconciliation only.

A client redirect never marks a booking paid.

## Architecture

See the repository documents:

- `BACKEND_RULES.md`
- `BACKEND_ARCHITECTURE_PLAN.md`
- `API.md`
- `MODELS.md`
- `PLAN.md`
