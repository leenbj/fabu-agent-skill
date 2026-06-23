# Codex Usage

Install the skill folder into Codex:

```bash
mkdir -p ~/.codex/skills
cp -R skill/fabu ~/.codex/skills/fabu
```

Then ask Codex:

```text
Use fabu to publish all Markdown drafts in /path/to/folder to Toutiao and CSDN.
```

Codex must read `~/.codex/skills/fabu/SKILL.md` before running browser actions.

Default execution is Playwright-first:

```bash
npm install
npx playwright install chromium
npm run auth:toutiao
npm run auth:csdn
npm run publish -- --folder /path/to/folder
```

Use `agent-browser` only for login/security checkpoints or exception inspection.
