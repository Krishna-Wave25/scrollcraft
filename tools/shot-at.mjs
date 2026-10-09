import { chromium } from 'playwright-core';
const [port, y, out, w = '1440', h = '900'] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
const p = await b.newPage({ viewport: { width: +w, height: +h } });
await p.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle' }); await p.waitForTimeout(2500);
await p.evaluate((y) => window.scrollTo(0, y), +y); await p.waitForTimeout(2500);
await p.screenshot({ path: out }); await b.close();
