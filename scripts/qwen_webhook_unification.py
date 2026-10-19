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
You are the Lead Systems Architect and Database Specialist reviewing SK Baghel Tour & Travels (ArenaAI).

The user has provided an exact screenshot from the live Razorpay Merchant Dashboard for their staging/production setup:
- Webhook URL: `https://skb-baghel-api-staging.onrender.com/api/v1/payments/webhooks/razorpay`
- Active Events: payment.pending, payment.failed, payment.captured, refund.processed
- Status: Enabled

The user asked:
1. "here is the webhook url now what you wanna say about the multiple alias url of same url ?"
   - Why do we have multiple alias paths like `/webhooks/payment`, `/api/v1/webhooks/payment`, `/webhooks/razorpay`, `/api/v1/webhooks/razorpay` when Razorpay has only ONE exact configured URL: `/api/v1/payments/webhooks/razorpay`?
   - Should we prune and clean these extra aliases to keep the API contract clean and exact?
2. "and as we have designed the payment_webhook_events, we should use qwen coder and find all the codebase where the legacy raw_webhook used so we can replace it with our canonical , because our contracts are defined no need to user another tables and make codebase more complex ..first we need to find every line of code where we used raw_webhook then we need to replace it with new canonical and make sure it will not break other working thins"

Current codebase state regarding webhooks:
1. Database Schema:
   `payment_webhook_events` is the canonical table created in Migration 0038:
   ```sql
   create table payment_webhook_events (
     id uuid primary key default gen_random_uuid(),
     provider text not null,
     event_id text not null,
     event_type text not null,
     payload jsonb not null,
     processed boolean not null default false,
     received_at timestamptz not null default now(),
     unique (provider, event_id)
   );
   ```
2. Codebase scan for `raw_webhooks`:
   - `backend/scripts/seed.ts` (lines 523-536):
     Still attempts: `INSERT INTO raw_webhooks (id, provider, event_id, event_type, payload, payload_hash, processed, received_at) ... ON CONFLICT (event_id)`
     Must be updated to `payment_webhook_events` with `ON CONFLICT (provider, event_id)`.
   - `backend/src/db/postgres.ts` (lines 2207-2231):
     We updated `webhooks.record()`, `markProcessed()`, and `hasEvent()` to use `payment_webhook_events`.
   - `backend/src/modules/payments/payments.routes.ts`:
     Clean Fare routes. Currently has:
     ```ts
     app.post("/webhooks/payment", webhookOpts, handleWebhook);
     app.post("/api/v1/webhooks/payment", webhookOpts, handleWebhook);
     app.post("/webhooks/razorpay", webhookOpts, handleWebhook);
     app.post("/api/v1/webhooks/razorpay", webhookOpts, handleWebhook);
     app.post("/api/v1/payments/webhooks/razorpay", webhookOpts, handleWebhook);
     app.post("/api/v1/payments/webhooks/:provider", webhookOpts, handleWebhook);
     ```
     We need your architectural guidance on standardizing on `/api/v1/payments/webhooks/razorpay` and `/api/v1/payments/webhooks/:provider`.
   - `backend/migrations/0046_create_raw_webhooks_view.sql`:
     We created this view as an interim bridge. If we eliminate all code references to `raw_webhooks`, can we keep or drop this view cleanly?

Please provide:
1. Clear architectural opinion on whether to keep only the single canonical webhook route matching Razorpay (`/api/v1/payments/webhooks/razorpay` and parameterized `/api/v1/payments/webhooks/:provider`) vs having multiple loose aliases.
2. Complete, line-by-line audit and replacement instructions for replacing all legacy `raw_webhooks` references with canonical `payment_webhook_events`.
3. Recommendations to ensure zero regression across testing and production deployments.
"""

print("Consulting Qwen 3 Coder on Bedrock Mantle...")
response = client.chat.completions.create(
    model="qwen.qwen3-coder-next",
    messages=[
        {"role": "system", "content": "You are Qwen 3 Coder, Lead Systems Architect and Database Specialist."},
        {"role": "user", "content": prompt}
    ],
    temperature=0.1,
    max_tokens=2500,
)

content = response.choices[0].message.content
print("\n--- QWEN 3 CODER RESPONSE ---\n")
print(content)

with open("docs/QWEN_WEBHOOK_CANONICAL_UNIFICATION_REPORT.md", "w", encoding="utf-8") as f:
    f.write(content)

print("\nSaved report to docs/QWEN_WEBHOOK_CANONICAL_UNIFICATION_REPORT.md")
