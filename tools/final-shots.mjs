// Regenerates the delivered screenshot set from the running sites. Deletes old PNGs first so nothing stale remains.
import { chromium, firefox, webkit } from 'playwright-core';
// BROWSER=chromium|firefox|webkit, OUT=output root (default artifacts)
const BROWSER = process.env.BROWSER || 'chromium', ROOT = process.env.OUT || 'artifacts';
import fs from 'node:fs';
const exe = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
for (const s of ['a', 'b']) { const d = `${ROOT}/website-${s}`; fs.mkdirSync(`${d}/desktop`, { recursive: true }); fs.mkdirSync(`${d}/mobile`, { recursive: true }); fs.mkdirSync(`${d}/responsive`, { recursive: true }); for (const sub of ['', '/desktop', '/mobile', '/responsive']) for (const f of fs.readdirSync(d + sub)) if (f.endsWith('.png')) fs.unlinkSync(`${d}${sub}/${f}`); }
const browser = BROWSER === 'firefox' ? await firefox.launch() : BROWSER === 'webkit' ? await webkit.launch() : await chromium.launch({ executablePath: exe, headless: true });

const plan = {
  a: {
    port: 4517,
    // [name, selector, fraction through the section's scroll range (0 = section top at viewport top)]
    shots: [['01-hero-load', null, 0], ['02-hero-parallax-mid', '.hero', 0.5], ['03-statement-words', '.statement', 0.25], ['04-layered-composition', '.comp', 0.35], ['05-day-morning', '.day', 0.08], ['06-day-midday', '.day', 0.31], ['07-day-dusk', '.day', 0.56], ['08-day-night', '.day', 0.92], ['09-rules-stack-1', '.rules', 0.28], ['10-rules-stack-3', '.rules', 0.85], ['11-index', '.index', 0.35], ['12-interlude-start', '.inter', 0.12], ['13-interlude-mid', '.inter', 0.5], ['14-interlude-full', '.inter', 0.9], ['15-contact', '.close', 0.1], ['16-footer', null, 1]],
    mobile: [['01-hero', null, 0], ['02-composition', '.comp', 0.3], ['03-day-dusk', '.day', 0.56], ['04-rules', '.rules', 0.5], ['05-index', '.index', 0.3], ['06-interlude', '.inter', 0.5], ['07-contact', '.close', 0.05], ['08-footer', null, 1]]
  },
  b: {
    port: 4518,
    shots: [['01-hero-load', null, 0], ['02-hero-title-splitting', '.surface', 0.2], ['03-hero-descend-line', '.surface', 0.58], ['04-zone-sunlight', '.zones', 0.1], ['05-zone-twilight', '.zones', 0.3], ['06-zone-midnight', '.zones', 0.5], ['07-zone-abyssal', '.zones', 0.7], ['08-zone-hadal', '.zones', 0.93], ['09-trench-mask-opening', '.trench', 0.2], ['10-trench-probe', '.trench', 0.62], ['11-trench-full-labels', '.trench', 0.95], ['12-expeditions-mid', '.exp', 0.4], ['13-expeditions-end', '.exp', 0.95], ['14-specimens-1', '.spec', 0.25], ['15-specimens-2', '.spec', 0.55], ['16-specimens-3', '.spec', 0.9], ['17-light', '.light', 0.5], ['18-finale', '.finale', 0.3], ['19-footer', null, 1]],
    mobile: [['01-hero', null, 0], ['02-zone-twilight', '.zones', 0.3], ['03-zone-hadal', '.zones', 0.93], ['04-trench', '.trench', 0.75], ['05-expeditions', '.exp', 0.5], ['06-specimens', '.spec', 0.5], ['07-light', '.light', 0.5], ['08-finale', '.finale', 0.3], ['09-footer', null, 1]]
  }
};
async function session(port, vp) {
  const ctx = await browser.newContext({ viewport: vp, hasTouch: vp.width < 800, isMobile: vp.width < 800 && BROWSER !== 'firefox' });
  const page = await ctx.newPage(); await page.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle' }); await page.waitForTimeout(3000);
  return { page, ctx };
}
async function go(page, sel, f) {
  const y = await page.evaluate(([sel, f]) => {
    if (!sel) return f * (document.documentElement.scrollHeight - innerHeight);
    const el = document.querySelector(sel); const top = el.getBoundingClientRect().top + scrollY;
    return top + Math.max(0, el.offsetHeight - innerHeight) * f - (el.offsetHeight <= innerHeight ? 0 : 0) + (el.offsetHeight <= innerHeight * 1.01 ? -innerHeight * (0.5 - f) * 0 : 0);
  }, [sel, f]);
  await page.evaluate((y) => window.scrollTo(0, y), y); await page.waitForTimeout(2800);
}
for (const [site, cfg] of Object.entries(plan)) {
  const dir = `${ROOT}/website-${site}`;
  let { page, ctx } = await session(cfg.port, { width: 1440, height: 900 });
  for (const [name, sel, f] of cfg.shots) { await go(page, sel, f); await page.screenshot({ path: `${dir}/desktop/${name}.png` }); console.log(site, 'desktop', name); }
  await ctx.close();
  ({ page, ctx } = await session(cfg.port, { width: 390, height: 844 }));
  for (const [name, sel, f] of cfg.mobile) { await go(page, sel, f); await page.screenshot({ path: `${dir}/mobile/${name}.png` }); console.log(site, 'mobile', name); }
  await ctx.close();
  for (const [label, w, h] of [['laptop-1280x800', 1280, 800], ['tablet-768x1024', 768, 1024], ['narrow-360x800', 360, 800]]) {
    ({ page, ctx } = await session(cfg.port, { width: w, height: h }));
    await go(page, null, 0); await page.screenshot({ path: `${dir}/responsive/${label}-hero.png` });
    await go(page, site === 'a' ? '.day' : '.zones', 0.56); await page.screenshot({ path: `${dir}/responsive/${label}-pinned.png` });
    await go(page, null, 1); await page.screenshot({ path: `${dir}/responsive/${label}-footer.png` });
    await ctx.close(); console.log(site, label);
  }
}
await browser.close();
