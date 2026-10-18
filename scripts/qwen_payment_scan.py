import os
import sys
import json
from pathlib import Path

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

def read_file_safe(path_str):
    p = Path(path_str)
    if not p.exists():
        return f"[FILE NOT FOUND: {path_str}]"
    try:
        return p.read_text(encoding="utf-8", errors="replace")
    except Exception as e:
        return f"[ERROR READING {path_str}: {e}]"

def main():
    token = get_bearer_token()
    if not token:
        print("ERROR: AWS_BEARER_TOKEN_BEDROCK is not set.")
        sys.exit(1)

    from openai import OpenAI
    client = OpenAI(
        base_url="https://bedrock-mantle.eu-north-1.api.aws/v1",
        api_key=token,
    )

    repo_root = Path(__file__).resolve().parent.parent
    print(f"Scanning codebase from root: {repo_root}")

    # Gather codebase artifacts for context
    payment_rules = read_file_safe(repo_root / ".agents" / "rules" / "PAYMENT_AGENT_RULES.md")
    payment_spec = read_file_safe(repo_root / "docs" / "PAYMENT_SYSTEM.md")
    
    clean_payments_routes = read_file_safe(repo_root / "backend" / "src" / "modules" / "payments" / "payments.routes.ts")
    clean_payments_service = read_file_safe(repo_root / "backend" / "src" / "modules" / "payments" / "payments.service.ts")
    clean_payments_repo = read_file_safe(repo_root / "backend" / "src" / "modules" / "payments" / "payments.repository.ts")
    
    legacy_payment_routes = read_file_safe(repo_root / "backend" / "src" / "modules" / "payments" / "payment.routes.ts")
    legacy_payment_controller = read_file_safe(repo_root / "backend" / "src" / "modules" / "payments" / "payment.controller.ts")
    
    admin_routes = read_file_safe(repo_root / "backend" / "src" / "modules" / "admin" / "admin.routes.ts")
    admin_controller = read_file_safe(repo_root / "backend" / "src" / "modules" / "admin" / "admin.controller.ts")
    admin_service = read_file_safe(repo_root / "backend" / "src" / "modules" / "admin" / "admin.service.ts")
    
    app_mounts = read_file_safe(repo_root / "backend" / "src" / "app.ts")
    # Extract app mount area (around line 300 to 380)
    app_lines = app_mounts.splitlines()
    app_snippet = "\n".join(app_lines[295:385]) if len(app_lines) > 385 else app_mounts

    react_clean_fare_api = read_file_safe(repo_root / "react" / "src" / "services" / "cleanFareApi.ts")
    react_clean_booking_page = read_file_safe(repo_root / "react" / "src" / "features" / "booking" / "clean" / "CleanBookingPage.tsx")
    # Extract payment section from CleanBookingPage.tsx (around lines 580 to 630)
    cbp_lines = react_clean_booking_page.splitlines()
    cbp_snippet = "\n".join(cbp_lines[575:635]) if len(cbp_lines) > 635 else react_clean_booking_page

    admin_fe_api = read_file_safe(repo_root / "admin" / "src" / "lib" / "api.ts")
    admin_fe_finance = read_file_safe(repo_root / "admin" / "src" / "pages" / "FinancePage.tsx")

    migration_sql = read_file_safe(repo_root / "backend" / "migrations" / "0038_fare_system_clean_rebuild.sql")
    # Extract payments table from migration
    mig_lines = migration_sql.splitlines()
    mig_snippet = "\n".join(mig_lines[250:280]) if len(mig_lines) > 280 else migration_sql

    system_prompt = """You are Qwen 3 Coder, acting as a Principal Payment Systems Security & Integration Architect.
You are performing a rigorous, comprehensive, full-stack scan of the Payment System for "SK Baghel Tour & Travels" (Agra taxi & tour booking platform).

The platform comprises:
- Customer Frontend: React (`react/`)
- Operations Desk: Admin Panel (`admin/`)
- Backend API: Fastify + PostgreSQL (`backend/`)
- Payment Gateway: Razorpay (India, INR paise)

The user is preparing to deploy to PRODUCTION and needs a deep, forensic audit.
Examine every contract, API route, controller, service, repository, database schema, and frontend/admin caller.

Your scan MUST analyze and report on:
1. ARCHITECTURAL DUALITY & DEAD/COLLIDING ROUTES:
   - Identify legacy vs Clean Fare payment routes (`payment.routes.ts` vs `payments.routes.ts`, `payment.service.ts` vs `payments.service.ts`).
   - What happens when both are registered in `app.ts`? Are there colliding or shadowed routes?
   - Which endpoints are actually called by the customer frontend (`CleanBookingPage.tsx` & `cleanFareApi.ts`)?
   - Which endpoints are expected by the Admin Desk (`admin/src/pages/FinancePage.tsx` & `admin/src/lib/api.ts`)?

2. END-TO-END CONTRACT & SCHEMA ALIGNMENT:
   - Trace `POST /api/v1/bookings/:id/payment` (order creation):
     Does the frontend request match backend schema? Does the backend response structure match what `cleanFareApi.ts` and Razorpay Checkout expect?
   - Trace `POST /api/v1/bookings/:id/verify-payment` (client verification):
     Does the frontend Razorpay callback submit `{ razorpay_payment_id, razorpay_order_id, razorpay_signature }`? Does backend verify it?
   - Trace Webhook handling (`POST /api/v1/webhooks/razorpay` / `POST /api/v1/webhooks/payment`):
     Signature validation (HMAC SHA-256), raw body handling, idempotency, event deduplication.
   - Trace Admin Desk Finance:
     `GET /api/v1/ops/admin/payments` and `POST /api/v1/ops/admin/refunds`.
     CRITICAL: Does `createAdminController` query the same database table/records that `PaymentsRepository` writes to, or does it query legacy `db.payments`? Will admin see bookings paid via Clean Fare? Can admin issue refunds?

3. SECURITY & MONEY INTEGRITY AUDIT:
   - Is advance calculation server-authoritative? (Can the client tamper with price or advance?)
   - Are amounts stored and transferred strictly in integer paise (check min/max/rounding)?
   - Can race conditions occur if client verification and webhook arrive simultaneously?
   - Is single-charge idempotency enforced per booking (e.g., preventing multiple active/captured payments for one booking)?
   - Are secrets (Razorpay Key Secret, Webhook Secret) properly isolated on the server and never leaked to frontend bundles?

4. ACTIONABLE REMEDIATION & DE-DUPLICATION ROADMAP:
   - Precise list of files that need to be de-duplicated or retired.
   - Exact discrepancies between Frontend contracts, Admin contracts, and Backend handlers.
   - Step-by-step checklist required before enabling LIVE production keys."""

    user_prompt = f"""Here are the codebase files and specifications for the full scan:

=== SPECIFICATIONS & OPERATING RULES ===
--- PAYMENT_AGENT_RULES.md ---
{payment_rules}

--- PAYMENT_SYSTEM.md (Overview & Trust Boundary) ---
{payment_spec[:4000]}

=== DATABASE MIGRATION (Clean Fare System) ===
{mig_snippet}

=== BACKEND ROUTE MOUNTING (backend/src/app.ts) ===
{app_snippet}

=== CLEAN FARE PAYMENTS MODULE ===
--- backend/src/modules/payments/payments.routes.ts ---
{clean_payments_routes}

--- backend/src/modules/payments/payments.repository.ts ---
{clean_payments_repo}

--- backend/src/modules/payments/payments.service.ts (Key Sections) ---
{clean_payments_service[:12000]}

=== LEGACY PAYMENT MODULE ===
--- backend/src/modules/payments/payment.routes.ts ---
{legacy_payment_routes}

--- backend/src/modules/payments/payment.controller.ts ---
{legacy_payment_controller}

=== ADMIN DESK BACKEND MODULE ===
--- backend/src/modules/admin/admin.routes.ts (Payment & Refund handlers) ---
{admin_routes}

--- backend/src/modules/admin/admin.controller.ts (Payment & Refund methods) ---
{admin_controller}

--- backend/src/modules/admin/admin.service.ts (listPayments method) ---
{admin_service[4000:7500]}

=== CUSTOMER FRONTEND CALLERS ===
--- react/src/services/cleanFareApi.ts (Payment methods) ---
{react_clean_fare_api[12000:15000]}

--- react/src/features/booking/clean/CleanBookingPage.tsx (Razorpay Checkout invocation) ---
{cbp_snippet}

=== ADMIN FRONTEND DESK CALLERS ===
--- admin/src/lib/api.ts (fetchAdminPayments & refundAdminBooking) ---
{admin_fe_api[6000:10500]}

--- admin/src/pages/FinancePage.tsx (Key logic) ---
{admin_fe_finance[:4000]}

Please conduct a thorough, exhaustive, production-grade audit scan now.
Format your report with executive summary, severity findings (CRITICAL, HIGH, MEDIUM, LOW), detailed contract alignment analysis, and clear remediation instructions."""

    print("Submitting prompt to Bedrock Mantle Qwen 3 Coder Next...")
    response = client.chat.completions.create(
        model="qwen.qwen3-coder-next",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.2,
        max_tokens=4096,
    )

    report_content = response.choices[0].message.content
    print("\nScan completed successfully!\n")

    output_path = repo_root / "docs" / "QWEN_PAYMENT_SYSTEM_AUDIT_REPORT.md"
    output_path.write_text(report_content, encoding="utf-8")
    print(f"Report saved to: {output_path}")

    print("\n--- EXECUTIVE SUMMARY PREVIEW ---")
    print("\n".join(report_content.splitlines()[:50]))

if __name__ == "__main__":
    main()
