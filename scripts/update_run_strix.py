from pathlib import Path

content = """@echo off
setlocal
cd /d F:\\AI\\Strix
set PATH=F:\\AI\\Docker\\bin;%PATH%
set DOCKER_HOST=tcp://127.0.0.1:2375
set STRIX_LLM=ollama/qwen3-vl:4b
set LLM_API_BASE=http://localhost:11434
set STRIX_MCP_CONFIG=F:\\AI\\Strix\\Data\\mcp-servers.json
set UV_CACHE_DIR=F:\\AI\\Cache\\uv
set TMP=F:\\AI\\Temp
set TEMP=F:\\AI\\Temp
set STRIX_TELEMETRY=0
set STRIX_NO_UPDATE_CHECK=1
set SUPERMEMORY_DATA_DIR=F:\\AI\\Supermemory\\Data

if "%~1"=="" (
    echo [STRIX] Starting automated security scan on ArenaAI project...
    F:\\AI\\Strix\\Source\\.venv\\Scripts\\strix.exe --target F:\\Dev\\Projects\\tarunSisodia\\ArenaAI -n
) else (
    F:\\AI\\Strix\\Source\\.venv\\Scripts\\strix.exe %*
)
"""

Path(r"F:\AI\run_strix.bat").write_text(content, encoding="utf-8")
print("SUCCESS: F:\\AI\\run_strix.bat updated successfully.")
