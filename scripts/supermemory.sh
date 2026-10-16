#!/usr/bin/env bash
# scripts/supermemory.sh — Fast Supermemory Context CLI for SK Baghel Tour & Travels
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [ ! -f .env ]; then
  echo "Error: .env file not found in $ROOT_DIR" >&2
  exit 1
fi

API_KEY="$(grep -E '^SUPERMEMORY_API_KEY=' .env | head -n1 | cut -d= -f2- | tr -d '\r\n"' )"
if [ -z "$API_KEY" ]; then
  echo "Error: SUPERMEMORY_API_KEY not configured in .env" >&2
  exit 1
fi

export SUPERMEMORY_API_KEY="$API_KEY"
TAG="sk_baghel_travels"

cmd="${1:-help}"
shift || true

case "$cmd" in
  search)
    query="${1:-}"
    threshold="${2:-0.25}"
    if [ -z "$query" ]; then
      echo "Usage: ./scripts/supermemory.sh search <query> [threshold=0.25]" >&2
      exit 1
    fi
    npx -y supermemory search --namespace "$TAG" "$query" --threshold "$threshold" --json
    ;;
  remember)
    content="${1:-}"
    if [ -z "$content" ]; then
      echo "Usage: ./scripts/supermemory.sh remember \"<Memory or Fact text>\"" >&2
      exit 1
    fi
    npx -y supermemory add --namespace "$TAG" "$content" --json
    ;;
  add)
    file="${1:-}"
    title="${2:-}"
    if [ -z "$file" ]; then
      echo "Usage: ./scripts/supermemory.sh add <file-path> [title]" >&2
      exit 1
    fi
    npx -y supermemory add --namespace "$TAG" "$file" --json
    ;;
  profile)
    npx -y supermemory profile --namespace "$TAG" --json
    ;;
  namespaces)
    npx -y supermemory namespaces list --json
    ;;
  whoami)
    npx -y supermemory whoami
    ;;
  help|*)
    echo "SK Baghel Tour & Travels — Supermemory Context Helper"
    echo ""
    echo "Commands:"
    echo "  ./scripts/supermemory.sh search <query> [threshold]   Fast semantic search in sk_baghel_travels"
    echo "  ./scripts/supermemory.sh remember \"<fact>\"            Store permanent static memory"
    echo "  ./scripts/supermemory.sh add <file> [title]            Ingest document into knowledge graph"
    echo "  ./scripts/supermemory.sh profile                       View synthesized project profile"
    echo "  ./scripts/supermemory.sh whoami                        Check Supermemory connection"
    ;;
esac
