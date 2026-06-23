---
name: fabu
description: Publish local Markdown news drafts to Toutiao and CSDN with a Playwright-first batch executor, using agents only for planning, content decisions, login checkpoints, and exception handling. Use when the user asks to submit local articles/news drafts to 头条号 and CSDN, optimize token usage, reuse login state, fill title/body/summary, publish, and archive completed files.
---

# Fabu

Fabu publishes local `.md` news drafts to both:
- Toutiao / 头条号
- CSDN

The optimized architecture is **automation-first, agent-fallback**:
- Playwright scripts do fixed browser work.
- The agent plans, validates, selects simple options, and handles exceptions.
- `agent-browser` is optional fallback for visible login/debugging, not the default executor.

## Tool Choice

Use this decision order:

1. **Backend API first**: if the platform exposes a documented CMS/API/form endpoint the user is allowed to use, prefer that.
2. **Playwright second**: default for current Toutiao/CSDN publishing because flows are fixed and login state can be reused.
3. **agent-browser fallback**: use only for visible login, CAPTCHA/security checkpoints, page-change diagnosis, or when Playwright selectors fail and the agent needs a compact interactive snapshot.

Comparison:

| Dimension | Playwright | agent-browser |
|---|---|---|
| Batch speed | Best: deterministic DOM, headless, resource blocking | Slower: snapshot/ref loop per action |
| Token cost | Lowest: scripts emit only results/errors | Higher: agent reads page snapshots repeatedly |
| Stability | High after selectors are tuned | Good for exploration, lower for repeated bulk work |
| Login handling | `storageState` / persistent context | Good visible manual login helper |
| Best role | Executor | Fallback inspector/operator |

## Hard Rules

- Do not let the agent visually click through every field during normal batch publishing.
- Do not send full HTML/DOM/screenshots to the model unless diagnosing an exception.
- Do not move/archive a file unless both Toutiao and CSDN are verified successful.
- Pause for user login, QR login, CAPTCHA, SMS verification, risk check, or security prompts.
- Never request, store, print, or replay passwords, OTP codes, QR contents, cookies, tokens, or session headers.

## Quick Start

Install dependencies:

```bash
npm install
npx playwright install chromium
```

Prepare article queue:

```bash
python3 skill/fabu/scripts/prepare_articles.py "/path/to/article-folder"
```

Save login state once:

```bash
npm run auth:toutiao
npm run auth:csdn
```

Publish:

```bash
npm run publish -- --folder "/path/to/article-folder"
```

For a visible debug run:

```bash
npm run publish -- --folder "/path/to/article-folder" --headful --limit 1
```

## Runtime Architecture

```text
Markdown folder
  -> prepare_articles.py
  -> Playwright batch executor
  -> platform adapter: Toutiao
  -> platform adapter: CSDN
  -> .fabu-results/latest.json
  -> archive only after both OK
  -> Agent reviews failures only
```

The agent should read `.fabu-results/latest.json` after a run. If all entries are OK, report success. If an entry has `error`, inspect only that platform/page with agent-browser or a headful Playwright run.

## Article Preparation

`prepare_articles.py` returns:
- `title`: first non-empty line, or filename stem.
- `body`: remaining non-empty Markdown content.
- `summary`: first body paragraph.
- `archive_path`: `已上传` if present, else `已完成`, else new `已上传`.

Skipped directories: `.git`, `.serena`, `已上传`, `已完成`.

Manual archive command:

```bash
python3 skill/fabu/scripts/prepare_articles.py "/path/to/article-folder" --archive "/path/to/article.md"
```

## Playwright Executor

Default command:

```bash
npm run publish -- --folder "/path/to/article-folder"
```

Options:
- `--limit N`: process only first N articles.
- `--headful`: visible browser for diagnosis.
- `--no-fast`: disable request blocking if a page needs images/CSS to render a required control.

Optimization behaviors:
- Reuses `.auth/toutiao.json` and `.auth/csdn.json`.
- Blocks image, media, font, analytics, ad/tracking requests during batch runs.
- Uses DOM locators and page evaluation, not screenshots.
- Emits compact JSON results rather than full page dumps.

## Platform Rules

### Toutiao

The adapter should:
- Open `https://mp.toutiao.com/profile_v4/graphic/publish`.
- Fill title placeholder `请输入文章标题（2～30个字）`.
- Fill body editor and verify nonzero `共 N 字`.
- Add cover: `单图` -> cover tile -> `免费正版图片` -> random visible image -> `确定`.
- Keep/select `投放广告赚收益`.
- Select `取材网络`.
- Click `预览并发布`, then `确认发布`.
- Verify works list contains the title after reload.

If login or verification appears, return an error for agent/user intervention.

### CSDN

The adapter should:
- Open `https://mp.csdn.net/mp_blog/creation/editor?spm=1000.2115.3001.5352`.
- Fill title placeholder `请输入文章标题（5～100个字）`.
- Set CKEditor body by DOM/evaluation fallback and verify nonzero `共 N 字`.
- Select tag category `大数据`, tag `nosql`.
- Fill `文章摘要`.
- Leave defaults unless user says otherwise.
- Click `发布博客`.
- Verify `/mp_blog/creation/success/<id>` or text `发布成功`.

If CSDN shows `立即登录`, return an error for auth refresh.

## Agent Fallback Procedure

Use fallback only when the script reports an error:

1. Open `.fabu-results/latest.json`.
2. Identify platform and title.
3. Run a one-article headful retry:

```bash
npm run publish -- --folder "/path/to/article-folder" --limit 1 --headful --no-fast
```

4. If login/security appears, ask the user to complete it and rerun the auth command.
5. If selectors changed, inspect with `agent-browser snapshot -i` or Playwright locator debugging, then patch the adapter.
6. Rerun only the failed article before continuing the batch.

## Final Report

Report compactly:
- Number of articles processed.
- Titles successfully submitted to both sites.
- Archived destination.
- Failures with platform and next action.
