# Fabu Agent Skill

Reusable AI-agent skill for publishing local Markdown news drafts to both Toutiao / 头条号 and CSDN with `vercel-labs/agent-browser`.

The skill is designed for Codex, Pi Agent, Cursor, and other agent platforms that can run shell commands and use `agent-browser`.

## What It Does

- Reads `.md` drafts from a local folder.
- Extracts title, body, and summary.
- Publishes each article to Toutiao and CSDN.
- Selects required publishing options.
- Moves the file to `已上传` or `已完成` only after both sites succeed.

## Install

```bash
git clone https://github.com/leenbj/fabu-agent-skill.git
cd fabu-agent-skill
./scripts/install-codex.sh
```

For Cursor, copy `cursor/fabu.mdc` to your project `.cursor/rules/fabu.mdc`.

For Pi Agent or generic agents, use `pi-agent/fabu.md` as the agent instruction file and keep `skill/fabu/scripts/prepare_articles.py` available.

## Required Tool

Install `vercel-labs/agent-browser` and make sure `agent-browser` is on `PATH`.

```bash
agent-browser skills get core --full
```

## Safety

This skill pauses for user-controlled login, CAPTCHA, SMS verification, or security checks. It never asks agents to store passwords, OTPs, cookies, or tokens.

