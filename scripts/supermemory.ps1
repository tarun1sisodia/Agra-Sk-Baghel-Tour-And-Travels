# scripts/supermemory.ps1 — Windows PowerShell helper for Supermemory CLI
param(
  [string]$cmd = "help",
  [string]$arg1 = "",
  [string]$arg2 = ""
)

$rootDir = Split-Path -Parent $PSScriptRoot
Set-Location $rootDir

if (-not (Test-Path ".env")) {
  Write-Error ".env file not found in $rootDir"
  exit 1
}

$line = Get-Content ".env" | Where-Object { $_ -match "^SUPERMEMORY_API_KEY=" } | Select-Object -First 1
if (-not $line) {
  Write-Error "SUPERMEMORY_API_KEY not configured in .env"
  exit 1
}

$apiKey = $line.Substring("SUPERMEMORY_API_KEY=".Length).Trim().Trim('"').Trim("'")
$env:SUPERMEMORY_API_KEY = $apiKey
$tag = "sk_baghel_travels"

switch ($cmd) {
  "search" {
    $threshold = if ($arg2) { $arg2 } else { "0.25" }
    npx -y supermemory search --namespace $tag "$arg1" --json
  }
  "remember" {
    npx -y supermemory add --namespace $tag "$arg1" --json
  }
  "add" {
    npx -y supermemory add --namespace $tag "$arg1" --json
  }
  "profile" {
    npx -y supermemory profile --namespace $tag --json
  }
  "namespaces" {
    npx -y supermemory namespaces list --json
  }
  "whoami" {
    npx -y supermemory whoami
  }
  Default {
    Write-Host "Usage: .\scripts\supermemory.ps1 <search|remember|add|profile|namespaces|whoami> [args]"
  }
}
