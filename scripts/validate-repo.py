#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

required = [
    "skill/fabu/SKILL.md",
    "skill/fabu/scripts/prepare_articles.py",
    "scripts/publish-batch.mjs",
    "scripts/save-auth.mjs",
    "cursor/fabu.mdc",
    "pi-agent/fabu.md",
    "package.json",
]

missing = [p for p in required if not Path(p).exists()]
if missing:
    raise SystemExit("Missing files: " + ", ".join(missing))

pkg = json.loads(Path("package.json").read_text())
assert "playwright" in pkg["dependencies"]

print("repo validation ok")
