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
You are the Lead Systems Architect and Email Infrastructure Specialist reviewing SK Baghel Tour & Travels (ArenaAI).

The user completed a real payment on the staging site. Payment verification succeeded (`/api/v1/bookings/.../verify-payment` returned HTTP 200).
However, the server log captured this exact error from Resend:

```
[payments] Resend confirmation email delivery failed for AGR-20261019-1632: {"message":"The gmail.com domain is not verified. Please, add and verify your domain on https://resend.com/domains","name":"validation_error","statusCode":403}
```

The user asked:
"so ijust found about the resend , i think it is not working ? , okay the payment is now working. so the next part is to resend api why this happened use qwen coder for this"

Relevant Code in ArenaAI:
1. `backend/src/config/env.ts`:
```ts
EMAIL_FROM: z.string().default("bookings@agraskbagheltourandtravels.com"),
RESEND_API_KEY: z.string().optional().default(""),
```

2. `backend/src/modules/payments/payments.service.ts`:
```ts
const fromAddress = this.deps.emailFrom || "bookings@skbagheltravels.in";

const res = await this.fetchImpl("https://api.resend.com/emails", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${this.deps.resendApiKey}`,
    "Content-Type": "application/json",
    "Idempotency-Key": `booking-confirmed/${bookingId}`,
  },
  body: JSON.stringify({
    from: fromAddress,
    to: [customerEmail],
    subject: `Confirmed: Your Chauffeur Booking Voucher [${ticketId}] — SK Baghel Tour & Travels`,
    html: voucherHtml,
    text: voucherText,
  }),
});
```

3. `backend/src/app.ts`:
`PaymentsService` is passed `resendApiKey: env.RESEND_API_KEY` and `emailFrom: env.EMAIL_FROM`.

Please provide a comprehensive, clear, and actionable architectural report explaining:
1. Exact Root Cause: Why did Resend return HTTP 403 with `The gmail.com domain is not verified. Please, add and verify your domain on https://resend.com/domains`?
   - Explain why `gmail.com` cannot be used as the sender domain on transactional email providers like Resend (DMARC, SPF, anti-spoofing).
   - What is `EMAIL_FROM` currently set to in the Render staging environment variables?
2. How Resend Works & The Two Options to Fix It:
   - Option A (Immediate / Zero-cost dev & staging fix): Use Resend's built-in testing domain `onboarding@resend.dev` (explain its exact capabilities and constraints).
   - Option B (Production custom domain verification): How to verify a custom domain (e.g., `agraskbagheltourandtravels.com` or `skbagheltravels.in`) on `resend.com/domains` by adding DNS records (DKIM, SPF, MX).
3. Backend Code Hardening:
   - How should the backend handle invalid/freemail `EMAIL_FROM` values (e.g. if someone sets a `@gmail.com` or `@yahoo.com` in `EMAIL_FROM`)?
   - Should it sanitize or fall back gracefully to `onboarding@resend.dev` if an unverified `@gmail.com` address is supplied in non-production?
   - Highlight the architecture resilience: verify why the customer booking confirmation and payment did NOT crash or fail even though Resend threw 403 (the isolated error boundary in `payments.service.ts`).
4. Actionable Step-by-Step Checklist for the user to resolve this immediately in Render and Resend.
"""

print("Querying Qwen Coder on Amazon Bedrock Mantle...")
response = client.chat.completions.create(
    model="qwen.qwen3-coder-next",
    messages=[
        {"role": "system", "content": "You are Qwen, a Principal Systems Architect and Cloud Security Specialist."},
        {"role": "user", "content": prompt}
    ],
    temperature=0.2,
    max_tokens=4000,
)

report = response.choices[0].message.content
print("\n--- REPORT FROM QWEN CODER ---\n")
print(report)

output_path = "docs/QWEN_RESEND_EMAIL_AUDIT_REPORT.md"
with open(output_path, "w", encoding="utf-8") as f:
    f.write(report)

print(f"\nReport written to {output_path}")
