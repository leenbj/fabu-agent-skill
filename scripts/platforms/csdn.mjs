const EDITOR_URL = 'https://mp.csdn.net/mp_blog/creation/editor?spm=1000.2115.3001.5352';

export async function publishCsdn(page, article) {
  await page.goto(EDITOR_URL, { waitUntil: 'domcontentloaded' });
  if (await page.getByText('立即登录').isVisible().catch(() => false)) {
    throw new Error('CSDN requires login or verification');
  }

  await page.getByPlaceholder(/请输入文章标题/).fill(article.title);
  await setCkeditorBody(page, article.body);
  await page.getByText(/共\s*[1-9]\d*\s*字/).waitFor({ state: 'visible', timeout: 10000 });

  await selectNosqlTag(page);
  await page.keyboard.press('Escape').catch(() => {});
  const summary = page.locator('textarea[placeholder*="摘要"]:visible, textarea[placeholder*="内容"]:visible').first();
  await summary.fill(article.summary);
  await page.getByRole('button', { name: '发布博客' }).click();
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  await page.getByText(/发布成功/).waitFor({ state: 'visible', timeout: 20000 });
  return { ok: true, url: page.url() };
}

async function setCkeditorBody(page, body) {
  await page.waitForFunction(() => {
    return !!globalThis.CKEDITOR?.instances?.editor || !!document.querySelector('iframe.cke_wysiwyg_frame');
  }, null, { timeout: 20000 });
  await page.evaluate(value => {
    const html = `<p>${value.replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br>')}</p>`;
    if (globalThis.CKEDITOR?.instances) {
      const inst = Object.values(globalThis.CKEDITOR.instances)[0];
      if (inst) {
        inst.setData(html);
        try { inst.updateElement?.(); } catch {}
        try { inst.fire('change'); } catch {}
        return;
      }
    }
    const iframe = document.querySelector('iframe.cke_wysiwyg_frame');
    const doc = iframe?.contentDocument;
    if (!doc?.body) throw new Error('CSDN editor iframe not found');
    doc.body.innerHTML = html;
    doc.body.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: value.slice(0, 1) }));
    doc.body.dispatchEvent(new Event('change', { bubbles: true }));
  }, body);
}

async function selectNosqlTag(page) {
  await page.getByRole('button', { name: '添加文章标签' }).click();
  const input = page.getByPlaceholder(/文章标签|请输入文字搜索|Enter键入/).first();
  await input.fill('nosql');
  const option = page.getByRole('option', { name: 'nosql' }).first();
  if (await option.isVisible({ timeout: 3000 }).catch(() => false)) {
    await option.click();
  } else {
    await input.press('Enter');
  }
  await page.getByText('nosql', { exact: true }).first().waitFor({ state: 'visible', timeout: 5000 });
}
