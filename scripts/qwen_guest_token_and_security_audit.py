import os
import sys

def get_bearer_token():
    token = os.environ.get("AWS_BEARER_TOKEN_BEDROCK")
    if not token and sys.platform == "win32":
        try:
            import winreg
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Environment") as key:
                token, _ = winreg.QueryValueEx(key, "AWS_BEARER_TOKEN_BEDROCK")
        except Exception:
            pass
    return token

token = get_bearer_token()
if not token:
    raise ValueError("AWS_BEARER_TOKEN_BEDROCK is not set.")

from openai import OpenAI

client = OpenAI(
    base_url="https://bedrock-mantle.eu-north-1.api.aws/v1",
    api_key=token,
)

prompt = """
You are Qwen 3 Coder, serving as the Lead Security & Systems Architect for the production monorepo "SK Baghel Tour & Travels" (ArenaAI).
Evaluate the current codebase, latest changes, and the user's security audit report against two core architectural requirements:
1. Did we use any guest token? The user states: "find did we used the any guest token , because we have defined the access token for any business operation booking, confirmation and pdf and rest."
2. The user specifies: "there is only two profiles one is super admin who is owner of whole project will control admin and customer site , another is user who is come to site for booking."
3. The user has provided an audit report (PR #76 on branch `origin/security/audit-inquiry-webhook-hardening`):
   - Dropping legacy `raw_webhooks` view (migration 0047).
   - Inquiries & webhooks database privilege lockdown: dropped `inquiries_anon_insert` RLS policy, revoked `anon` and `authenticated` table grants on `public.inquiries` and `public.payment_webhook_events`. Fastify backend serves `POST /api/v1/inquiries` using postgres pool.
   - Frontend inquiry response validation: `react/src/services/api.ts` `createInquiry()` checks that `data.id` is a non-empty string.
   - Function search_path pinning: `ALTER FUNCTION public.set_updated_at() SET search_path = pg_catalog;` (migration 0048).
   - Deployment configuration verification: Render API staging vs production Cloudflare Pages `VITE_API_BASE_URL`.

### CODEBASE EVIDENCE GATHERED:
1. **Guest Tokens in Codebase**:
   - `backend/src/modules/bookings/bookings.routes.ts`:
     - Line 125 & 140: In `handleGetBookingPdf` (`GET /api/v1/bookings/:id/pdf`), it checks `const guestToken = req.query?.token || (req.headers["x-guest-access-token"] as string | undefined);` and allows `isGuestAccess = Boolean(guestToken && booking.guest_access_token && guestToken === booking.guest_access_token)`.
   - `backend/src/modules/bookings/bookings.service.ts`:
     - Line 32: `const guestAccessToken = crypto.randomBytes(32).toString("hex");` generated and stored into `bookings.guest_access_token` on every booking creation.
   - `backend/src/modules/bookings/bookings.repository.ts`:
     - `guest_access_token: string` in entity, inserted into database, and queried via `getByGuestAccessToken(token)`.
   - `backend/src/contracts/fare-system.ts`:
     - `BookingCreateResponseSchema` still declares `guest_access_token: z.string()`.
   - `react/src/pages/BookingConfirmationPage.tsx`:
     - Line 180: `const guestToken = (booking as any).guest_access_token;` passed to `downloadBookingPdf(targetId, accessToken || undefined, guestToken);`.
   - `react/src/services/cleanFareApi.ts`:
     - Line 374: `downloadBookingPdf(id: string, accessToken?: string, guestToken?: string)` appends `?token=${encodeURIComponent(guestToken)}` to the URL.
   - `CleanBookingPage.tsx`:
     - Customer booking form strictly enforces customer login (`if (!accessToken) ... return;`) and passes `accessToken` (Bearer token) to `createBooking`, `createBookingPayment`, `verifyBookingPayment`.
   - `BookingConfirmationPage.tsx`:
     - Strictly requires `accessToken` to call `fetchBookingById(bookingId, accessToken)`! If no `accessToken`, it halts and does not display the booking!
     - However, the PDF download button still extracts and forwards the legacy `guest_access_token`.

2. **Roles & Profiles**:
   - User requirement: Exactly TWO roles exist in the system:
     - `super_admin`: System owner who manages admin desk and customer site.
     - `user` (customer): Verified customer who signs in and books cabs/tours.
   - Current Codebase State:
     - `admin/src/lib/types.ts`: `export type AdminRole = "super_admin";` (Admin portal strictly permits ONLY `super_admin`).
     - `admin/src/lib/auth.ts`: Strictly validates `app_metadata.role === "super_admin"`.
     - `backend/src/types/domain.ts`: `USER_ROLES = ["customer", "content_editor", "review_moderator", "dispatcher", "finance_operator", "super_admin"]`.
     - `backend/src/modules/bookings/bookings.routes.ts`: Lines 98 & 142 checks `["admin", "super_admin", "staff", "dispatcher"].includes(user.role)`.
     - `backend/src/modules/payments/payments.service.ts`: Line 45 `assertBookingOwnership` checks `["admin", "super_admin", "staff", "dispatcher"].includes(user.role)`.
     - Notice that "admin", "staff", and "dispatcher" are scattered inconsistently and do not match the real 2-role system (`super_admin` and `user`/`customer`).

3. **User Audit Report & PR #76 Evaluation**:
   - `backend/migrations/0047_security_lockdown_inquiries_webhooks.sql`:
     ```sql
     DROP VIEW IF EXISTS public.raw_webhooks;
     DROP POLICY IF EXISTS inquiries_anon_insert ON public.inquiries;
     REVOKE ALL PRIVILEGES ON TABLE public.inquiries FROM anon, authenticated;
     REVOKE ALL PRIVILEGES ON TABLE public.payment_webhook_events FROM anon, authenticated;
     ```
   - `backend/migrations/0048_harden_set_updated_at_search_path.sql`:
     ```sql
     ALTER FUNCTION public.set_updated_at() SET search_path = pg_catalog;
     ```
   - `react/src/services/api.ts`:
     ```typescript
     const id = json?.data?.id;
     if (typeof id !== "string" || id.trim().length === 0) {
       throw new Error("The server returned an invalid inquiry response. Check that VITE_API_BASE_URL points to the backend API.");
     }
     return { id } as CreateInquiryResponse;
     ```
   - CI environment: `.github/workflows/ci-customer.yml` has `VITE_API_BASE_URL=https://skb-baghel-api-staging.onrender.com`.

### YOUR TASK:
Provide a comprehensive, authoritative, production-grade architectural and security audit report covering:
1. **Did we use any guest token? Full Inventory & Deprecation Blueprint**:
   - Answer directly and unambiguously: YES, where does guest token still exist and why?
   - Identify every place in `backend/` and `react/` where `guest_access_token` is generated, stored, returned, or accepted.
   - Explain why guest tokens represent legacy tech debt and security risk when customer auth (`accessToken`) is already mandatory for all booking operations.
   - Provide the exact step-by-step code and schema plan to deprecate and eliminate guest tokens:
     - Removing `guestToken` from `downloadBookingPdf`, `GET /api/v1/bookings/:id/pdf`, and `BookingConfirmationPage.tsx`.
     - Simplifying `handleGetBookingPdf` to strictly require Bearer `accessToken` matching the booking owner or `super_admin`.
     - Cleaning contracts (`BookingCreateResponseSchema`), repositories, and database schemas.
2. **Two-Profile Role Model Alignment (`super_admin` vs `user`)**:
   - Review the discrepancy between the user's 2-role model and the legacy multi-role checks (`admin`, `staff`, `dispatcher`, etc.).
   - Define the canonical 2-role model:
     - `super_admin`: System owner (admin operations desk, full bypass, audit, rates, refunds, publishing).
     - `user` / `customer`: Authenticated customer (booking ownership, PDF vouchers, profile).
   - Specify the exact updates needed in `backend/src/types/domain.ts`, `backend/src/modules/bookings/bookings.routes.ts`, and `backend/src/modules/payments/payments.service.ts`.
3. **Assessment of the User's Security Audit Report (PR #76)**:
   - Provide an in-depth review of each of the 6 findings (F-01 to F-06) and the remediations in PR #76.
   - Validate whether dropping `inquiries_anon_insert` and revoking `anon`/`authenticated` grants causes any issues with Fastify's postgres pool connection.
   - Validate the `react/src/services/api.ts` fix against silent frontend false-successes.
   - Review `set_updated_at()` search_path pinning against CVE / security best practices.
   - Clarify the staging vs production Render / Cloudflare configuration risk and how to verify it.
4. **Actionable Implementation Checklist**:
   - Concrete instructions and diffs to execute the guest token removal, role consolidation, and PR #76 integration.
"""

print("Running Qwen Coder deep audit...")
response = client.chat.completions.create(
    model="qwen.qwen3-coder-next",
    messages=[
        {"role": "system", "content": "You are Qwen 3 Coder, a world-class principal security engineer and software architect. Provide clear, highly structured, in-depth technical analysis and actionable code diffs."},
        {"role": "user", "content": prompt}
    ],
    temperature=0.2,
    max_tokens=4096,
)

content = response.choices[0].message.content
print("\n=== QWEN CODER AUDIT COMPLETED ===")
output_file = r"f:\Dev\Projects\tarunSisodia\ArenaAI\docs\QWEN_SECURITY_AUDIT_AND_GUEST_TOKEN_REPORT.md"
with open(output_file, "w", encoding="utf-8") as f:
    f.write(content)

print(f"Report written to {output_file}")
