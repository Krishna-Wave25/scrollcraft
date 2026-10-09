import { chromium } from 'playwright-core';
const [site, js, w = '1440', h = '900'] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
const p = await b.newPage({ viewport: { width: +w, height: +h } });
await p.goto(`http://localhost:${site === 'a' ? 4517 : 4518}/`, { waitUntil: 'networkidle' });
await p.waitForTimeout(2500);
console.log(JSON.stringify(await p.evaluate(`(async()=>{${js}})()`), null, 1));
await b.close();
