#!/usr/bin/env node
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { publishToutiao } from './platforms/toutiao.mjs';
import { publishCsdn } from './platforms/csdn.mjs';

const args = parseArgs(process.argv.slice(2));
if (!args.folder) {
  console.error('Usage: npm run publish -- --folder /path/to/articles [--limit 5] [--start-index 2] [--platform both|toutiao|csdn] [--headful]');
  process.exit(2);
}
if (args.platform && !['both', 'toutiao', 'csdn'].includes(args.platform)) {
  console.error('Invalid --platform. Use both, toutiao, or csdn.');
  process.exit(2);
}
args.platform ||= 'both';

const root = path.resolve(args.folder);
const resultsDir = path.resolve('.fabu-results');
await fs.mkdir(resultsDir, { recursive: true });

const queue = loadQueue(root);
const startIndex = Number.isFinite(args.startIndex) ? Math.max(0, args.startIndex - 1) : 0;
const selected = queue.articles.slice(startIndex);
const articles = Number.isFinite(args.limit) ? selected.slice(0, args.limit) : selected;
const runResults = [];

for (const article of articles) {
  const result = { title: article.title, path: article.path, toutiao: null, csdn: null, archived: false };
  try {
    if (args.platform !== 'csdn') {
      result.toutiao = await withPlatform('toutiao', args, page => publishToutiao(page, article));
    }
    if (args.platform !== 'toutiao') {
      result.csdn = await withPlatform('csdn', args, page => publishCsdn(page, article));
    }

    if (result.toutiao?.ok && result.csdn?.ok) {
      const archive = spawnSync('python3', [
        'skill/fabu/scripts/prepare_articles.py',
        root,
        '--archive',
        article.path,
      ], { encoding: 'utf8' });
      if (archive.status !== 0) throw new Error(archive.stderr || archive.stdout);
      result.archived = true;
      result.archive = JSON.parse(archive.stdout);
    }
  } catch (error) {
    result.error = String(error?.stack || error);
  }
  runResults.push(result);
  await fs.writeFile(path.join(resultsDir, 'latest.json'), JSON.stringify(runResults, null, 2));
  console.log(JSON.stringify(result, null, 2));
}

function loadQueue(folder) {
  const out = spawnSync('python3', ['skill/fabu/scripts/prepare_articles.py', folder], { encoding: 'utf8' });
  if (out.status !== 0) throw new Error(out.stderr || out.stdout);
  return JSON.parse(out.stdout);
}

async function withPlatform(platform, args, fn) {
  const statePath = path.resolve('.auth', `${platform}.json`);
  try {
    await fs.access(statePath);
  } catch {
    throw new Error(`Missing auth state: ${statePath}. Run npm run auth:${platform}`);
  }

  const browser = await chromium.launch({ headless: !args.headful });
  const context = await browser.newContext({
    storageState: statePath,
    viewport: { width: 1440, height: 960 },
  });
  await dehydrate(context, args.fast !== false);
  const page = await context.newPage();
  try {
    return await fn(page);
  } finally {
    await context.close();
    await browser.close();
  }
}

async function dehydrate(context, enabled) {
  if (!enabled) return;
  await context.route('**/*', route => {
    const req = route.request();
    const type = req.resourceType();
    const url = req.url();
    if (['image', 'media', 'font'].includes(type)) return route.abort();
    if (/google-analytics|doubleclick|adservice|baidu\.com\/hm|analytics|tracking/i.test(url)) {
      return route.abort();
    }
    return route.continue();
  });
}

function parseArgs(argv) {
  const parsed = { fast: true };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--folder') parsed.folder = argv[++i];
    else if (arg === '--limit') parsed.limit = Number(argv[++i]);
    else if (arg === '--start-index') parsed.startIndex = Number(argv[++i]);
    else if (arg === '--platform') parsed.platform = argv[++i];
    else if (arg === '--headful') parsed.headful = true;
    else if (arg === '--no-fast') parsed.fast = false;
  }
  return parsed;
}
