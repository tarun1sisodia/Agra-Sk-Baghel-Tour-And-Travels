import os
import sys
import json
from openai import OpenAI

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

client = OpenAI(
    base_url="https://bedrock-mantle.eu-north-1.api.aws/v1",
    api_key=token,
)

print("Reading remediation report and codebase context...")
with open("docs/PAYMENT_AUDIT_REMEDIATION_REPORT.md", encoding="utf-8") as f:
    remediation_report = f.read()

# -------------------------------------------------------------
# TASK 1: Qwen 3 Coder Cross-Verification of Payment System Changes
# -------------------------------------------------------------
print("\n[1/2] Invoking Qwen 3 Coder Next for independent cross-verification of remediations...")
verification_prompt = f"""
You are Qwen 3 Coder Next, an elite software architect and principal security auditor.
Analyze the following payment & booking system audit remediation report for SK Baghel Tour & Travels (tarun1sisodia/ArenaAI), cross-verify the architectural soundness, security guarantees, state machine transitions, and database durability:

=== AUDIT REMEDIATION REPORT ===
{remediation_report}

Please provide a structured, thorough verification review:
1. Executive Assessment & Verdict (Production Readiness).
2. Verification of P0 Header Overwrite fix in Fetch / Fastify.
3. Verification of Webhook Security (Fail-closed secret, timingSafeEqual HMAC, INR currency invariant, and replay recovery).
4. Verification of Upstream Razorpay REST API lookups on client verification.
5. Verification of Guest Access Token ownership proof on booking detail and payment endpoints.
6. Verification of State Vocabulary Synchronization ('confirmed' vs 'paid_confirmed') and Admin Finance alignment.
7. Verification of Migration 0045 (refunds table, indexes, check constraints).
8. Any remaining operational recommendations or staging checklist items before live deployment.
"""

resp1 = client.chat.completions.create(
    model="qwen.qwen3-coder-next",
    messages=[
        {"role": "system", "content": "You are Qwen 3 Coder Next, an elite security auditor and distributed systems architect."},
        {"role": "user", "content": verification_prompt}
    ],
    temperature=0.2,
    max_tokens=4096,
)

verification_text = resp1.choices[0].message.content
print("\n=== Qwen 3 Coder Verification Received ===")
with open("docs/QWEN_CROSS_VERIFICATION_REPORT.md", "w", encoding="utf-8") as f:
    f.write(verification_text)
print("Saved verification report to docs/QWEN_CROSS_VERIFICATION_REPORT.md")

# -------------------------------------------------------------
# TASK 2: Qwen 3 Coder Customer Site Product Requirements Document (PRD)
# -------------------------------------------------------------
print("\n[2/2] Invoking Qwen 3 Coder Next to generate comprehensive Customer Site PRD...")

prd_prompt = f"""
You are Qwen 3 Coder Next, principal product architect and frontend engineering lead.
Generate a comprehensive, authoritative, production-grade Product Requirements Document (PRD) for the Customer Site (`react/`) of SK Baghel Tour & Travels (Monorepo: `tarun1sisodia/ArenaAI`).

The customer application is an ultra-premium, high-conversion, luxury chauffeur taxi and curated tour booking platform serving Agra, the Golden Triangle, and 963 outstation routes across North India.

Here are key system facts:
- **Catalog Scope**:
  - 963 Outstation Routes across 12 North India corridors (e.g. Agra–Delhi, Delhi–Jaipur, Agra–Jaipur, Agra–Lucknow, Mathura, Gwalior, etc.).
  - 13 Core Static Tour Packages + 4 Dynamic CMS Tour Packages (Same Day Taj, Taj Sunrise, Mathura-Vrindavan, Gatimaan Express, Golden Triangle 3D & 4D, Fatehpur Sikri, etc.).
  - 5 Local Tour Packages (Taj Sightseeing, Baby Taj & Mehtab Bagh, Agra Fort & Taj, etc.).
  - 8 Airport & Railway Station Transfers (Agra Cantt/Fort, Kheria Airport, Delhi IGI, etc.).
  - 5 Fleet Tiers: Sedan (Dzire/Etios), Ertiga, Innova Crysta, Tempo Traveller (9-26 seater), Force Urbania.
- **Fare & Pricing Architecture**:
  - Clean Fare engine: Server-authoritative calculation. Exact base fare, per-km rates, toll/state taxes, night allowance, driver charges.
  - Advance Deposit Model: 28% advance deposit via Razorpay Checkout, with remaining 72% balance payable to chauffeur at trip completion.
  - Zero-fallback booking policy: strict vehicle availability checks.
- **Booking & Payment Funnel**:
  - Instant One-Click booking without forced upfront signup.
  - Automatic Google OAuth / Customer Auth prefill of name and email when logged in.
  - Guest Access Token (`x-guest-token`) issued at booking creation for private booking management and payment resume.
  - Razorpay payment modal with fallback / resume link (`/payment/resume/`).
  - Branded luxury email voucher dispatch via Resend post-capture.
  - Interactive Booking Confirmation & Trip Tracking Page (`/booking/confirmation`).
- **Technical & Architectural Standards**:
  - Framework: Vite 7 + React 19 + TypeScript + Tailwind CSS (vanilla tokens).
  - SSG (Static Site Generation): Pre-rendering 72 pages + 23 redirects for sub-second TTFB and pristine SEO.
  - SEO & Multilingual: 63 canonical sitemap URLs, schema.org JSON-LD structured data (TaxiService, TouristTrip), English & Hindi bilingual content.
  - Brand Aesthetics: Luxury British Racing Green / Deep Teal (#0B3440), Copper / Warm Amber (#C77C4D), Sandstone Cream (#F7F3EA), typography with serif editorial headings and crisp sans-serif metrics.
  - Monorepo Topology: Independent customer build writing strictly to `react/dist`, zero server secrets bundled in frontend.

Please organize the PRD into standard, rigorous engineering sections:
1. Document Overview, Vision & Target Audience
2. Core User Personas & Key User Journeys
3. Comprehensive Feature & Functional Requirements:
   - Homepage & Discovery Engine (Corridor Search, Popular Routes, Tour Packages)
   - Route Catalog & Dynamic Corridor Details (963 routes)
   - Tour Packages & Local Sightseeing Engine
   - Vehicle Fleet Matrix & Specification Comparison
   - Clean Fare Calculation & Transparent Tariff Engine
   - Customer Booking Funnel & Intake Forms
   - Payment Gateway Integration (Razorpay, 28% Advance, Resume Flow)
   - Post-Booking Experience (Vouchers, Resend Confirmation, My Bookings)
   - Customer Authentication & Profile Management
4. Non-Functional Requirements (Performance, SSG, Accessibility, Mobile Responsiveness)
5. SEO, Structured Data, Open Graph & Social Cards
6. Security, Privacy & PII Protection (Guest Token architecture)
7. Analytics, Conversion Tracking & Operations Handoff
8. Acceptance Criteria & Quality Gates
"""

resp2 = client.chat.completions.create(
    model="qwen.qwen3-coder-next",
    messages=[
        {"role": "system", "content": "You are Qwen 3 Coder Next, principal product architect and frontend engineering lead."},
        {"role": "user", "content": prd_prompt}
    ],
    temperature=0.2,
    max_tokens=8192,
)

prd_text = resp2.choices[0].message.content
print("\n=== Qwen 3 Coder PRD Received ===")
with open("docs/CUSTOMER_SITE_PRD.md", "w", encoding="utf-8") as f:
    f.write(prd_text)
print("Saved PRD to docs/CUSTOMER_SITE_PRD.md")

print("\nAll tasks completed successfully!")
