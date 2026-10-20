import time
import json
import urllib.request
import subprocess

def test_inference():
    print("Testing Ollama HTTP API endpoint with qwen3-vl:4b...")
    prompt_payload = {
        "model": "qwen3-vl:4b",
        "prompt": "Why is the sky blue? Answer in one short sentence.",
        "stream": False
    }
    
    t0 = time.time()
    req = urllib.request.Request(
        "http://localhost:11434/api/generate",
        data=json.dumps(prompt_payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    t1 = time.time()
    
    total_time = t1 - t0
    print(f"Total response latency: {total_time:.2f}s")
    print(f"Answer: {data.get('response', '').strip()}")
    eval_count = data.get("eval_count", 0)
    eval_duration_ns = data.get("eval_duration", 1)
    prompt_eval_count = data.get("prompt_eval_count", 0)
    load_duration_ns = data.get("load_duration", 0)
    
    print(f"Model load time: {load_duration_ns / 1e9:.2f}s")
    print(f"Prompt tokens: {prompt_eval_count}")
    print(f"Generated tokens: {eval_count}")
    if eval_duration_ns > 0:
        tps = eval_count / (eval_duration_ns / 1e9)
        print(f"Generation speed: {tps:.2f} tokens/second")
        
    print("\n=== GPU & VRAM Offload Status (nvidia-smi) ===")
    try:
        out = subprocess.check_output(
            ["nvidia-smi", "--query-gpu=gpu_name,memory.total,memory.used,memory.free,utilization.gpu", "--format=csv"],
            text=True
        )
        print(out.strip())
    except Exception as e:
        print("nvidia-smi error:", e)

    print("\n=== Ollama PS (Active Running Models) ===")
    try:
        out2 = subprocess.check_output(["ollama", "ps"], text=True)
        print(out2.strip())
    except Exception as e:
        print("ollama ps error:", e)

if __name__ == "__main__":
    test_inference()
