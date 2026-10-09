// Accessibility audit against the live sites: rendered contrast (pixel-sampled), keyboard, focus, structure.
// Usage: node tools/a11y.mjs a|b
import { chromium } from 'playwright-core';
import { PNG } from 'pngjs';
const site = process.argv[2], port = site === 'a' ? 4517 : 4518;
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
const vp = process.env.W ? { width: +process.env.W, height: +process.env.H } : { width: 1440, height: 900 };
const ctx = await browser.newContext({ viewport: vp, hasTouch: vp.width < 800, isMobile: vp.width < 800 });
const page = await ctx.newPage();
await page.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle' }); await page.waitForTimeout(3000);
const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

/* ---------- contrast ---------- */
const H = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
const fails = new Map(); let checked = 0;
const steps = 40;
for (let i = 0; i <= steps; i++) {
  await page.evaluate((y) => window.scrollTo(0, y), (H * i) / steps); await page.waitForTimeout(1500);
  const items = await page.evaluate(() => {
    const out = [];
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const seen = new Set();
    while (w.nextNode()) {
      const n = w.currentNode; if (!n.textContent.trim()) continue;
      const el = n.parentElement; if (seen.has(el) || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(el.tagName)) continue; seen.add(el);
      const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none' || el.closest('#motionToggle')) continue;
      let op = 1, p = el; while (p) { op *= +getComputedStyle(p).opacity; p = p.parentElement; }
      if (op < 0.5) continue;
      const r = document.createRange(); r.selectNodeContents(n); const b = r.getBoundingClientRect();
      if (b.width < 4 || b.height < 4 || b.bottom < 0 || b.top > innerHeight || b.right < 0 || b.left > innerWidth) continue;
      if (el.closest('[aria-hidden="true"]') && !el.closest('.gauge')) { /* decorative: still report if large visible */ }
      const cx = Math.min(innerWidth - 1, Math.max(0, b.left + b.width / 2)), cy = Math.min(innerHeight - 1, Math.max(0, b.top + b.height / 2));
      const top = document.elementFromPoint(cx, cy); if (top && !(el.contains(top) || top.contains(el))) continue; // occluded by another element
      let diff = false; for (let q = el; q; q = q.parentElement) if (getComputedStyle(q).mixBlendMode === 'difference') diff = true;
      const stroke = parseFloat(cs.webkitTextStrokeWidth) > 0;
      out.push({ diff, txt: n.textContent.trim().slice(0, 28), color: cs.color, size: parseFloat(cs.fontSize), weight: +cs.fontWeight, op, stroke, deco: !!el.closest('[aria-hidden="true"]') && !el.closest('.gauge,.day__ui'), b: { x: Math.max(0, Math.floor(b.left)), y: Math.max(0, Math.floor(b.top)), w: Math.ceil(Math.min(b.width, innerWidth - b.left)), h: Math.ceil(Math.min(b.height, innerHeight - b.top)) }, sel: el.className ? el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0] : el.tagName.toLowerCase() });
    }
    return out;
  });
  if (!items.length) continue;
  await page.addStyleTag({ content: '*{color:transparent!important;text-shadow:none!important;-webkit-text-stroke:0!important}#motionToggle{visibility:hidden!important}', }).then(async (h) => {
    await page.waitForTimeout(150);
    const png = PNG.sync.read(await page.screenshot());
    await h.evaluate((e) => e.remove());
    for (const it of items) {
      const m = /rgba?\(([\d.]+), ([\d.]+), ([\d.]+)(?:, ([\d.]+))?\)/.exec(it.color); if (!m || it.size === 0) continue;
      const a = (m[4] === undefined ? 1 : +m[4]) * it.op; if (a < 0.5 || it.stroke || it.deco) continue;
      // background = mean of pixels in the text box; worst case uses the min-contrast pixel cluster (mean of 10 %-tile extremes)
      let rs = [], gs = [], bs = [];
      const { x, y, w, h } = it.b;
      for (let yy = y; yy < Math.min(y + h, png.height); yy += 2) for (let xx = x; xx < Math.min(x + w, png.width); xx += 2) { const k = (yy * png.width + xx) * 4; rs.push(png.data[k]); gs.push(png.data[k + 1]); bs.push(png.data[k + 2]); }
      if (!rs.length) continue;
      const fg0 = [+m[1], +m[2], +m[3]];
      const px = rs.map((_, j) => [rs[j], gs[j], bs[j]]);
      const comp = (bg) => it.diff ? bg.map((v) => 255 - v) : fg0.map((c, j) => c * a + bg[j] * (1 - a)); // difference blend with white = inverted backdrop
      // judge against the pixel that gives the lowest contrast (trim extreme 5%)
      const rat = px.map((bg) => ratio(comp(bg), bg)).sort((p, q) => p - q);
      const r = rat[Math.floor(rat.length * 0.05)];
      const large = it.size >= 24 || (it.size >= 18.66 && it.weight >= 700);
      const need = large ? 3 : 4.5; checked++;
      if (r < need) { const key = it.sel + '|' + it.txt; const prev = fails.get(key); if (!prev || r < prev.r) fails.set(key, { ...it, r, need, at: Math.round((H * i) / steps) }); }
    }
  });
}
console.log(`\n== ${site.toUpperCase()} contrast: ${checked} text samples, ${fails.size} failing elements`);
for (const f of [...fails.values()].sort((a, b) => a.r - b.r)) console.log(`${f.r.toFixed(2)} < ${f.need}  ${f.sel}  "${f.txt}"  ${f.size}px  color=${f.color}  y=${f.at}`);

/* ---------- pause toggle: own contrast, worst case over white and black beneath ---------- */
{
  const t = await page.evaluate(() => { const e = document.getElementById('motionToggle'); const cs = getComputedStyle(e); return { fg: cs.color, bg: cs.backgroundColor, border: cs.borderTopColor }; });
  const parse = (c) => { const m = /rgba?\(([\d.]+), ([\d.]+), ([\d.]+)(?:, ([\d.]+))?\)/.exec(c); return { rgb: [+m[1], +m[2], +m[3]], a: m[4] === undefined ? 1 : +m[4] }; };
  const fg = parse(t.fg), bg = parse(t.bg), bd = parse(t.border);
  const worst = [[255, 255, 255], [0, 0, 0]].map((under) => { const b = bg.rgb.map((c, j) => c * bg.a + under[j] * (1 - bg.a)); return ratio(fg.rgb, b); });
  console.log(`pause toggle label contrast: ${Math.min(...worst).toFixed(1)}:1 (needs 4.5)  ${Math.min(...worst) >= 4.5 ? 'PASS' : 'FAIL'}`);
}

/* ---------- structure ---------- */
await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(1500);
const s = await page.evaluate(() => {
  const heads = [...document.querySelectorAll('h1,h2,h3,h4')].map((h) => h.tagName + ':' + h.textContent.trim().replace(/\s+/g, ' ').slice(0, 26));
  const imgsNoAlt = [...document.querySelectorAll('img')].filter((i) => !i.hasAttribute('alt')).length;
  const unlabeled = [...document.querySelectorAll('input,textarea,select')].filter((i) => !i.labels?.length && !i.getAttribute('aria-label')).map((i) => i.name || i.id);
  const noName = [...document.querySelectorAll('a,button')].filter((e) => !(e.textContent.trim() || e.getAttribute('aria-label'))).length;
  return { lang: document.documentElement.lang, landmarks: ['header', 'nav', 'main', 'footer', 'aside'].map((t) => t + ':' + document.querySelectorAll(t).length), heads, imgsNoAlt, unlabeled, noName, skip: !!document.querySelector('.skip') };
});
console.log('structure:', JSON.stringify(s));

/* ---------- keyboard ---------- */
const order = [];
await page.evaluate(() => document.activeElement.blur());
for (let i = 0; i < 40; i++) {
  await page.keyboard.press('Tab'); await page.waitForTimeout(120);
  const info = await page.evaluate(() => {
    const e = document.activeElement; if (!e || e === document.body) return null;
    const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
    const ow = parseFloat(cs.outlineWidth), outline = cs.outlineStyle !== 'none' && ow > 0;
    return { tag: e.tagName.toLowerCase() + (e.className ? '.' + String(e.className).split(' ')[0] : '') + (e.getAttribute('href') ? '[' + e.getAttribute('href') + ']' : ''), name: (e.textContent || e.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 22), outline, outlineColor: cs.outlineColor, boxShadow: cs.boxShadow !== 'none', onScreen: r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth, w: Math.round(r.width), h: Math.round(r.height), hiddenAncestor: !!e.closest('[hidden],[aria-hidden="true"]') };
  });
  if (!info) break; order.push(info);
}
console.log(`keyboard: ${order.length} tab stops`);
const bad = order.filter((o) => !o.outline && !o.boxShadow);
console.log('  no visible focus style:', bad.map((o) => o.tag).join(', ') || 'none');
console.log('  focused but off-screen:', order.filter((o) => !o.onScreen).map((o) => o.tag).join(', ') || 'none');
console.log('  focused inside aria-hidden/hidden:', order.filter((o) => o.hiddenAncestor).map((o) => o.tag).join(', ') || 'none');
console.log('  targets < 44px tall:', order.filter((o) => o.h < 44).map((o) => `${o.tag}(${o.h})`).join(', ') || 'none');
console.log('  order:', order.map((o) => o.name || o.tag).join(' > '));
await browser.close();
