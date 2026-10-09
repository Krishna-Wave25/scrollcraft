/* HOLLIN — scroll choreography.
   One scroller (Lenis feeding ScrollTrigger). Pinned scenes use CSS sticky, so there are no pin-spacers to desync. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  if (reduced) root.classList.add('reduced');
  gsap.registerPlugin(ScrollTrigger);
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = gsap.utils.clamp;
  const smooth = (a, b, x) => { const t = clamp(0, 1, (x - a) / (b - a)); return t * t * (3 - 2 * t); };


  /* ---------- pause-animations toggle (WCAG 2.2.2): stops every looping animation, choice is remembered ---------- */
  (() => {
    const btn = $('#motionToggle'), KEY = 'hollin-motion';
    const set = (paused, save) => {
      root.classList.toggle('paused', paused); btn.setAttribute('aria-pressed', String(paused));
      if (save) try { localStorage.setItem(KEY, paused ? 'paused' : 'playing'); } catch (e) {}
    };
    set(root.classList.contains('paused'), false);
    btn.addEventListener('click', () => set(!root.classList.contains('paused'), true));
  })();

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (!reduced) {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.95 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const scrollTo = (target, opts = {}) => {
    const el = typeof target === 'string' ? $(target) : target;
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4), ...opts });
    else el.scrollIntoView({ behavior: 'auto' });
  };
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    e.preventDefault();
    closeMenu(true);
    scrollTo(id === '#top' ? 0 : id);
    const dest = $(id); if (dest) { if (!dest.hasAttribute('tabindex')) dest.setAttribute('tabindex', '-1'); dest.focus({ preventScroll: true }); }
    history.replaceState(null, '', id);
  }));
  $('#toTop').addEventListener('click', () => scrollTo(0));

  /* ---------- header: hides on the way down, returns on the way up, flips over dark sections ---------- */
  const bar = $('#bar');
  let lastY = 0;
  addEventListener('scroll', () => {
    const y = scrollY;
    bar.classList.toggle('is-scrolled', y > 40);
    if (!menuOpen) bar.classList.toggle('is-hidden', y > 500 && y > lastY + 4);
    if (y < lastY - 4) bar.classList.remove('is-hidden');
    lastY = y;
  }, { passive: true });
  ['.day', '.close', '.foot'].forEach((sel) => ScrollTrigger.create({ trigger: sel, start: 'top 60px', end: 'bottom 60px', onToggle: (s) => { s.isActive ? bar.classList.add('is-dark') : bar.classList.remove('is-dark'); } }));
  ScrollTrigger.create({ trigger: '.inter', start: 'top 60px', end: 'bottom 60px', onUpdate: (s) => bar.classList.toggle('is-dark', s.progress > 0.2 && s.progress < 0.98), onLeave: () => bar.classList.remove('is-dark'), onLeaveBack: () => bar.classList.remove('is-dark') });

  /* ---------- menu overlay ---------- */
  const menu = $('#menu'), menuBtn = $('#menuBtn');
  let menuOpen = false;
  function openMenu() {
    menuOpen = true; menuBtn.setAttribute('aria-expanded', 'true'); menuBtn.firstElementChild.textContent = 'Close';
    menu.classList.add('open'); $('#main').inert = true; $('.foot').inert = true; bar.classList.add('is-dark'); bar.classList.remove('is-hidden'); lenis && lenis.stop();
    gsap.to(menu, { clipPath: 'inset(0 0 0% 0)', duration: reduced ? 0 : 0.8, ease: 'expo.out' });
    gsap.fromTo($$('.ln>span', menu), { yPercent: 110 }, { yPercent: 0, duration: reduced ? 0 : 0.9, stagger: 0.07, ease: 'expo.out', delay: reduced ? 0 : 0.1 });
    $('a', menu).focus({ preventScroll: true });
  }
  function closeMenu(instant) {
    if (!menuOpen) return;
    $('#main').inert = false; $('.foot').inert = false;
    menuOpen = false; menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.firstElementChild.textContent = 'Menu';
    gsap.to(menu, { clipPath: 'inset(0 0 100% 0)', duration: instant || reduced ? 0.01 : 0.6, ease: 'expo.inOut', onComplete: () => { menu.classList.remove('open'); bar.classList.remove('is-dark'); ScrollTrigger.update(); } });
    lenis && lenis.start();
  }
  menuBtn.addEventListener('click', () => (menuOpen ? closeMenu() : openMenu()));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeMenu(); menuBtn.focus(); } });
  menu.hidden = false;
  addEventListener('resize', () => { if (innerWidth > 980) closeMenu(true); });

  /* ---------- hero intro ---------- */
  if (!reduced) {
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    gsap.set('.hero .ln>span', { yPercent: 115 });
    gsap.set('.reveal-fade', { opacity: 0, y: 18 });
    gsap.set('.layer', { scale: 1.08 });
    tl.to('.layer', { scale: 1, duration: 2.4, stagger: 0.08 }, 0)
      .to('.hero__mark .ln>span', { yPercent: 0, duration: 1.8 }, 0.1)
      .to('.hero__title .ln>span', { yPercent: 0, duration: 1.3, stagger: 0.12 }, 0.35)
      .to('.reveal-fade', { opacity: 1, y: 0, duration: 1, stagger: 0.12 }, 0.9);

    /* hero parallax: every layer on its own rate; wordmark sits between mid and far so the hills overlap it */
    const hp = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
    gsap.to('.l-sky', { yPercent: 4, scale: 1.08, ease: 'none', scrollTrigger: hp });
    gsap.to('.l-far', { yPercent: -3, ease: 'none', scrollTrigger: hp });
    gsap.to('.hero__mark', { yPercent: -26, ease: 'none', scrollTrigger: hp });
    gsap.to('.l-mid', { yPercent: -8, ease: 'none', scrollTrigger: hp });
    gsap.to('.l-fg', { yPercent: -17, ease: 'none', scrollTrigger: hp });
    gsap.to('.hero__copy', { yPercent: -30, opacity: 0, ease: 'none', scrollTrigger: { ...hp, end: '65% top' } });
    gsap.to('.hero__scroll', { opacity: 0, ease: 'none', scrollTrigger: { ...hp, end: '15% top' } });
  }

  /* ---------- headline line reveals (once, on enter) ---------- */
  if (!reduced) {
    $$('.split-lines').forEach((h) => {
      const spans = $$('.ln>span', h);
      gsap.set(spans, { yPercent: 112 });
      ScrollTrigger.create({ trigger: h, start: 'top 86%', once: true, onEnter: () => gsap.to(spans, { yPercent: 0, duration: 1.3, stagger: 0.11, ease: 'expo.out' }) });
    });
  }

  /* ---------- statement: words fill in with scroll ---------- */
  const st = $('#statementText');
  st.innerHTML = st.textContent.split(' ').map((w) => `<span class="w">${w}</span>`).join(' ');
  if (!reduced) {
    gsap.to($$('.w', st), { opacity: 1, stagger: 0.5, ease: 'none', scrollTrigger: { trigger: st, start: 'top 78%', end: 'bottom 52%', scrub: 0.4 } });
  }

  /* ---------- layered composition ---------- */
  if (!reduced) {
    const mm = gsap.matchMedia();
    mm.add('(min-width: 981px)', () => {
      $$('.pic').forEach((p) => {
        const sp = parseFloat(p.dataset.speed);
        gsap.fromTo(p, { y: sp * -380 }, { y: sp * 380, ease: 'none', scrollTrigger: { trigger: '.comp__stage', start: 'top bottom', end: 'bottom top', scrub: true } });
      });
      gsap.fromTo('.comp__card', { y: 80 }, { y: -80, ease: 'none', scrollTrigger: { trigger: '.comp__stage', start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    $$('.pic__img').forEach((box) => {
      const img = $('img', box);
      gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: box, start: 'top bottom', end: 'bottom top', scrub: true } });
      gsap.fromTo(box, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 1.5, ease: 'expo.out', scrollTrigger: { trigger: box, start: 'top 88%', once: true } });
    });
  }

  /* ---------- pinned day: sun arcs, sky shifts, copy swaps ---------- */
  (() => {
    const sun = $('#sun'), glow = $('#sunGlow'), moon = $('#moon'), stars = $('#stars'), win = $('#win'), dark = $('#dark');
    const skyA = $('#skyA'), skyB = $('#skyB'), clock = $('#dayClock'), bar = $('#dayBar');
    const top = ['#7C8AA0', '#6F93B0', '#5B5F86', '#0f1a2b'];
    const bot = ['#E9E2C4', '#CFE0E3', '#E3A58F', '#2a3a52'];
    const sunCol = ['#EDE5B0', '#F6EFC0', '#E9B79A', '#C9A196'];
    const update = (p) => {
      const q = Math.min(p / 0.72, 1);
      const x = 180 + 1240 * q, y = 720 - Math.sin(Math.PI * q) * 520;
      sun.setAttribute('cx', x); sun.setAttribute('cy', y); glow.setAttribute('cx', x); glow.setAttribute('cy', y);
      const c = gsap.utils.interpolate(sunCol, q);
      sun.setAttribute('fill', c);
      const so = 1 - smooth(0.66, 0.78, p);
      sun.setAttribute('opacity', so); glow.setAttribute('opacity', so * (1 - smooth(0.3, 0.7, p) * 0.5));
      moon.setAttribute('opacity', smooth(0.74, 0.92, p));
      moon.setAttribute('cy', 330 - smooth(0.74, 1, p) * 60);
      stars.setAttribute('opacity', smooth(0.78, 1, p));
      win.setAttribute('opacity', smooth(0.62, 0.9, p));
      dark.setAttribute('opacity', smooth(0.55, 1, p) * 0.45);
      skyA.setAttribute('stop-color', gsap.utils.interpolate(top, p));
      skyB.setAttribute('stop-color', gsap.utils.interpolate(bot, p));
      const m = Math.round(400 + p * 990);
      clock.textContent = String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
      bar.style.transform = `scaleY(${p})`;
    };
    update(0);
    if (reduced) return;
    const states = $$('.state');
    const D = 3.4, tl = gsap.timeline({ scrollTrigger: { trigger: '.day', start: 'top top', end: 'bottom bottom', scrub: 0.6 } });
    const proxy = { p: 0 };
    tl.to(proxy, { p: 1, duration: D, ease: 'none', onUpdate: () => update(proxy.p) }, 0);
    gsap.set(states, { autoAlpha: 0, y: 36 });
    states.forEach((s, i) => {
      const t0 = i * 0.85;
      tl.fromTo(s, { autoAlpha: 0, y: 36 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power2.out', immediateRender: false }, t0 + (i ? 0.02 : 0));
      if (i < states.length - 1) tl.to(s, { autoAlpha: 0, y: -28, duration: 0.25, ease: 'power2.in' }, t0 + 0.6);
    });
    // first state visible straight away when the section arrives
    ScrollTrigger.create({ trigger: '.day', start: 'top 60%', once: true, onEnter: () => gsap.set(states[0], { autoAlpha: 1, y: 0 }) });
  })();

  /* ---------- stacked rule cards ---------- */
  if (!reduced) {
    const cards = $$('.rcard');
    cards.forEach((c, i) => {
      if (i === cards.length - 1) return;
      gsap.fromTo(c, { scale: 1, filter: 'brightness(1)' }, { scale: 0.93, filter: 'brightness(.84)', ease: 'none', scrollTrigger: { trigger: cards[i + 1], start: 'top 85%', end: 'top 14%', scrub: true } });
    });
    $$('.rcard__img img').forEach((img) => gsap.fromTo(img, { scale: 1.25 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: img, start: 'top bottom', end: 'center center', scrub: true } }));
  }

  /* ---------- stays index + detail dialog ---------- */
  const stays = [
    { img: 'stay-1', alt: 'Casa Alba, a white arched terrace facing the sea.', place: 'Menorca, Spain', name: 'Casa Alba', text: 'Six rooms around a shaded terrace, five minutes by path from a cove with no sunbeds. Our advisor slept in the smallest room and asked for nothing more. Marta cooks; you eat when she says.', meta: 'Six rooms · from €420 a night · March to November' },
    { img: 'stay-2', alt: 'Duna, a low house among sand and rose coloured dunes.', place: 'Alentejo coast, Portugal', name: 'Duna', text: 'Four rooms in a flat-roofed house that disappears into the dunes by midday. No road reaches it; a boardwalk does. Bring books, not plans.', meta: 'Four rooms · from €310 a night · April to October' },
    { img: 'stay-3', alt: 'Terraza Verde, white terraces climbing a green hillside.', place: 'Sóller, Mallorca', name: 'Terraza Verde', text: 'Nine rooms stepped down a hillside of lemon trees. The pool is the third terrace and the best place to be at six in the evening.', meta: 'Nine rooms · from €380 a night · all year' },
    { img: 'stay-4', alt: 'Lake Cabin Ven, a cabin on stilts over still water.', place: 'Dolomites, Italy', name: 'Lake Cabin Ven', text: 'Five cabins on stilts over a cold green lake. Wake to mist, swim before anyone is up, then walk to a hut for lunch.', meta: 'Five rooms · from €350 a night · May to October' },
    { img: 'stay-5', alt: 'Patio Ledo, a cream courtyard with tall arched windows.', place: 'Seville, Spain', name: 'Patio Ledo', text: 'Eleven rooms behind a plain door in the old town, built around a courtyard that stays ten degrees cooler than the street.', meta: 'Eleven rooms · from €260 a night · all year' },
    { img: 'stay-6', alt: 'Faro Seco, a slim white lighthouse on a sandy headland.', place: 'Cabo de Gata, Spain', name: 'Faro Seco', text: 'Seven rooms in a former lighthouse keeper’s compound, at the dry end of Spain. Walk in the morning, shut the shutters at noon.', meta: 'Seven rooms · from €290 a night · March to November' }
  ];
  const dlg = $('#dlg');
  let lastRow = null;
  $$('.row').forEach((row) => row.addEventListener('click', () => {
    const s = stays[+row.dataset.stay]; lastRow = row;
    $('#dlgImg').src = `assets/${s.img}.svg`; $('#dlgImg').alt = s.alt;
    $('#dlgPlace').textContent = s.place; $('#dlgTitle').textContent = s.name; $('#dlgText').textContent = s.text; $('#dlgMeta').textContent = s.meta;
    dlg.dataset.stay = s.name; dlg.showModal(); lenis && lenis.stop();
  }));
  const closeDlg = () => dlg.close();
  $('#dlgClose').addEventListener('click', closeDlg);
  dlg.addEventListener('click', (e) => { if (e.target === dlg) closeDlg(); });
  dlg.addEventListener('close', () => { lenis && lenis.start(); lastRow && lastRow.focus({ preventScroll: true }); });
  $('#dlgAsk').addEventListener('click', () => {
    const t = $('textarea[name=trip]');
    if (!t.value) t.value = `I’d like to hear about ${dlg.dataset.stay}. `;
    dlg.close(); lenis && lenis.start(); scrollTo('#contact');
    setTimeout(() => t.focus({ preventScroll: true }), 1700);
  });

  // cursor-following preview: only on devices that really hover
  const preview = $('#preview'), pimg = $('img', preview);
  if (matchMedia('(hover: hover) and (pointer: fine)').matches && !reduced) {
    const qx = gsap.quickTo(preview, 'x', { duration: 0.6, ease: 'power3' }), qy = gsap.quickTo(preview, 'y', { duration: 0.6, ease: 'power3' });
    const list = $('#stayList');
    list.addEventListener('pointermove', (e) => { qx(e.clientX + 28); qy(e.clientY - preview.offsetHeight / 2); });
    $$('.row').forEach((row) => {
      row.addEventListener('pointerenter', () => { pimg.src = `assets/${stays[+row.dataset.stay].img}.svg`; preview.classList.add('show'); gsap.fromTo(preview, { scale: 0.82 }, { scale: 1, duration: 0.7, ease: 'expo.out', overwrite: 'auto' }); });
      row.addEventListener('pointerleave', () => preview.classList.remove('show'));
    });
    list.addEventListener('pointerleave', () => preview.classList.remove('show'));
    addEventListener('scroll', () => preview.classList.remove('show'), { passive: true });
  }

  /* ---------- interlude: circular reveal grows to full bleed ---------- */
  if (!reduced) {
    const img = $('#interImg'), txt = $('#interText');
    gsap.set($$('.ln>span', txt), { yPercent: 0 });
    gsap.timeline({ scrollTrigger: { trigger: '.inter', start: 'top top', end: 'bottom bottom', scrub: 0.5 } })
      .fromTo(img, { clipPath: 'circle(9% at 50% 56%)' }, { clipPath: 'circle(82% at 50% 56%)', ease: 'power1.inOut' }, 0)
      .fromTo($('img', img), { scale: 1.35 }, { scale: 1, ease: 'none' }, 0)
      .fromTo(txt, { scale: 0.92, letterSpacing: '-0.03em' }, { scale: 1.06, letterSpacing: '0.005em', ease: 'none' }, 0);
  }

  /* ---------- contact form (client-side only) ---------- */
  const form = $('#form'), err = $('#formErr'), ok = $('#formOk');
  form.addEventListener('submit', (e) => {
    e.preventDefault(); ok.hidden = true; err.textContent = '';
    const d = new FormData(form), name = d.get('name').trim(), email = d.get('email').trim(), trip = d.get('trip').trim();
    const bad = !name ? 'name' : !/^\S+@\S+\.\S+$/.test(email) ? 'email' : !trip ? 'trip' : null;
    if (bad) { err.textContent = { name: 'Add your name so we know who to reply to.', email: 'Enter an email address we can reply to.', trip: 'Add a line or two about the trip.' }[bad]; form.elements[bad].focus(); return; }
    ok.hidden = false; form.reset();
  });

  /* ---------- keep trigger positions honest ---------- */
  addEventListener('load', () => ScrollTrigger.refresh());
  document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
