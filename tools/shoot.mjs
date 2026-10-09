// Usage: node tools/shoot.mjs <a|b> <width> <height> <label> [frac,frac,...]
// Loads the live site in Edge, logs console/network problems, measures overflow, saves screenshots.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const [site, W, H, label, fracs] = process.argv.slice(2);
const port = site === 'a' ? 4517 : 4518;
const dir = `artifacts/website-${site}/`; fs.mkdirSync(dir, { recursive: true });
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
const ctx = await browser.newContext({ viewport: { width: +W, height: +H }, deviceScaleFactor: 1, hasTouch: +W < 800, isMobile: +W < 800, reducedMotion: process.env.RM ? 'reduce' : 'no-preference' });
const page = await ctx.newPage();
const problems = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) problems.push(`console.${m.type()}: ${m.text()}`); });
page.on('pageerror', (e) => problems.push('pageerror: ' + e.message));
page.on('requestfailed', (r) => problems.push('requestfailed: ' + r.url()));
page.on('response', (r) => { if (r.status() >= 400) problems.push(`http ${r.status()}: ${r.url()}`); });
await page.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(3200);
const total = await page.evaluate(() => document.documentElement.scrollHeight);
const info = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, h: document.documentElement.scrollHeight }));
console.log(label, 'viewport', W + 'x' + H, 'doc', JSON.stringify(info), info.sw > info.cw ? 'HORIZONTAL OVERFLOW' : 'no-h-overflow');
const list = (fracs || '0').split(',').map(Number);
for (const f of list) {
  const y = Math.round((total - +H) * f);
  await page.evaluate((y) => window.scrollTo(0, y), y);
  await page.waitForTimeout(2400);
  const name = `${dir}${label}-${String(Math.round(f * 100)).padStart(3, '0')}.png`;
  await page.screenshot({ path: name });
  console.log('saved', name, 'y=' + y);
}
console.log('problems:', problems.length ? '\n' + [...new Set(problems)].join('\n') : 'none');
await browser.close();
