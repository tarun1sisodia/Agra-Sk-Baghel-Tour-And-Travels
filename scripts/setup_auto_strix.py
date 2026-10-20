import os

auto_strix_bat = r"""@echo off
setlocal enabledelayedexpansion

echo =====================================================================
echo           STRIX AUTOMATED SECURITY SCANNER LAUNCHER
echo =====================================================================

:: 1. Check Ollama LLM Server (Port 11434)
echo [*] Checking Ollama server on http://localhost:11434...
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:11434/api/tags' -TimeoutSec 2 -UseBasicParsing; exit 0 } catch { exit 1 }" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [!] Ollama server is not running. Starting Ollama in background...
    start "Ollama Server (cuda_v12)" /min cmd /c "F:\AI\run_ollama.bat"
    timeout /t 3 /nobreak >nul
) else (
    echo [OK] Ollama server is active and responding.
)

:: 2. Check Docker Daemon (Port 2375)
echo [*] Checking Docker daemon on tcp://127.0.0.1:2375...
powershell -Command "try { $t = New-Object System.Net.Sockets.TcpClient('127.0.0.1', 2375); $t.Close(); exit 0 } catch { exit 1 }" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [!] Docker daemon is not running. Starting Docker WSL service...
    start "Docker WSL2 Daemon" /min cmd /c "F:\AI\run_docker.bat"
    timeout /t 4 /nobreak >nul
) else (
    echo [OK] Docker daemon is active on tcp://127.0.0.1:2375.
)

:: 3. Configure Environment Variables
cd /d F:\AI\Strix
set PATH=F:\AI\Docker\bin;%PATH%
set DOCKER_HOST=tcp://127.0.0.1:2375
set STRIX_LLM=ollama/qwen3-vl:4b
set LLM_API_BASE=http://localhost:11434
set STRIX_MCP_CONFIG=F:\AI\Strix\Data\mcp-servers.json
set UV_CACHE_DIR=F:\AI\Cache\uv
set TMP=F:\AI\Temp
set TEMP=F:\AI\Temp
set STRIX_TELEMETRY=0
set STRIX_NO_UPDATE_CHECK=1
set SUPERMEMORY_DATA_DIR=F:\AI\Supermemory\Data

:: 4. Run Strix
echo.
echo =====================================================================
echo [*] Launching Strix Security Scanner...
echo [*] Model: ollama/qwen3-vl:4b (Local GPU)
echo [*] MCP Memory: Supermemory (F:\AI\Supermemory\Data)
echo [*] Target: F:\Dev\Projects\tarunSisodia\ArenaAI
echo =====================================================================
echo.

if "%~1"=="" (
    F:\AI\Strix\Source\.venv\Scripts\strix.exe --target F:\Dev\Projects\tarunSisodia\ArenaAI -n
) else (
    F:\AI\Strix\Source\.venv\Scripts\strix.exe %*
)

echo.
echo [STRIX] Scan finished.
pause
"""

with open(r"F:\AI\run_auto_strix.bat", "w", encoding="utf-8") as f:
    f.write(auto_strix_bat)

print("Created F:\\AI\\run_auto_strix.bat successfully.")
