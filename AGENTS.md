# AGENTS.md

Use `skill/fabu/SKILL.md` as the source of truth for this repository.

Rules:
- Preserve Playwright as the default deterministic batch executor.
- Keep `agent-browser` only as fallback for login/security and exception inspection.
- Keep credential handling user-controlled; never encode secrets or session material.
- Archive files only after both Toutiao and CSDN success states are verified.
- If platform adapters drift, update `cursor/fabu.mdc` and `pi-agent/fabu.md` to point back to the same source workflow.
