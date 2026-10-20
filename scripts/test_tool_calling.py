import json
import urllib.request
import sys

def test_tool_calling():
    print("Testing structured tool calling against Ollama /api/chat...")
    payload = {
        "model": "qwen3-vl:4b",
        "messages": [
            {
                "role": "user",
                "content": "Please save a security finding: project is 'arena-ai', title is 'SQL Injection in Search', severity is 'critical', details are 'Found SQLi in /api/search?q='"
            }
        ],
        "tools": [
            {
                "type": "function",
                "function": {
                    "name": "save_finding",
                    "description": "Save a confirmed security vulnerability into persistent memory",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "project": {"type": "string"},
                            "finding_title": {"type": "string"},
                            "severity": {"type": "string"},
                            "details": {"type": "string"}
                        },
                        "required": ["project", "finding_title", "severity", "details"]
                    }
                }
            }
        ],
        "stream": False
    }
    
    req = urllib.request.Request(
        "http://localhost:11434/api/chat",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        
    msg = data.get("message", {})
    tool_calls = msg.get("tool_calls", [])
    print("Response role:", msg.get("role"))
    print("Response content:", msg.get("content"))
    print("Tool calls count:", len(tool_calls))
    for i, tc in enumerate(tool_calls):
        fn = tc.get("function", {})
        print(f"[{i+1}] Function: {fn.get('name')}")
        print(f"    Arguments: {json.dumps(fn.get('arguments'), indent=2)}")
        
    if len(tool_calls) > 0:
        print("\n>>> STRUCTURED TOOL CALLING TEST: PASSED <<<")
        return True
    else:
        print("\n>>> STRUCTURED TOOL CALLING TEST: FAILED (No tool call returned) <<<")
        return False

if __name__ == "__main__":
    success = test_tool_calling()
    sys.exit(0 if success else 1)
