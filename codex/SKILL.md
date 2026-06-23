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

