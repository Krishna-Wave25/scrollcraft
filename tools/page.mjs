import { chromium } from 'playwright-core';
const [url, out, w = '1500', h = '900'] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
const p = await b.newPage({ viewport: { width: +w, height: +h } });
await p.goto(url, { waitUntil: 'networkidle' }); await p.waitForTimeout(500);
await p.screenshot({ path: out }); await b.close();
