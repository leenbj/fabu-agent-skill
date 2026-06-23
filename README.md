# Fabu Agent Skill

Reusable AI-agent skill for publishing local Markdown news drafts to both Toutiao / 头条号 and CSDN with a Playwright-first batch executor.

The skill is designed for Codex, Pi Agent, Cursor, and other agent platforms that can run shell commands. It minimizes token use by keeping fixed browser work in Playwright scripts and using the agent only for decisions and exceptions.

## What It Does

- Reads `.md` drafts from a local folder.
- Extracts title, body, and summary.
- Publishes each article to Toutiao and CSDN through deterministic Playwright adapters.
- Selects required publishing options.
- Moves the file to `已上传` or `已完成` only after both sites succeed.
- Stores compact JSON run results in `.fabu-results/latest.json`.

## Install

```bash
git clone https://github.com/leenbj/fabu-agent-skill.git
cd fabu-agent-skill
npm install
npx playwright install chromium
./scripts/install-codex.sh
```

For Cursor, copy `cursor/fabu.mdc` to your project `.cursor/rules/fabu.mdc`.

For Pi Agent or generic agents, use `pi-agent/fabu.md` as the agent instruction file and keep `skill/fabu/scripts/prepare_articles.py` available.

## Login Once

```bash
npm run auth:toutiao
npm run auth:csdn
```

These commands open a visible browser. Log in manually, then press Enter in the terminal to save Playwright `storageState`.

## Publish

```bash
npm run publish -- --folder "/path/to/article-folder"
```

Use `--headful --limit 1` for diagnosis.

## Tool Strategy

1. Prefer official CMS/API/form endpoints when available and authorized.
2. Use Playwright for batch publishing.
3. Use `agent-browser` only for visible login/debugging fallback or compact interactive inspection when selectors break.

## Safety

This skill pauses for user-controlled login, CAPTCHA, SMS verification, or security checks. It never asks agents to store passwords, OTPs, cookies, or tokens.
