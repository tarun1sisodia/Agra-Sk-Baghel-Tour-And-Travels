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
You are the Lead Solutions Architect and Senior Backend Engineer for SK Baghel Tour & Travels (ArenaAI).
Monorepo stack:
- Backend: Fastify + TypeScript (Node.js 22+, ESM `type: module`)
- Database: PostgreSQL (Supabase managed, migration 0038 schema)
- Payments: Razorpay (Clean Fare pipeline, HMAC SHA256)
- Email: Resend (`https://api.resend.com/emails`)
- Customer Site: React + Vite + TypeScript (Cloudflare Pages)

The user has requested the implementation of:
# ArenaAI: Full PDF Booking Confirmation Implementation Plan

Summary of user's proposed plan:
- Target: Generate branded PDF booking confirmation vouchers and attach them to the existing Resend confirmation email, plus allow customer-side authenticated downloads.
- Tool: `@pdfme/generator` in `backend/`
- Architecture:
  1. Phase 1: Install `@pdfme/generator` in `backend/package.json`
  2. Phase 2: Create reusable branded PDF template (`booking-pdf.template.ts`) & service (`booking-pdf.service.ts`)
  3. Phase 3: Extend `sendBookingConfirmationEmail()` in `payments.service.ts` to attach the PDF to Resend API call (`attachments: [{ filename, content }]`)
  4. Phase 4: Preserve payment capture & email reliability (isolated error boundaries, idempotent delivery, no rollback on email/PDF failure)
  5. Phase 5: Customer PDF access endpoint (`GET /api/v1/bookings/:id/pdf` with auth guard checking customer ownership)
  6. Phase 6: Unit & integration tests (`booking-pdf.service.test.ts`, extending `bookings-payments.test.ts`)
  7. Phase 7: Verification & deployment

The user also asked:
"email from -> do i needd to set the full line on render or the subdomain is enough as per codebase 'Agra SK Baghel Tour and Travels <bookings@notifications.agraskbagheltourandtravels.com>'"

Please provide a comprehensive, rigorous, and actionable plan:
1. First, provide the exact answer and guidelines regarding `EMAIL_FROM`:
   - Clarify whether to set `Agra SK Baghel Tour and Travels <bookings@notifications.agraskbagheltourandtravels.com>` or plain `bookings@notifications.agraskbagheltourandtravels.com`.
   - Explain how Resend and SMTP handle display names vs email addresses.
   - Confirm how our code has been updated to parse the domain cleanly even with the display name format.
2. Provide a validated, phase-by-phase architectural blueprint for the PDF Booking Confirmation feature:
   - Verify compatibility of `@pdfme/generator` with Node.js 22+ ESM in backend.
   - Define the exact schema and fields for the branded voucher PDF (Ticket ID, Customer Name, Phone, Category, Pickup Date/Time IST, Pickup/Drop addresses, Total Amount, Advance Paid, Balance Amount, Payment ID, 24/7 Helpline).
   - Detail the Resend attachment API structure (`attachments: [{ filename: `${ticketId}-voucher.pdf`, content: base64String }]`).
   - Define the customer download endpoint contract (`GET /api/v1/bookings/:id/pdf`), auth requirements, and streaming PDF headers (`Content-Type: application/pdf`, `Content-Disposition: attachment; filename=...`).
   - Detail the exact test cases required to maintain 100% test pass rate.
3. Formulate the precise implementation roadmap and next immediate step.
"""

print("Querying Qwen Coder on Amazon Bedrock Mantle...")
response = client.chat.completions.create(
    model="qwen.qwen3-coder-next",
    messages=[
        {"role": "system", "content": "You are Qwen, a Principal Systems Architect and Staff Engineer."},
        {"role": "user", "content": prompt}
    ],
    temperature=0.2,
    max_tokens=4000,
)

report = response.choices[0].message.content
print("\n--- REPORT FROM QWEN CODER ---\n")
print(report)

output_path = "docs/QWEN_PDF_CONFIRMATION_IMPLEMENTATION_PLAN.md"
with open(output_path, "w", encoding="utf-8") as f:
    f.write(report)

print(f"\nPlan written to {output_path}")
