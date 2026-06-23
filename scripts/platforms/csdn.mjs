import { expect } from 'playwright';

const EDITOR_URL = 'https://mp.csdn.net/mp_blog/creation/editor?spm=1000.2115.3001.5352';

export async function publishCsdn(page, article) {
  await page.goto(EDITOR_URL, { waitUntil: 'domcontentloaded' });
  if (await page.getByText('立即登录').isVisible().catch(() => false)) {
    throw new Error('CSDN requires login or verification');
  }

  await page.getByPlaceholder(/请输入文章标题/).fill(article.title);
  await setCkeditorBody(page, article.body);
  await expect(page.getByText(/共\s*[1-9]\d*\s*字/)).toBeVisible({ timeout: 10000 });

  await selectNosqlTag(page);
  await page.getByPlaceholder(/文章摘要/).fill(article.summary);
  await page.getByRole('button', { name: '发布博客' }).click();
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  await expect(page.getByText(/发布成功/)).toBeVisible({ timeout: 20000 });
  return { ok: true, url: page.url() };
}

async function setCkeditorBody(page, body) {
  await page.evaluate(value => {
    const html = `<p>${value.replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br>')}</p>`;
    if (globalThis.CKEDITOR?.instances) {
      const inst = Object.values(globalThis.CKEDITOR.instances)[0];
      if (inst) {
        inst.setData(html);
        inst.fire('change');
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
  await page.getByRole('tab', { name: '大数据' }).click();
  const tag = page.getByText('nosql', { exact: true }).first();
  await tag.click();
  if (!await page.getByText('nosql', { exact: true }).first().isVisible().catch(() => false)) {
    await page.getByPlaceholder(/文章标签/).fill('nosql');
    await page.getByRole('option', { name: 'nosql' }).click();
  }
}
