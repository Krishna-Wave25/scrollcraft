import { chromium } from 'playwright-core';
const views = [['a', 4517, 390, 844, null, 0, 'v-a-mhero'], ['a', 4517, 1440, 900, '.day', 0.31, 'v-a-day'], ['a', 4517, 1440, 900, '.index', 0.35, 'v-a-index'], ['b', 4518, 390, 844, null, 0, 'v-b-mhero'], ['b', 4518, 1440, 900, '.spec', 0.55, 'v-b-spec'], ['b', 4518, 390, 844, '.spec', 0.5, 'v-b-mspec']];
const b = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
for (const [s, port, w, h, sel, f, name] of views) {
  const c = await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 800, hasTouch: w < 800 }); const p = await c.newPage();
  await p.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle' }); await p.waitForTimeout(3000);
  if (sel) { const y = await p.evaluate(([sel, f]) => { const e = document.querySelector(sel); return e.getBoundingClientRect().top + scrollY + Math.max(0, e.offsetHeight - innerHeight) * f; }, [sel, f]); await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(2800); }
  await p.screenshot({ path: `artifacts/${name}.png` }); await c.close();
}
await b.close();
