---
name: fabu
description: Publish local Markdown news drafts to Toutiao and CSDN using only vercel-labs/agent-browser, then archive files only after both sites succeed. Use when the user asks to submit local articles/news drafts to 头条号 and CSDN, fill title/body/summary, choose required options, publish, and move completed documents.
---

# Fabu

Publish `.md` news drafts from a local folder to both:
- Toutiao / 头条号
- CSDN

An article is complete only after both sites show a successful submitted state.

## Hard Rules

- Use only `vercel-labs/agent-browser` for browser operations.
- Do not use Playwright, Puppeteer, Chrome plugin tools, Computer Use, AppleScript, raw CDP scripts, or ad hoc browser automation for publishing UI.
- Before publishing, run:

```bash
agent-browser skills get core --full
python3 skill/fabu/scripts/prepare_articles.py "/path/to/article-folder"
```

- Re-snapshot before every ref-based click/fill. Refs become stale after navigation, rerenders, dialogs, tab changes, and submits.
- If a site shows login, QR login, CAPTCHA, SMS/phone verification, risk check, or account security prompt, stop and ask the user to complete it.
- Never request, store, print, or replay passwords, OTP codes, QR contents, cookies, tokens, or session headers.
- Never move/archive a local file unless both Toutiao and CSDN are verified successful for that file.

## Article Preparation

Use the bundled helper:

```bash
python3 skill/fabu/scripts/prepare_articles.py "/path/to/article-folder"
```

The helper returns JSON:
- `title`: first non-empty line, or filename stem.
- `body`: remaining non-empty Markdown content, paragraph-preserved.
- `summary`: first body paragraph, trimmed.
- `archive_path`: destination under `已上传` if present, otherwise `已完成`, otherwise a new `已上传`.

Skipped directories: `.git`, `.serena`, `已上传`, `已完成`.

To archive after both submissions:

```bash
python3 skill/fabu/scripts/prepare_articles.py "/path/to/article-folder" --archive "/path/to/article.md"
```

## Per-Article Loop

For each article:

1. Prepare `TITLE`, `BODY`, `SUMMARY`, and `ARTICLE_PATH`.
2. Publish to Toutiao and verify success.
3. Publish to CSDN and verify success.
4. Archive `ARTICLE_PATH`.
5. Continue with the next article.

If one site succeeds and the other fails or is uncertain, leave the file in place and report partial success.

## Toutiao Workflow

Open:

```bash
agent-browser open "https://mp.toutiao.com/profile_v4/graphic/publish"
agent-browser wait --load networkidle
agent-browser snapshot -i
```

If redirected to login, pause for user login.

Steps:
- Fill placeholder `请输入文章标题（2～30个字）`.
- Fill the empty body editor text `请输入正文`.
- Verify page shows nonzero `共 N 字` and not `共 0 字`.
- Add a cover image:
  - Select `单图` if cover upload is not visible.
  - Click the cover upload tile.
  - Choose `免费正版图片`.
  - Randomly click one visible gallery image.
  - Click `确定`.
  - Verify cover preview actions such as `编辑` / `替换`.
- Select `投放广告赚收益`; if already selected, keep it.
- Select `取材网络` under `作品声明`.
- Click `预览并发布`.
- In preview, re-snapshot and click current `确认发布`.
- If one immediate `确定` modal appears after confirm, click it once and re-verify.

Treat Toutiao as successful only if one is true:
- URL reaches `/profile_v4/graphic/articles` or another works/articles management URL and the just-submitted title appears.
- Page text clearly says `发布成功`.

Failure/uncertain states:
- Still on `/graphic/publish` after final confirm.
- Editor clears title/body, says `还需输入 2 个字`, or shows `共 0 字`.
- Same validation/modal appears twice.
- Works list does not contain the title after a reload.

Useful verification:

```bash
TITLE="..."
agent-browser wait 3000
agent-browser reload
agent-browser wait --load networkidle
agent-browser get text body | grep -F "$TITLE"
```

## CSDN Workflow

Open:

```bash
agent-browser open "https://mp.csdn.net/mp_blog/creation/editor?spm=1000.2115.3001.5352"
agent-browser wait --load networkidle
agent-browser snapshot -i
```

If redirected to login or shows `立即登录`, pause for user login.

Steps:
- Fill placeholder `请输入文章标题（5～100个字）`.
- Fill body.
- Verify page shows nonzero `共 N 字`.
- Click `添加文章标签`.
- Choose `大数据`, then `nosql`.
- If clicking visible `nosql` does not select it, type `nosql` into `文章标签*` and click the `nosql` option from the listbox.
- Fill `文章摘要` with `SUMMARY`.
- Leave defaults: `原创`, `全部可见`, `同时备份到GitCode` unchecked unless already required by the account.
- Click `发布博客`.

Treat CSDN as successful only if:
- URL changes to `/mp_blog/creation/success/<id>`, or
- Page text contains `发布成功`.

### CSDN Body Fallback

If normal typing focuses the iframe but the page remains at `共 0 字`, set CKEditor data through `agent-browser eval`:

```bash
BODY_JSON="$(python3 - <<'PY'
import json
print(json.dumps(open('/tmp/fabu-current-body.txt').read()))
PY
)"
agent-browser eval "(() => { const body = $BODY_JSON; const html = '<p>' + body.replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br>') + '</p>'; if (window.CKEDITOR && CKEDITOR.instances) { const inst = Object.values(CKEDITOR.instances)[0]; if (inst) { inst.setData(html); inst.fire('change'); return 'ckeditor'; } } const iframe = document.querySelector('iframe.cke_wysiwyg_frame'); const doc = iframe && iframe.contentDocument; if (!doc || !doc.body) return 'no iframe body'; doc.body.innerHTML = html; doc.body.dispatchEvent(new InputEvent('input', {bubbles:true, inputType:'insertText', data:body.slice(0,1)})); doc.body.dispatchEvent(new Event('change', {bubbles:true})); return doc.body.innerText.slice(0,80); })()"
agent-browser get text body | grep "共 [1-9][0-9]* 字"
```

## Agent-Browser Session Notes

- For visible login, start `agent-browser` headed before browser work:

```bash
agent-browser close --all
agent-browser --headed --session-name fabu open "https://mp.toutiao.com/profile_v4/graphic/publish"
```

- If `--headed ignored: daemon already running`, stop the daemon and retry:

```bash
pkill -f agent-browser-darwin-arm64 || true
pkill -f "Google Chrome for Testing.*agent-browser-chrome" || true
agent-browser --headed --session-name fabu open "https://mp.toutiao.com/profile_v4/graphic/publish"
```

- Use a stable session name such as `fabu` so login state can persist between commands.

## Final Report

Report:
- Files submitted to both sites.
- Files left unsubmitted and why.
- Archive directory used.
- Any manual user action required.
