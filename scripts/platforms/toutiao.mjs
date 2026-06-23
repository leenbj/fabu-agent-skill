const PUBLISH_URL = 'https://mp.toutiao.com/profile_v4/graphic/publish';
const ARTICLES_URL = 'https://mp.toutiao.com/profile_v4/graphic/articles';

export async function publishToutiao(page, article) {
  await page.goto(PUBLISH_URL, { waitUntil: 'domcontentloaded' });
  if (/auth\/page\/login/.test(page.url()) || await page.getByText('登录').first().isVisible().catch(() => false)) {
    throw new Error('Toutiao requires login or verification');
  }

  await page.getByPlaceholder(/请输入文章标题/).fill(article.title);
  const body = page.locator('[contenteditable="true"]').first();
  await body.click({ force: true });
  await page.keyboard.insertText(article.body);
  await page.getByText(/共\s*[1-9]\d*\s*字/).waitFor({ state: 'visible', timeout: 10000 });

  await ensureCover(page, article);
  await ensureChecked(page, '投放广告赚收益');
  await ensureChecked(page, '取材网络');

  await page.getByRole('button', { name: '预览并发布' }).click();
  await page.getByRole('button', { name: '确认发布' }).click({ timeout: 15000 });
  await page.waitForTimeout(3000);
  if (!page.url().includes('/graphic/articles')) {
    await page.goto(ARTICLES_URL, { waitUntil: 'domcontentloaded' });
  }
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByText(article.title).first().waitFor({ state: 'visible', timeout: 15000 });
  return { ok: true, url: page.url() };
}

async function ensureCover(page, article) {
  const hasCover = await page.getByText(/编辑\s*替换/).first().isVisible().catch(() => false);
  if (hasCover) return;

  await page.getByText('单图').first().click().catch(() => {});
  await openCoverDialog(page);

  await page.getByText('免费正版图片').click({ timeout: 10000 });
  await searchFreeGallery(page, article.title);
  const image = await pickVisibleImage(page);
  await image.click({ force: true });
  const confirm = page.locator('button, .byte-btn, [class*="button"], [class*="btn"]').filter({ hasText: /确定/ }).last();
  await confirm.waitFor({ state: 'visible', timeout: 10000 });
  await confirm.click({ force: true });
  await page.getByText(/编辑|替换/).first().waitFor({ state: 'visible', timeout: 10000 });
}

async function openCoverDialog(page) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const freeTab = page.getByText('免费正版图片').first();
    if (await freeTab.isVisible().catch(() => false)) return;

    const coverCard = page.locator('.article-cover-images, .article-cover-images-wrap').first();
    await coverCard.scrollIntoViewIfNeeded().catch(() => {});
    const box = await coverCard.boundingBox().catch(() => null);
    if (box) await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(700);
  }
  throw new Error('Toutiao cover dialog did not open');
}

async function pickVisibleImage(page) {
  const root = page.locator('.byte-drawer-wrapper, .byte-modal').last();
  const images = root.locator('li.item').filter({ hasNotText: /全部|最新/ });
  await images.first().waitFor({ state: 'visible', timeout: 10000 });
  const handles = await images.elementHandles();
  const visible = [];
  for (const handle of handles.slice(0, 40)) {
    const box = await handle.boundingBox();
    if (box && box.width >= 80 && box.height >= 80) visible.push(handle);
  }
  if (!visible.length) throw new Error('No visible Toutiao free gallery images found');
  return visible[Math.floor(Math.random() * visible.length)].asElement();
}

async function searchFreeGallery(page, title) {
  const keyword = imageKeyword(title);
  const search = page.locator('.byte-drawer-wrapper input[type="text"], .byte-modal input[type="text"]').first();
  await search.fill(keyword);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2500);
}

function imageKeyword(title) {
  const normalized = title.replace(/[^\u4e00-\u9fa5A-Za-z0-9]/g, ' ');
  const match = normalized.match(/(医疗|科技|电子|化工|仓储|建材|金属|茶业|农业|照明|环保|诊断|实验室|工厂|办公)/);
  if (match) return match[1];
  return '企业';
}

async function ensureChecked(page, label) {
  const control = page.getByText(label).first();
  const container = page.locator(`text=${label}`).first();
  const checked = await container.locator('xpath=ancestor::*[self::label or @role="radio" or @role="checkbox"][1]').getAttribute('aria-checked').catch(() => null);
  if (checked !== 'true') await control.click();
}
