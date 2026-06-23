#!/usr/bin/env node
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const TARGETS = {
  toutiao: 'https://mp.toutiao.com/profile_v4/index',
  csdn: 'https://mp.csdn.net/mp_blog/creation/editor?spm=1000.2115.3001.5352',
};

const platform = process.argv[2];
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
console.log('After the account is fully authenticated, press Enter here to save storage state.');
await new Promise(resolve => process.stdin.once('data', resolve));

await context.storageState({ path: statePath });
await context.close();
console.log(`Saved ${platform} auth state to ${statePath}`);
