import os
import sys
import json
from pathlib import Path

# Set data directory
os.environ["SUPERMEMORY_DATA_DIR"] = r"F:\AI\Supermemory\Data"
sys.path.insert(0, r"F:\AI\Strix\Data")

import supermemory_mcp as sm

def run_tests():
    print("=== TEST 1: Saving Finding with Sensitive Data Scrubbing ===")
    res1 = sm.save_finding(
        project="arena_customer",
        finding_title="Exposed Razorpay Key ID in Public Scripts",
        severity="medium",
        details="Found api_key: 'dummy_sample_secret_token_abc123' and token: 'sample_tok_123' in client bundle",
        reproduction_steps="1. Inspect index.js\n2. Search for password='SuperSecretPassword!'"
    )
    print("Result:", res1)
    
    print("\n=== TEST 2: Retrieve Findings with Keyword Filter ===")
    res2 = sm.retrieve_findings(project="arena_customer", query="Razorpay")
    print(res2)
    assert "[REDACTED_CREDENTIAL]" in res2, "ERROR: Sensitive pattern was not scrubbed!"
    print("Verification: Sensitive credential was properly [REDACTED_CREDENTIAL]!")
    
    print("\n=== TEST 3: Record Verified False Positive ===")
    res3 = sm.record_false_positive(
        project="arena_customer",
        target="http://localhost:5173/api/health",
        issue_title="Public Unauthenticated Health Endpoint",
        reason="Health check is intentionally public for Cloudflare Workers / load balancer probes"
    )
    print("Result:", res3)
    
    print("\n=== TEST 4: Project Context Summary ===")
    context = sm.get_project_context(project="arena_customer")
    print(context)
    
    print("\n=== TEST 5: Verify Storage On F: Only ===")
    data_dir = Path(r"F:\AI\Supermemory\Data")
    findings_file = data_dir / "findings.json"
    fps_file = data_dir / "false_positives.json"
    assert findings_file.exists(), "findings.json does not exist on F:!"
    assert fps_file.exists(), "false_positives.json does not exist on F:!"
    print(f"Verified files on disk: {findings_file} ({findings_file.stat().st_size} bytes)")
    print(f"Verified files on disk: {fps_file} ({fps_file.stat().st_size} bytes)")
    
    print("\n>>> ALL SUPERMEMORY INTEGRATION TESTS PASSED SUCCESSFULLY! <<<")
    return True

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
