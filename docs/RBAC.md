# Role-Based Access Control (RBAC) Documentation — Agra SK Baghel Tour & Travels

**Document Version:** 3.0.0  
**Status:** Production Specification  
**Last Updated:** 2026-11-01

---

## 1. Overview

The platform enforces a strict **two-staff-role model** (plus `customer` for public users) backed by Supabase Auth `app_metadata.role` and enforced on every `/api/v1/admin/*` endpoint via `backend/src/middlewares/roleGuard.ts`.

### Canonical Roles (`user_role_enum`)

| Role | Scope Summary |
|------|---------------|
| **`super_admin`** | Full access to all 16 Admin modules: Operations, Bookings, Trip Status Updates, Payments, Refunds, Promos, Reviews, Inquiries, Content, Catalog, Fleet, SEO, Publishing, Settings, and Audit Logs. |
| **`developer`** | Website Content, Catalog (Routes, Tours, Local Packages, Transfers, Fleet, Monuments), Media Library, SEO Control Center, and Publishing Center only. **Zero access** to Bookings, Customer PII, Payments, Refunds, Promos, Reviews, Inquiries, or System Settings. |
| **`customer`** | Public user: can create bookings and access/pay/download vouchers for their own bookings only. |

---

## 2. Permission Matrix

### 2.1 Admin Panel Modules & Backend `/api/v1/admin/*` Endpoints

| Admin Module | API Prefix | `super_admin` | `developer` |
|--------------|------------|:-------------:|:-----------:|
| Overview & Finance Metrics | `/api/v1/admin/finance/*` | ✓ | ✗ |
| Booking Management & Trip Status | `/api/v1/admin/bookings/*` | ✓ | ✗ |
| Payment & Refund Management | `/api/v1/admin/payments/*` | ✓ | ✗ |
| Promotions & Coupons | `/api/v1/admin/promos/*` | ✓ | ✗ |
| Review Moderation & Invite Links | `/api/v1/admin/reviews/*` | ✓ | ✗ |
| Customer & Rental Enquiries | `/api/v1/admin/inquiries/*`, `/api/v1/admin/rental-enquiries/*` | ✓ | ✗ |
| Global Settings & Policies | `/api/v1/admin/settings/*`, `/api/v1/admin/company-profile/*`, `/api/v1/admin/cancellation-policies/*`, `/api/v1/admin/pet-policy/*` | ✓ | ✗ |
| Audit Center | `/api/v1/admin/audit-logs/*` | ✓ | ✗ |
| Outstation Route Management | `/api/v1/admin/routes/*` | ✓ | ✓ |
| Tour Package Management | `/api/v1/admin/tour-packages/*` | ✓ | ✓ |
| Local Package Management | `/api/v1/admin/local-packages/*` | ✓ | ✓ |
| Transfer Route Management | `/api/v1/admin/transfer-routes/*` | ✓ | ✓ |
| Fleet & Fare Catalog Management | `/api/v1/admin/fare-catalog/*` | ✓ | ✓ |
| Monument Management | `/api/v1/admin/monuments/*` | ✓ | ✓ |
| Media Library & Uploads | `/api/v1/admin/catalog/:id/media` | ✓ | ✓ |
| SEO Control Center (Meta & Redirects) | `/api/v1/admin/seo/*` | ✓ | ✓ |
| Publishing Center (Outbox & Deploy) | `/api/v1/admin/publish/*` | ✓ | ✓ |

---

## 3. Supabase Staff Provisioning SQL

Staff roles MUST be set in `raw_app_meta_data` (server-controlled) and `public.profiles`—never in `raw_user_meta_data` (client-editable):

```sql
-- Provision a super_admin or developer in Supabase SQL Editor:
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object('role', 'super_admin') -- or 'developer'
WHERE LOWER(email) = LOWER('staff@example.com');

UPDATE public.profiles
SET role = 'super_admin', updated_at = NOW() -- or 'developer'
WHERE LOWER(email) = LOWER('staff@example.com');
```

---

## 4. Audit Logging (`admin_audit_logs`)

Every state-changing operation on `/api/v1/admin/*` writes an immutable record to `admin_audit_logs`:
- `actor_id` (`UUID` from JWT `sub`)
- `actor_role` (`super_admin` or `developer`)
- `resource_type` (`booking`, `payment`, `route`, `tour_package`, `seo_metadata`, etc.)
- `resource_id`
- `action` (`status_update`, `refund_issued`, `publish_triggered`, `create`, `update`, `delete`)
- `before_state` & `after_state` (`JSONB`)
- `request_id` (`X-Request-Id`)
