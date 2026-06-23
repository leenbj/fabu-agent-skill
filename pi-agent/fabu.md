# Fabu Skill for Pi Agent

Use this instruction when the user asks Pi Agent to publish local Markdown drafts to Toutiao / 头条号 and CSDN with low token usage.

## Activation

Load and follow `skill/fabu/SKILL.md`.

## Non-Negotiable Rules

- Prefer official backend/API publishing when available and authorized.
- Use Playwright scripts for fixed browser publishing flows.
- Use `agent-browser` only for visible login/security checkpoints and exception diagnosis.
- Pause for login, QR login, CAPTCHA, SMS/phone verification, or account security prompts.
- Never collect, print, store, or replay credentials, OTPs, cookies, tokens, QR contents, or session headers.
- Do not move a file until both Toutiao and CSDN are verified successful.

## Start Command

```bash
python3 skill/fabu/scripts/prepare_articles.py "/path/to/article-folder"
npm run publish -- --folder "/path/to/article-folder"
```

Then process the returned `articles` list one item at a time.

For login-state setup, run `npm run auth:toutiao` and `npm run auth:csdn`. In a non-interactive agent shell, set `FABU_AUTH_WAIT_MS=900000` so the user has enough time to finish QR/SMS login.

For Toutiao cover selection, the deterministic step is: `单图` -> cover tile -> `免费正版图片` -> title keyword search -> random visible image -> confirm.
