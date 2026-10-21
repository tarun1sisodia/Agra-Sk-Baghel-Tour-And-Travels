import os
import sys
import json
import urllib.request

def resolve_token():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    for env_path in [
        os.path.join(base_dir, "backend", ".env"),
        os.path.join(base_dir, ".env"),
    ]:
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    if "=" in line:
                        k, v = line.strip().split("=", 1)
                        if k.strip() == "AWS_BEARER_TOKEN_BEDROCK":
                            val = v.strip().strip('"').strip("'")
                            if val:
                                return val
    try:
        import winreg
        key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Environment")
        token, _ = winreg.QueryValueEx(key, "AWS_BEARER_TOKEN_BEDROCK")
        if token:
            return token
    except Exception:
        pass

    return os.environ.get("AWS_BEARER_TOKEN_BEDROCK")

def read_file(path):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        return f"[Error reading {path}: {e}]"

def main():
    token = resolve_token()
    if not token:
        print("[ERROR] AWS_BEARER_TOKEN_BEDROCK not resolved.")
        sys.exit(1)

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    # Read relevant source files
    payments_service = read_file(os.path.join(base_dir, "backend", "src", "modules", "payments", "payments.service.ts"))
    payments_repo = read_file(os.path.join(base_dir, "backend", "src", "modules", "payments", "payments.repository.ts"))
    pub_worker = read_file(os.path.join(base_dir, "backend", "src", "modules", "publishing", "publication-worker.ts"))

    audit_prompt = f"""
You are Qwen 3 Coder Next, an elite distributed systems, financial integrity, and PostgreSQL security auditor.
Analyze the following Arena AI (Agra SK Baghel Tour & Travels) code and audit findings, and deliver an authoritative audit report with exact code remediation steps.

## BACKGROUND & AUDIT FINDINGS TO EVALUATE:
1. Razorpay Payment vs Settlement Lifecycle:
   - Payment capture (created -> authorized -> captured) vs Settlement (pending -> processed) to merchant bank account.
   - Why transactions in test mode never settle to bank.
   - Database has 21 captured payment records, but reconciliation_status is pending for all 21, and verified_at / payment_method are NULL.

2. Dual Payment Service Implementations:
   - Older CleanBookingPage flow uses payments.service.ts & payments.repository.ts (mounted under /api/v1/bookings/:id/payment and verify-payment).
   - In payments.service.ts: verifyPayment() handles status == 'failed', but for any other status (including 'authorized' or exceptions during lookup), it falls through to processCaptured(). It does not enforce body.status === 'captured'.
   - In payments.repository.ts: processCaptured() does not update reconciliation_status = 'matched', verified_at = NOW(), or payment_method.
   - Also, if booking is cancelled, processCaptured() updates 0 booking rows, but still marks payment as 'captured'.

3. Publishing Outbox (publication-worker.ts):
   - The route resolver query originally referenced non-existent fares_inr column on outstation_routes table. (Recently fixed with MIN(orv.one_way_amount)).
   - Missing PAGES_DEPLOY_HOOK_URL causes deployment trigger failure.
   - Runtime catalog architecture (/api/v1/catalog, /api/v1/fleet) serves live DB data immediately to customer, explaining why new fleet/fares show on website even when the static outbox deployment fails.
   - Release tracking checks builtAt timestamp freshness rather than git commitSha.

## SOURCE CODE SAMPLES:

### payments.service.ts (verifyPayment section):
```typescript
{payments_service[payments_service.find("async verifyPayment"):payments_service.find("async verifyPayment") + 3500]}
```

### payments.repository.ts (processCaptured section):
```typescript
{payments_repo[payments_repo.find("async processCaptured"):payments_repo.find("async processCaptured") + 1500]}
```

### publication-worker.ts (outstation_routes resolver & processEvent):
```typescript
{pub_worker[pub_worker.find("else if (event.entity_type === \"outstation_route\")"):pub_worker.find("else if (event.entity_type === \"outstation_route\")") + 2000]}
```

## YOUR DELIVERABLES:
1. Executive Summary & Verdict for both Payment Integrity and Publishing Outbox.
2. Step-by-Step Root Cause Analysis of the Payment Integrity flaws.
3. Precise, production-ready code patches for:
   - `backend/src/modules/payments/payments.service.ts`
   - `backend/src/modules/payments/payments.repository.ts`
4. Analysis of the Publishing Outbox, deploy hooks, and release verification.
5. Action checklist for going live with Razorpay safely.
"""

    url = "https://bedrock-mantle.eu-north-1.api.aws/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "qwen.qwen3-coder-next",
        "messages": [
            {"role": "system", "content": "You are Qwen 3 Coder Next, an elite financial software architect and database security auditor specializing in high-reliability payment gateways and distributed state machines."},
            {"role": "user", "content": audit_prompt}
        ],
        "temperature": 0.2,
        "max_tokens": 4096
    }

    print("Sending audit request to Qwen 3 Coder on Amazon Bedrock...")
    req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")

    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            content = data["choices"][0]["message"]["content"]
            print("Audit completed successfully! Tokens received:", len(content))

            docs_dir = os.path.join(base_dir, "docs")
            os.makedirs(docs_dir, exist_ok=True)
            report_file = os.path.join(docs_dir, "QWEN_ARENA_AI_PAYMENT_OUTBOX_AUDIT.md")
            with open(report_file, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"Report written to: {report_file}")
            print("\n" + "="*80)
            print("PREVIEW OF QWEN 3 CODER AUDIT VERDICT:")
            print("="*80)
            print(content[:1500] + "\n...")
    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}: {e.reason}")
        print(e.read().decode("utf-8"))
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
