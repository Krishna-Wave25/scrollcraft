// Functional QA against the live sites. Prints PASS/FAIL per check; exit code 1 if anything fails.
import { chromium } from 'playwright-core';
const exe = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const results = [];
const check = (name, ok, extra = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  [' + extra + ']' : ''}`); };
const wait = (p, ms) => p.waitForTimeout(ms);
const browser = await chromium.launch({ executablePath: exe, headless: true });

async function open(port, vp, opts = {}) {
  const ctx = await browser.newContext({ viewport: vp, hasTouch: vp.width < 800, isMobile: vp.width < 800, reducedMotion: opts.rm ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage(); const errs = [];
  page.on('console', (m) => ['error', 'warning'].includes(m.type()) && errs.push(m.text()));
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('requestfailed', (r) => errs.push('failed ' + r.url()));
  page.on('response', (r) => r.status() >= 400 && errs.push(r.status() + ' ' + r.url()));
  await page.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle' }); await wait(page, 2800);
  return { page, errs, ctx };
}
const topOf = (p, sel) => p.evaluate((s) => Math.round(document.querySelector(s).getBoundingClientRect().top + scrollY), sel);

/* ================= SITE A ================= */
{
  const { page, errs, ctx } = await open(4517, { width: 1440, height: 900 });
  await page.click('.bar__nav a[href="#stays"]'); await wait(page, 3200);
  let y = await page.evaluate(() => scrollY), t = await topOf(page, '#stays');
  check('A: nav anchor "This season" scrolls to #stays', Math.abs(y - t) < 160, `scrollY=${y} target=${t}`);

  await page.click('.row[data-stay="0"]'); await wait(page, 600);
  check('A: clicking a stay opens the dialog with its name', await page.evaluate(() => document.getElementById('dlg').open && document.getElementById('dlgTitle').textContent === 'Casa Alba'));
  await page.keyboard.press('Escape'); await wait(page, 300);
  check('A: Escape closes the dialog', !(await page.evaluate(() => document.getElementById('dlg').open)));
  check('A: focus returns to the row that opened the dialog', await page.evaluate(() => document.activeElement.classList.contains('row')));

  await page.click('.row[data-stay="3"]'); await wait(page, 400); await page.click('#dlgAsk'); await wait(page, 3200);
  const prefill = await page.inputValue('textarea[name=trip]'); y = await page.evaluate(() => scrollY); t = await topOf(page, '#contact');
  check('A: "Ask about this stay" prefills the form and scrolls to it', prefill.includes('Lake Cabin Ven') && Math.abs(y - t) < 200, `prefill="${prefill}" y=${y} t=${t}`);

  await page.fill('input[name=name]', 'Ada'); await page.fill('input[name=email]', 'not-an-email'); await page.click('#form button[type=submit]'); await wait(page, 200);
  check('A: invalid email shows an error and keeps focus on the field', (await page.textContent('#formErr')).length > 5 && await page.evaluate(() => document.activeElement.name === 'email'));
  await page.fill('input[name=email]', 'ada@example.com'); await page.click('#form button[type=submit]'); await wait(page, 200);
  check('A: valid submission shows the confirmation', await page.isVisible('#formOk'));

  // reverse scroll: bottom -> top, hero must be intact
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await wait(page, 2500);
  await page.evaluate(() => window.scrollTo(0, 0)); await wait(page, 3500);
  const hero = await page.evaluate(() => { const r = document.querySelector('.hero__title').getBoundingClientRect(); const o = getComputedStyle(document.querySelector('.hero__copy')).opacity; return { top: r.top, o: +o, mark: document.querySelector('.hero__mark').getBoundingClientRect().top }; });
  check('A: reverse scroll restores the hero copy (opacity 1, visible)', hero.o > 0.98 && hero.top > 0 && hero.top < 400, JSON.stringify(hero));
  const lines = await page.evaluate(() => [...document.querySelectorAll('.split-lines .ln>span')].every((s) => !s.getBoundingClientRect().height || true));
  // pinned day: each state readable at its midpoint
  const day = await page.evaluate(() => { const s = document.querySelector('.day'); return { top: s.offsetTop, h: s.offsetHeight, vh: innerHeight }; });
  const seen = [];
  for (const f of [0.08, 0.31, 0.56, 0.9]) {
    await page.evaluate((y) => window.scrollTo(0, y), day.top + (day.h - day.vh) * f); await wait(page, 2600);
    seen.push(await page.evaluate(() => [...document.querySelectorAll('.state')].map((e) => +getComputedStyle(e).opacity > 0.9).findIndex(Boolean)));
  }
  check('A: pinned day shows states 0,1,2,3 in order', JSON.stringify(seen) === '[0,1,2,3]', JSON.stringify(seen));
  // pinned day releases: after the section, the pin is not stuck
  await page.evaluate((y) => window.scrollTo(0, y), day.top + day.h + 300); await wait(page, 2200);
  check('A: pinned day releases into the next section', await page.evaluate(() => document.querySelector('.day__pin').getBoundingClientRect().bottom < 0));
  check('A: no console errors / failed requests (desktop run)', errs.length === 0, errs.join(' | '));
  await ctx.close();
}
{
  const { page, errs, ctx } = await open(4517, { width: 390, height: 844 });
  check('A mobile: menu button visible, desktop nav hidden', await page.isVisible('#menuBtn') && !(await page.isVisible('.bar__nav')));
  await page.tap('#menuBtn'); await wait(page, 1200);
  check('A mobile: menu opens (aria-expanded true, links visible)', (await page.getAttribute('#menuBtn', 'aria-expanded')) === 'true' && await page.isVisible('#menu a[href="#rules"]'));
  await page.tap('#menu a[href="#rules"]'); await wait(page, 3200);
  const y = await page.evaluate(() => scrollY), t = await topOf(page, '#rules');
  check('A mobile: menu link scrolls to section and closes menu', Math.abs(y - t) < 200 && (await page.getAttribute('#menuBtn', 'aria-expanded')) === 'false', `y=${y} t=${t}`);
  const tap = await page.evaluate(() => [...document.querySelectorAll('a.btn,button.btn,.menu-btn,.row')].filter((e) => e.offsetParent).map((e) => e.getBoundingClientRect()).every((r) => r.height >= 40));
  check('A mobile: buttons and rows are at least 40px tall', tap);
  check('A mobile: no console errors', errs.length === 0, errs.join(' | '));
  await ctx.close();
}
{
  const { page, errs, ctx } = await open(4517, { width: 1440, height: 900 }, { rm: true });
  const info = await page.evaluate(() => ({ lenis: document.documentElement.classList.contains('lenis'), reduced: document.documentElement.classList.contains('reduced'), states: [...document.querySelectorAll('.state')].every((e) => +getComputedStyle(e).opacity === 1), words: [...document.querySelectorAll('.w')].every((e) => +getComputedStyle(e).opacity === 1), h: document.documentElement.scrollHeight }));
  check('A reduced-motion: no smooth scroll, all day states and statement visible', !info.lenis && info.reduced && info.states && info.words, JSON.stringify(info));
  check('A reduced-motion: no console errors', errs.length === 0, errs.join(' | '));
  await page.screenshot({ path: 'artifacts/website-a/reduced-motion-hero.png' });
  await ctx.close();
}

/* ================= SITE B ================= */
{
  const { page, errs, ctx } = await open(4518, { width: 1440, height: 900 });
  await page.click('.bar__nav a[href="#expeditions"]'); await wait(page, 3500);
  let y = await page.evaluate(() => scrollY), t = await topOf(page, '#expeditions');
  check('B: nav anchor "Expeditions" scrolls to the section', Math.abs(y - t) < 200, `y=${y} t=${t}`);
  // zone sync: depth vs shown name at sampled progress
  const z = await page.evaluate(() => { const s = document.querySelector('.zones'); return { top: s.offsetTop, h: s.offsetHeight, vh: innerHeight }; });
  const names = [];
  for (const f of [0.1, 0.3, 0.5, 0.7, 0.92]) {
    await page.evaluate((y) => window.scrollTo(0, y), z.top + (z.h - z.vh) * f); await wait(page, 3000);
    names.push(await page.evaluate(() => ({ n: [...document.querySelectorAll('.zn')].findIndex((e) => +getComputedStyle(e).opacity > 0.9), d: document.getElementById('gaugeNum').textContent })));
  }
  check('B: zones pin cycles through 5 states in order, depth increasing', JSON.stringify(names.map((n) => n.n)) === '[0,1,2,3,4]', JSON.stringify(names));
  const depths = names.map((n) => +n.d.replace(/,/g, ''));
  check('B: depth gauge increases monotonically through the zones', depths.every((d, i) => i === 0 || d > depths[i - 1]), depths.join(' < '));
  // horizontal section: first and last panel reachable
  const ex = await page.evaluate(() => { const s = document.querySelector('.exp'); return { top: s.offsetTop, h: s.offsetHeight, vh: innerHeight }; });
  await page.evaluate((y) => window.scrollTo(0, y), ex.top + ex.h - ex.vh); await wait(page, 2800);
  const lastEp = await page.evaluate(() => { const r = [...document.querySelectorAll('.ep')].pop().getBoundingClientRect(); return { l: r.left, r: r.right, vw: innerWidth }; });
  check('B: horizontal section ends with the last expedition fully on screen', lastEp.r <= lastEp.vw + 2 && lastEp.l >= 0, JSON.stringify(lastEp));
  // spec fly-through: each card gets to be fully visible at some point
  const sp = await page.evaluate(() => { const s = document.querySelector('.spec'); return { top: s.offsetTop, h: s.offsetHeight, vh: innerHeight }; });
  const peaks = new Array(5).fill(0);
  for (let f = 0; f <= 1.001; f += 0.1) {
    await page.evaluate((y) => window.scrollTo(0, y), sp.top + (sp.h - sp.vh) * f); await wait(page, 1700);
    const ops = await page.evaluate(() => [...document.querySelectorAll('.card')].map((c) => +getComputedStyle(c).opacity));
    ops.forEach((o, i) => (peaks[i] = Math.max(peaks[i], o)));
  }
  check('B: specimen fly-through brings every card to full opacity', peaks.every((p) => p > 0.95), peaks.map((p) => p.toFixed(2)).join(','));
  // form
  await page.evaluate(() => document.querySelector('#join').scrollIntoView()); await wait(page, 1500);
  await page.fill('#email', 'nope'); await page.click('.go'); await wait(page, 200);
  check('B: invalid email shows an error', (await page.textContent('#ferr')).length > 5);
  await page.fill('#email', 'a@b.co'); await page.click('.go'); await wait(page, 200);
  check('B: valid email shows confirmation', await page.isVisible('#fok'));
  // reverse scroll: hero title restored
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await wait(page, 2500);
  await page.evaluate(() => window.scrollTo(0, 0)); await wait(page, 3500);
  const hero = await page.evaluate(() => [...document.querySelectorAll('.ch')].map((c) => +getComputedStyle(c).opacity));
  check('B: reverse scroll restores the HADAL letters (opacity 1)', hero.every((o) => o > 0.98), hero.join(','));
  const g = await page.evaluate(() => document.getElementById('gaugeNum').textContent);
  check('B: gauge returns to 0 m at the top', g === '0', g);
  check('B: no console errors / failed requests (desktop run)', errs.length === 0, errs.join(' | '));
  await ctx.close();
}
{
  const { page, errs, ctx } = await open(4518, { width: 390, height: 844 });
  await page.tap('#menuBtn'); await wait(page, 1000);
  check('B mobile: menu opens', (await page.getAttribute('#menuBtn', 'aria-expanded')) === 'true' && await page.isVisible('#menu a[href="#specimens"]'));
  await page.tap('#menu a[href="#specimens"]'); await wait(page, 3600);
  const y = await page.evaluate(() => scrollY), t = await topOf(page, '#specimens');
  check('B mobile: menu link scrolls to section and closes', Math.abs(y - t) < 220 && (await page.getAttribute('#menuBtn', 'aria-expanded')) === 'false', `y=${y} t=${t}`);
  check('B mobile: no console errors', errs.length === 0, errs.join(' | '));
  await ctx.close();
}
{
  const { page, errs, ctx } = await open(4518, { width: 1440, height: 900 }, { rm: true });
  const info = await page.evaluate(() => ({ lenis: document.documentElement.classList.contains('lenis'), zn: [...document.querySelectorAll('.zn')].every((e) => +getComputedStyle(e).opacity === 1), cards: [...document.querySelectorAll('.card')].every((e) => +getComputedStyle(e).opacity === 1), tags: [...document.querySelectorAll('.trench__tag')].every((e) => +getComputedStyle(e).opacity === 1) }));
  check('B reduced-motion: no smooth scroll; zones, trench tags and specimens all visible', !info.lenis && info.zn && info.cards && info.tags, JSON.stringify(info));
  check('B reduced-motion: no console errors', errs.length === 0, errs.join(' | '));
  await page.screenshot({ path: 'artifacts/website-b/reduced-motion-hero.png' });
  await ctx.close();
}

/* ================= PAUSE-ANIMATIONS TOGGLE (WCAG 2.2.2) ================= */
for (const [label, port, loops, snow] of [['A', 4517, ['.hero__scroll i'], false], ['B', 4518, ['.rays', '.surface__hint i', '.light__wave'], true]]) {
  const anim = (page) => page.evaluate((sels) => sels.map((s) => getComputedStyle(document.querySelector(s)).animationName), loops);
  const { page, errs, ctx } = await open(port, { width: 1440, height: 900 });
  const box = await page.evaluate(() => { const r = document.getElementById('motionToggle').getBoundingClientRect(); return { h: r.height, inView: r.bottom <= innerHeight && r.top >= 0 && r.left >= 0, label: document.getElementById('motionToggle').textContent.trim() }; });
  check(`${label} toggle: visible in viewport, labelled "${box.label}", at least 44px tall`, box.inView && box.h >= 44 && /pause/i.test(box.label), JSON.stringify(box));
  const before = await anim(page);
  check(`${label} toggle: loops are running before pausing`, before.every((n) => n !== 'none'), before.join(','));
  const snapshot = () => page.evaluate(() => document.getElementById('snow')?.toDataURL().length);
  let moved = true;
  if (snow) { const a = await page.evaluate(() => document.getElementById('snow').toDataURL()); await wait(page, 700); const b = await page.evaluate(() => document.getElementById('snow').toDataURL()); moved = a !== b; check('B toggle: marine snow drifts on its own while playing', moved); }
  // keyboard: second tab stop is the toggle; Space activates it
  await page.evaluate(() => document.activeElement.blur()); await page.keyboard.press('Tab'); await page.keyboard.press('Tab'); await wait(page, 150);
  check(`${label} toggle: reachable by keyboard (2nd tab stop)`, await page.evaluate(() => document.activeElement.id === 'motionToggle'));
  await page.keyboard.press('Space'); await wait(page, 300);
  const st = await page.evaluate(() => ({ cls: document.documentElement.classList.contains('paused'), pressed: document.getElementById('motionToggle').getAttribute('aria-pressed'), ls: Object.entries(localStorage).map(([k, v]) => k + '=' + v).join(';') }));
  check(`${label} toggle: Space pauses (html.paused, aria-pressed=true, choice stored)`, st.cls && st.pressed === 'true' && /paused/.test(st.ls), JSON.stringify(st));
  const after = await anim(page);
  check(`${label} toggle: every looping animation stops`, after.every((n) => n === 'none'), after.join(','));
  if (snow) { const a = await page.evaluate(() => document.getElementById('snow').toDataURL()); await wait(page, 900); const b = await page.evaluate(() => document.getElementById('snow').toDataURL()); check('B toggle: marine snow is frozen while paused', a === b); }
  await page.reload({ waitUntil: 'networkidle' }); await wait(page, 2500);
  const persisted = await page.evaluate(() => ({ cls: document.documentElement.classList.contains('paused'), pressed: document.getElementById('motionToggle').getAttribute('aria-pressed') }));
  const afterReload = await anim(page);
  check(`${label} toggle: choice persists across reload (no animation restarts)`, persisted.cls && persisted.pressed === 'true' && afterReload.every((n) => n === 'none'), JSON.stringify(persisted));
  await page.click('#motionToggle'); await wait(page, 300);
  const resumed = await anim(page);
  check(`${label} toggle: clicking again resumes animations and clears the pause`, resumed.every((n) => n !== 'none') && !(await page.evaluate(() => document.documentElement.classList.contains('paused'))), resumed.join(','));
  check(`${label} toggle: no console errors`, errs.length === 0, errs.join(' | '));
  await ctx.close();
}
{
  const { page, ctx } = await open(4517, { width: 1440, height: 900 }, { rm: true });
  check('A toggle: hidden under prefers-reduced-motion (nothing loops)', !(await page.isVisible('#motionToggle')));
  await ctx.close();
}
await browser.close();
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
