"""Supermemory Persistent Memory Adapter for Strix Security Testing.
Stores findings, false positives, and investigation notes on F:\\AI\\Supermemory\\Data\\.
Enforces sanitization of sensitive credentials (API keys, passwords, bearer tokens).
"""

from __future__ import annotations

import json
import os
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("supermemory")

DATA_DIR = Path(os.environ.get("SUPERMEMORY_DATA_DIR", r"F:\AI\Supermemory\Data"))
DATA_DIR.mkdir(parents=True, exist_ok=True)

FINDINGS_FILE = DATA_DIR / "findings.json"
FALSE_POSITIVES_FILE = DATA_DIR / "false_positives.json"

SENSITIVE_PATTERNS = [
    r"(?i)(password\s*[:=]\s*)['\"]?([^'\"\s]+)['\"]?",
    r"(?i)(bearer\s+)([A-Za-z0-9_\-\.]{15,})",
    r"(?i)(api[_-]?key\s*[:=]\s*)['\"]?([^'\"\s]+)['\"]?",
    r"(?i)(secret\s*[:=]\s*)['\"]?([^'\"\s]+)['\"]?",
    r"(?i)(token\s*[:=]\s*)['\"]?([^'\"\s]+)['\"]?",
]

def sanitize(text: str) -> str:
    cleaned = text
    for pattern in SENSITIVE_PATTERNS:
        cleaned = re.sub(pattern, r"\1[REDACTED_CREDENTIAL]", cleaned)
    return cleaned

def _load_json(file_path: Path) -> list[dict]:
    if not file_path.exists():
        return []
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def _save_json(file_path: Path, data: list[dict]) -> None:
    temp_file = file_path.with_suffix(".tmp")
    with open(temp_file, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    temp_file.replace(file_path)

@mcp.tool()
def save_finding(
    project: str,
    finding_title: str,
    severity: str,
    details: str,
    reproduction_steps: str = "",
) -> str:
    """Save a confirmed security vulnerability or investigation note for a project into persistent memory.
    Automatically scrubs passwords, tokens, and sensitive customer data.
    """
    clean_details = sanitize(details)
    clean_steps = sanitize(reproduction_steps)
    finding_id = f"FIND-{uuid.uuid4().hex[:8].upper()}"

    record = {
        "id": finding_id,
        "project": project.strip().lower(),
        "title": sanitize(finding_title.strip()),
        "severity": severity.strip().upper(),
        "details": clean_details,
        "reproduction_steps": clean_steps,
        "recorded_at": datetime.now(timezone.utc).isoformat(),
    }

    findings = _load_json(FINDINGS_FILE)
    findings.append(record)
    _save_json(FINDINGS_FILE, findings)

    return f"Successfully saved finding [{finding_id}] for project '{project}': {finding_title} ({severity.upper()})"

@mcp.tool()
def retrieve_findings(project: str, query: str = "") -> str:
    """Retrieve historical security findings and notes for a specific project from persistent memory.
    Optionally filter by search keywords in title, details, or severity.
    """
    findings = _load_json(FINDINGS_FILE)
    proj = project.strip().lower()
    matches = [f for f in findings if f.get("project") == proj]

    if query:
        q = query.strip().lower()
        matches = [
            f for f in matches
            if q in f.get("title", "").lower()
            or q in f.get("details", "").lower()
            or q in f.get("severity", "").lower()
        ]

    if not matches:
        return f"No historical findings found for project '{project}' matching query '{query}'."

    lines = [f"### Historical Findings for Project '{project}' ({len(matches)} matches):"]
    for m in matches:
        lines.append(f"- **[{m['id']}]** [{m['severity']}] {m['title']} (Logged: {m['recorded_at']})")
        lines.append(f"  {m['details'][:200]}...")
    return "\n".join(lines)

@mcp.tool()
def record_false_positive(project: str, target: str, issue_title: str, reason: str) -> str:
    """Record a verified false positive or rejected finding to prevent redundant scanning in future tests."""
    record = {
        "id": f"FP-{uuid.uuid4().hex[:8].upper()}",
        "project": project.strip().lower(),
        "target": target.strip(),
        "issue_title": sanitize(issue_title.strip()),
        "reason": sanitize(reason.strip()),
        "recorded_at": datetime.now(timezone.utc).isoformat(),
    }

    fps = _load_json(FALSE_POSITIVES_FILE)
    fps.append(record)
    _save_json(FALSE_POSITIVES_FILE, fps)

    return f"Recorded false positive for project '{project}' on target '{target}': {issue_title}"

@mcp.tool()
def get_project_context(project: str) -> str:
    """Get complete high-level historical context for a target project (confirmed findings count, severity breakdown, false positive rules)."""
    proj = project.strip().lower()
    findings = [f for f in _load_json(FINDINGS_FILE) if f.get("project") == proj]
    fps = [fp for fp in _load_json(FALSE_POSITIVES_FILE) if fp.get("project") == proj]

    severities = {}
    for f in findings:
        sev = f.get("severity", "UNKNOWN")
        severities[sev] = severities.get(sev, 0) + 1

    summary = [
        f"### Project Context: {project}",
        f"- Total Confirmed Findings: {len(findings)}",
        f"- Severity Breakdown: {json.dumps(severities)}",
        f"- Known False Positives: {len(fps)}",
    ]
    if fps:
        summary.append("#### Active False Positive Rules:")
        for fp in fps:
            summary.append(f"- {fp['target']}: {fp['issue_title']} (Reason: {fp['reason']})")

    return "\n".join(summary)

if __name__ == "__main__":
    mcp.run()
