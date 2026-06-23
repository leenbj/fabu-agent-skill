#!/usr/bin/env node
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const TARGETS = {
  toutiao: 'https://mp.toutiao.com/profile_v4/index',
  csdn: 'https://mp.csdn.net/mp_blog/creation/editor?spm=1000.2115.3001.5352',
};

const platform = process.argv[2];
const waitArg = process.argv.find(arg => arg.startsWith('--wait-ms='));
const waitMs = waitArg ? Number(waitArg.split('=')[1]) : null;
const nonInteractiveWaitMs = Number(process.env.FABU_AUTH_WAIT_MS || 10 * 60 * 1000);
if (!TARGETS[platform]) {
  console.error(`Usage: node scripts/save-auth.mjs <${Object.keys(TARGETS).join('|')}>`);
  process.exit(2);
}

const authDir = path.resolve('.auth');
const userDataDir = path.join(authDir, `${platform}-profile`);
const statePath = path.join(authDir, `${platform}.json`);
await fs.mkdir(authDir, { recursive: true });

const context = await chromium.launchPersistentContext(userDataDir, {
  headless: false,
  viewport: { width: 1440, height: 960 },
});
const page = context.pages()[0] || await context.newPage();
await page.goto(TARGETS[platform], { waitUntil: 'domcontentloaded' });

console.log(`Login in the visible browser if needed: ${platform}`);
if (Number.isFinite(waitMs)) {
  console.log(`Waiting ${waitMs}ms before saving storage state.`);
  await page.waitForTimeout(waitMs);
} else {
  console.log('After the account is fully authenticated, press Enter here to save storage state.');
  if (process.stdin.isTTY) {
    await new Promise(resolve => process.stdin.once('data', resolve));
  } else {
    console.log(`Non-interactive stdin detected. Keeping browser open for ${nonInteractiveWaitMs}ms.`);
    console.log('Set FABU_AUTH_WAIT_MS to change this timeout, or run from a real terminal and press Enter after login.');
    await page.waitForTimeout(nonInteractiveWaitMs);
  }
}

const authenticated = await isAuthenticated(page, platform);
if (!authenticated) {
  console.log(`Not authenticated for ${platform}; storage state was not saved.`);
  await context.close();
  process.exit(4);
}

await context.storageState({ path: statePath });
await context.close();
console.log(`Saved ${platform} auth state to ${statePath}`);

async function isAuthenticated(page, platform) {
  if (platform === 'toutiao') {
    if (/auth\/page\/login/.test(page.url())) return false;
    if (await page.getByText('登录').first().isVisible().catch(() => false)) return false;
    return true;
  }
  if (platform === 'csdn') {
    const titleInput = await page.getByPlaceholder(/请输入文章标题/).count().catch(() => 0);
    if (titleInput > 0) return true;
    const text = await page.locator('body').innerText({ timeout: 5000 }).catch(() => '');
    return !/(立即登录|登录\s*$)/m.test(text) && /创作中心|CSDN/.test(text);
  }
  return false;
}
