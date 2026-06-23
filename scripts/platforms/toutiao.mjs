import { expect } from 'playwright';

const PUBLISH_URL = 'https://mp.toutiao.com/profile_v4/graphic/publish';
const ARTICLES_URL = 'https://mp.toutiao.com/profile_v4/graphic/articles';

export async function publishToutiao(page, article) {
  await page.goto(PUBLISH_URL, { waitUntil: 'domcontentloaded' });
  if (/auth\/page\/login/.test(page.url()) || await page.getByText('登录').first().isVisible().catch(() => false)) {
    throw new Error('Toutiao requires login or verification');
  }

  await page.getByPlaceholder(/请输入文章标题/).fill(article.title);
  const body = page.getByText('请输入正文').first();
  await body.click();
  await page.keyboard.insertText(article.body);
  await expect(page.getByText(/共\s*[1-9]\d*\s*字/)).toBeVisible({ timeout: 10000 });

  await ensureCover(page);
  await ensureChecked(page, '投放广告赚收益');
  await ensureChecked(page, '取材网络');

  await page.getByRole('button', { name: '预览并发布' }).click();
  await page.getByRole('button', { name: '确认发布' }).click({ timeout: 15000 });
  await page.waitForTimeout(3000);
  if (!page.url().includes('/graphic/articles')) {
    await page.goto(ARTICLES_URL, { waitUntil: 'domcontentloaded' });
  }
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByText(article.title).first()).toBeVisible({ timeout: 15000 });
  return { ok: true, url: page.url() };
}

async function ensureCover(page) {
  const hasCover = await page.getByText(/编辑\s*替换/).first().isVisible().catch(() => false);
  if (hasCover) return;

  await page.getByText('单图').first().click().catch(() => {});
  const uploadTile = page.locator('[class*="cover"], [class*="upload"]').first();
  if (await uploadTile.isVisible().catch(() => false)) {
    await uploadTile.click({ force: true });
  } else {
    await page.mouse.click(430, 310);
  }

  await page.getByText('免费正版图片').click({ timeout: 10000 });
  const images = page.locator('li, [role="listitem"]').filter({ hasNotText: '更多图片' });
  const count = await images.count();
  if (count === 0) throw new Error('No Toutiao free gallery images found');
  await images.nth(Math.floor(Math.random() * Math.min(count, 20))).click();
  await page.getByRole('button', { name: '确定' }).click({ force: true });
  await expect(page.getByText(/编辑|替换/).first()).toBeVisible({ timeout: 10000 });
}

async function ensureChecked(page, label) {
  const control = page.getByText(label).first();
  const container = page.locator(`text=${label}`).first();
  const checked = await container.locator('xpath=ancestor::*[self::label or @role="radio" or @role="checkbox"][1]').getAttribute('aria-checked').catch(() => null);
  if (checked !== 'true') await control.click();
}
