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

print("Reading relevant codebase files for cross-verification...")

with open("admin/src/pages/LocalTransfersPage.tsx", encoding="utf-8") as f:
    local_transfers_code = f.read()

with open("backend/src/modules/local-packages/local-packages.service.ts", encoding="utf-8") as f:
    local_pkg_service_code = f.read()

with open("backend/src/modules/local-packages/local-packages.schema.ts", encoding="utf-8") as f:
    local_pkg_schema_code = f.read()

with open("react/src/pages/ReviewPage.tsx", encoding="utf-8") as f:
    review_page_code = f.read()

with open("admin/src/pages/FinancePage.tsx", encoding="utf-8") as f:
    finance_page_code = f.read()

prompt = f"""
You are Qwen 3 Coder Next, an elite software architect and principal full-stack reviewer.
The user wants you to inspect the codebase and cross-verify 5 specific reported issues to determine whether they ACTUALLY exist in the code right now.

Here are the 5 reported issues:
1. Package Save/Publish Flow (Local Sightseeing & Transfers):
   - Newly created packages default to 'draft' or fail to persist selected 'published' / 'active' status.
   - Admin UI in LocalTransfersPage.tsx does not send the status field or the backend handler forces 'draft'.
2. Edit-Package Flow & Immutable Fields:
   - Updating re-validates immutable fields (like package_code or slug).
   - If package_code is unchanged, does backend/frontend fail validation or lock up the modal in a saving/disabled state?
3. Customer Review Preview Page:
   - Preview route (/review or /review/:token) hard-fails on fetch errors and displays "Review link unavailable" instead of rendering the review form or a graceful fallback for previewing.
4. Finance Dashboard Missing Sections:
   - Finance & Refunds page (FinancePage.tsx) is missing sections for settlement balance and chauffeur cash collection audit (72% cash balance ledger).
5. Finance Live Data Connection & Payment Ingestion:
   - Finance dashboard payment ingestion and ledger connectivity.

=== CODE EVIDENCE ===

[FILE 1: admin/src/pages/LocalTransfersPage.tsx]
{local_transfers_code[:4000]}

[FILE 2: backend/src/modules/local-packages/local-packages.service.ts]
{local_pkg_service_code}

[FILE 3: backend/src/modules/local-packages/local-packages.schema.ts]
{local_pkg_schema_code}

[FILE 4: react/src/pages/ReviewPage.tsx]
{review_page_code}

[FILE 5: admin/src/pages/FinancePage.tsx]
{finance_page_code[:4500]}

For EACH of the 5 issues:
1. Verdict: DOES IT REALLY EXIST IN THE CODE? (YES / NO / PARTIAL)
2. Specific Line Evidence: Point out exact lines, variables, and handler logic proving your verdict.
3. Root Cause Analysis: Explain why it happens.
4. Recommended Precise Fix: Outline the exact code changes needed to remediate it cleanly.
"""

print("Sending audit request to Bedrock Mantle Qwen 3 Coder Next...")
response = client.chat.completions.create(
    model="qwen.qwen3-coder-next",
    messages=[
        {"role": "system", "content": "You are Qwen 3 Coder Next, an elite software architect and principal code auditor."},
        {"role": "user", "content": prompt}
    ],
    temperature=0.1,
    max_tokens=4096,
)

print("\n================== QWEN 3 CODER NEXT AUDIT VERDICT ==================")
verdict_content = response.choices[0].message.content
print(verdict_content)

with open("docs/QWEN_ADMIN_PANEL_AUDIT_VERDICT.md", "w", encoding="utf-8") as out:
    out.write(verdict_content)

print("\nSaved full audit report to docs/QWEN_ADMIN_PANEL_AUDIT_VERDICT.md")
