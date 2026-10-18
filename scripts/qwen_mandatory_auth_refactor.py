import os
import sys
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

prompt = """# SYSTEM REFACTOR DIRECTIVE: REMOVE GUEST TOKENS & ENFORCE MANDATORY AUTHENTICATION

The product owner has given a strict architectural directive:
"Remove the x-guest-token entirely because we have implemented the signing feature by Google and Supabase, so users will have to login to book any service. If they do not want to login, that's okay for exploring only (checking services and website). When done we will perform a browser test, login with test credentials, and try to book Agra to Delhi."

## OBJECTIVES FOR QWEN 3 CODER:
Provide exact code changes and specifications to transition the system to 100% authenticated booking:
1. `CleanBookingPage.tsx`:
   - If an unauthenticated user clicks to book, prevent submission and prompt them to login (using the existing Supabase Google/Email login).
   - Eliminate all `guest_token`, `sessionStorage` token writes, and pass `accessToken` (Supabase JWT) directly.
2. `cleanFareApi.ts`:
   - Strip `guestToken` / `x-guest-token` from all function signatures (`createBooking`, `fetchBookingById`, `createBookingPayment`, `verifyBookingPayment`).
   - Require `accessToken` as a mandatory parameter (or throw `AUTH_REQUIRED`). Attach `Authorization: Bearer ${accessToken}`.
3. `BookingConfirmationPage.tsx`:
   - Remove `x-guest-token` reading and URL `?token=` parameter extraction.
   - Use `useCustomerAuth().accessToken`. If not logged in, display sign-in prompt.
4. `backend/src/modules/bookings/bookings.routes.ts`:
   - Require `req.user` on `POST /api/v1/bookings`, `GET /api/v1/bookings/:id`.
   - Remove all `timingSafeEqual` guest token checks. Ownership check is purely `booking.user_id === user.id` OR `booking.customer_email === user.email` OR admin.
5. `backend/src/modules/payments/payments.routes.ts` & `payments.service.ts`:
   - Remove `extractCallerToken` and `callerToken`.
   - `assertBookingOwnership(booking, user)` only checks `user.id === booking.user_id` OR `user.email === booking.customer_email` OR admin.
6. `backend/src/app.ts`:
   - Clean up CORS headers.

Provide concise, clean, production-ready TypeScript code snippets for these files.
"""

print("Executing Qwen 3 Coder refactoring consultation...")
response = client.chat.completions.create(
    model="qwen.qwen3-coder-next",
    messages=[
        {"role": "system", "content": "You are Qwen 3 Coder Next, an elite full-stack engineer and security architect."},
        {"role": "user", "content": prompt}
    ],
    temperature=0.1,
    max_tokens=3000,
)

content = response.choices[0].message.content
print("\nRefactor blueprint received. Length:", len(content))

output_path = os.path.join("docs", "QWEN_MANDATORY_AUTH_REFACTOR_PLAN.md")
with open(output_path, "w", encoding="utf-8") as f:
    f.write(content)

print(f"Report written to {output_path}")
