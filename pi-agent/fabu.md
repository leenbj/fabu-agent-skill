# Fabu Skill for Pi Agent

Use this instruction when the user asks Pi Agent to publish local Markdown drafts to Toutiao / 头条号 and CSDN.

## Activation

Load and follow `skill/fabu/SKILL.md`.

## Non-Negotiable Rules

- Browser actions must use only `vercel-labs/agent-browser`.
- Pause for login, QR login, CAPTCHA, SMS/phone verification, or account security prompts.
- Never collect, print, store, or replay credentials, OTPs, cookies, tokens, QR contents, or session headers.
- Do not move a file until both Toutiao and CSDN are verified successful.

## Start Command

```bash
agent-browser skills get core --full
python3 skill/fabu/scripts/prepare_articles.py "/path/to/article-folder"
```

Then process the returned `articles` list one item at a time.

