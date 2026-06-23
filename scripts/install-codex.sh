#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="${CODEX_HOME:-$HOME/.codex}/skills/fabu"

mkdir -p "$(dirname "$DEST")"
if [ -e "$DEST" ]; then
  BACKUP="${DEST}.backup.$(date +%Y%m%d%H%M%S)"
  mv "$DEST" "$BACKUP"
  echo "Backed up existing fabu skill to $BACKUP"
fi
cp -R "$ROOT/skill/fabu" "$DEST"

echo "Installed fabu skill to $DEST"
