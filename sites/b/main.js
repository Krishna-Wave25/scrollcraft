/* HADAL — scroll choreography.
   The organising idea: scroll position maps to depth in metres. Water colour, gauge, particle speed and the
   zone copy are all driven from one `depth` value, so the sections feel like one continuous descent. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  if (reduced) root.classList.add('reduced');
  gsap.registerPlugin(ScrollTrigger);
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = gsap.utils.clamp;
  const smooth = (a, b, x) => { const t = clamp(0, 1, (x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const fmt = (n) => Math.round(n).toLocaleString('en-US');
  const MAX = 10935;


  /* ---------- pause-animations toggle (WCAG 2.2.2): stops every looping animation, choice is remembered ---------- */
  (() => {
    const btn = $('#motionToggle'), KEY = 'hadal-motion';
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
    lenis = new Lenis({ lerp: 0.1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const scrollTo_ = (y) => window.scrollTo(0, y);

  /* ---------- header, menu ---------- */
  const bar = $('#bar'), menu = $('#menu'), menuBtn = $('#menuBtn'), gauge = $('#gauge');
  let menuOpen = false, lastY = 0;
  addEventListener('scroll', () => {
    const y = scrollY;
    if (!menuOpen) bar.classList.toggle('is-hidden', y > 600 && y > lastY + 4);
    if (y < lastY - 4) bar.classList.remove('is-hidden');
    lastY = y;
    gauge.classList.toggle('is-pre', y < innerHeight * 0.4); // the count begins when the dive does
  }, { passive: true });
  function setMenu(open) {
    menuOpen = open; menuBtn.setAttribute('aria-expanded', open); menuBtn.firstElementChild.textContent = open ? 'Close' : 'Menu';
    if (open) { bar.classList.remove('is-hidden'); lenis && lenis.stop(); } else lenis && lenis.start();
    $('#main').inert = open; $('.foot').inert = open;
    gsap.to(menu, { autoAlpha: open ? 1 : 0, duration: reduced ? 0 : 0.5 });
    if (open) { gsap.fromTo($$('a', menu), { y: 40, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.07, duration: reduced ? 0 : 0.8, ease: 'expo.out' }); $('a', menu).focus({ preventScroll: true }); }
  }
  menu.hidden = false; gsap.set(menu, { autoAlpha: 0 });
  menuBtn.addEventListener('click', () => setMenu(!menuOpen));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuOpen) { setMenu(false); menuBtn.focus(); } });
  addEventListener('resize', () => { if (innerWidth > 900 && menuOpen) setMenu(false); });
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href'); e.preventDefault();
    if (menuOpen) setMenu(false);
    const dest = $(id); if (dest) { if (!dest.hasAttribute('tabindex')) dest.setAttribute('tabindex', '-1'); dest.focus({ preventScroll: true }); }
    if (id === '#surface') { lenis ? lenis.scrollTo(0, { duration: 3, easing: (x) => 1 - Math.pow(1 - x, 4) }) : scrollTo_(0); }
    else if (lenis) lenis.scrollTo($(id), { duration: 2.2, easing: (x) => 1 - Math.pow(1 - x, 4) });
    else $(id).scrollIntoView();
    history.replaceState(null, '', id);
  }));
  $('#toTop').addEventListener('click', () => (lenis ? lenis.scrollTo(0, { duration: 3.2, easing: (x) => 1 - Math.pow(1 - x, 4) }) : scrollTo_(0)));

  /* ---------- depth model ---------- */
  const DEPTHS = [0, 200, 1000, 4000, 6000, MAX];
  const WATER = ['#0d6b73', '#0a4a56', '#052a35', '#02121a', '#010a10', '#01060b'];
  const TEMP = [24, 15, 5, 2, 1.5, 2];
  const water = $('#water'), gNum = $('#gaugeNum'), gFill = $('#gaugeFill');
  let depth = 0, snowSpeed = 1;
  function waterAt(d) {
    let i = 0; while (i < DEPTHS.length - 2 && d > DEPTHS[i + 1]) i++;
    const t = clamp(0, 1, (d - DEPTHS[i]) / (DEPTHS[i + 1] - DEPTHS[i]));
    return gsap.utils.interpolate(WATER[i], WATER[i + 1], t);
  }
  function lerpTable(arr, d) {
    let i = 0; while (i < DEPTHS.length - 2 && d > DEPTHS[i + 1]) i++;
    const t = clamp(0, 1, (d - DEPTHS[i]) / (DEPTHS[i + 1] - DEPTHS[i]));
    return arr[i] + (arr[i + 1] - arr[i]) * t;
  }
  function setDepth(d) {
    depth = clamp(0, MAX, d);
    gNum.textContent = fmt(depth);
    gFill.style.transform = `scaleY(${depth / MAX})`;
    water.style.background = waterAt(depth);
    snowSpeed = 1 + depth / MAX;
  }
  setDepth(0);

  /* ---------- hero: load-in ---------- */
  const chars = $$('.ch');
  if (!reduced) {
    gsap.set(chars, { yPercent: 70, rotationX: -80, opacity: 0, transformOrigin: '50% 100%' });
    gsap.set(['#surfaceSub', '#hint'], { opacity: 0, y: 16 });
    gsap.set('.jf', { opacity: 0, y: 80 });
    gsap.timeline({ defaults: { ease: 'expo.out' } })
      .to(chars, { yPercent: 0, rotationX: 0, opacity: 1, duration: 1.8, stagger: 0.1 }, 0.2)
      .to('.jf--a', { opacity: 0.95, y: 0, duration: 2.4 }, 0.5)
      .to('.jf--b', { opacity: 0.55, y: 0, duration: 2.4 }, 0.7)
      .to('.jf--c', { opacity: 0.8, y: 0, duration: 2.6 }, 0.9)
      .to(['#surfaceSub', '#hint'], { opacity: 1, y: 0, duration: 1.4, stagger: 0.15 }, 1.1);

    /* hero scroll: the title tears apart and dissolves into the dive */
    const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '.surface', start: 'top top', end: 'bottom bottom', scrub: 0.6 } });
    tl.to(chars, { x: (i) => (i - 2) * innerWidth * 0.2, y: (i) => [-40, 60, -90, 70, -30][i], rotationZ: (i) => (i - 2) * 9, scale: 1.8, filter: 'blur(20px)', opacity: 0, duration: 0.5, ease: 'power2.in' }, 0.02)
      .to('#surfaceSub', { opacity: 0, y: -30, duration: 0.15 }, 0)
      .to('#hint', { opacity: 0, duration: 0.08 }, 0)
      .to('.rays', { scale: 1.35, opacity: 0.25, duration: 1 }, 0)
      .to('.jf--a', { yPercent: -220, duration: 1 }, 0)
      .to('.jf--b', { yPercent: -120, duration: 1 }, 0)
      .to('.jf--c', { yPercent: -330, xPercent: -20, duration: 1 }, 0)
      .fromTo('#surfaceLine', { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, duration: 0.2, ease: 'power2.out' }, 0.42)
      .to('#surfaceLine', { autoAlpha: 0, y: -50, duration: 0.14, ease: 'power2.in' }, 0.76);

    // pointer parallax on the hero creatures (devices that hover)
    if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
      const set = $$('.jf').map((el) => ({ x: gsap.quickTo(el, 'x', { duration: 1.2, ease: 'power3' }), y: gsap.quickTo(el, 'rotation', { duration: 1.6, ease: 'power3' }), k: parseFloat(el.dataset.d) }));
      addEventListener('pointermove', (e) => {
        if (scrollY > innerHeight) return;
        const nx = e.clientX / innerWidth - 0.5;
        set.forEach((s) => { s.x(nx * -60 * s.k); s.y(nx * 6 * s.k); });
      });
    }
  }

  /* ---------- headline masks that open once ---------- */
  function lineReveal(el) {
    if (reduced) return;
    const spans = $$('.ln>span', el);
    gsap.set(spans, { yPercent: 115 });
    ScrollTrigger.create({ trigger: el, start: 'top 85%', once: true, onEnter: () => gsap.to(spans, { yPercent: 0, duration: 1.3, stagger: 0.12, ease: 'expo.out' }) });
  }
  ['#trenchH', '.light__h'].forEach((s) => lineReveal($(s)));

  /* ---------- zones: pinned, evolving through five states ---------- */
  (() => {
    const zn = $$('.zn'), zc = $$('.zc'), zart = $$('.zart');
    const dPress = $('#dPress'), dTemp = $('#dTemp'), dLight = $('#dLight');
    const BREAK = [0, 0.2, 0.4, 0.6, 0.8, 1];
    let cur = -1;
    const readouts = (d) => {
      dPress.textContent = fmt(1 + d / 10);
      dTemp.textContent = lerpTable(TEMP, d).toFixed(d > 1000 ? 1 : 0);
      dLight.textContent = d >= 1000 ? '0' : d < 5 ? '100' : Math.max(0, 100 * Math.exp(-d / 43)).toFixed(d < 200 ? 1 : 2).replace(/\.?0+$/, '') || '0';
    };
    function show(i) {
      if (i === cur) return;
      const prev = cur; cur = i;
      if (prev >= 0) {
        gsap.to(zn[prev], { yPercent: -60, autoAlpha: 0, duration: 0.5, ease: 'power3.in', overwrite: true });
        gsap.to(zc[prev], { autoAlpha: 0, y: -16, duration: 0.35, overwrite: true });
        gsap.to(zart[prev], { autoAlpha: 0, scale: 1.12, duration: 0.7, overwrite: true });
      }
      gsap.fromTo(zn[i], { yPercent: 70, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 1.1, ease: 'expo.out', overwrite: true, delay: prev >= 0 ? 0.15 : 0 });
      gsap.fromTo(zc[i], { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out', overwrite: true, delay: 0.3 });
      gsap.fromTo(zart[i], { autoAlpha: 0, scale: 0.9 }, { autoAlpha: 1, scale: 1, duration: 1.2, ease: 'expo.out', overwrite: true, delay: 0.1 });
    }
    const update = (p) => {
      // piecewise p -> depth so each zone gets equal scroll
      let i = Math.min(4, Math.floor(p * 5 - 1e-6)); if (p <= 0) i = 0;
      const t = clamp(0, 1, (p - BREAK[i]) / 0.2);
      const d = DEPTHS[i] + (DEPTHS[i + 1] - DEPTHS[i]) * t;
      setDepth(d); readouts(d); show(i);
      const a = zart[i];
      gsap.set($('.a1', a), { yPercent: -50 + (0.5 - t) * 18 });
      gsap.set($('.a2', a), { yPercent: (t - 0.5) * 30 });
    };
    if (reduced) { readouts(0); return; }
    gsap.set([...zn, ...zc, ...zart], { autoAlpha: 0 });
    ScrollTrigger.create({ trigger: '.zones', start: 'top top', end: 'bottom bottom', scrub: true, onUpdate: (s) => update(s.progress), onEnterBack: (s) => update(s.progress), onLeave: () => update(1), onLeaveBack: () => { setDepth(0); readouts(0); show(0); } });
    ScrollTrigger.create({ trigger: '.zones', start: 'top 80%', once: true, onEnter: () => { if (cur < 0) show(0); } });
  })();

  /* ---------- trench: a mask opens onto the deepest place ---------- */
  if (!reduced) {
    const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '.trench', start: 'top top', end: 'bottom bottom', scrub: 0.6 } });
    tl.fromTo('#trenchMask', { clipPath: 'inset(34% 38% 34% 38% round 28px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 0.35, ease: 'power2.inOut' }, 0)
      .fromTo('.trench__stage', { scale: 1.45 }, { scale: 1, duration: 0.55 }, 0)
      .fromTo('#probe', { top: '24.4%', opacity: 0 }, { top: '97.6%', opacity: 1, duration: 0.5 }, 0.35)
      .to('#probe', { opacity: 0, duration: 0.01 }, 0.95)
      .fromTo('.t0', { opacity: 0 }, { opacity: 1, duration: 0.05 }, 0.33)
      .fromTo('.t1', { opacity: 0 }, { opacity: 1, duration: 0.05 }, 0.7)
      .fromTo('.t2', { opacity: 0 }, { opacity: 1, duration: 0.05 }, 0.84)
      .fromTo('#trenchP', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.08, ease: 'power2.out' }, 0.88)
      .to('#trenchH', { opacity: 0, y: -40, duration: 0.12 }, 0.3);
  }

  /* ---------- expeditions: horizontal travel inside vertical scroll ---------- */
  (() => {
    const sec = $('.exp'), track = $('#expTrack'), bar_ = $('#expBar');
    if (reduced) return;
    let dist = 0;
    const measure = () => { dist = Math.max(0, track.scrollWidth - innerWidth); sec.style.height = `${innerHeight + dist * 1.15}px`; };
    measure();
    ScrollTrigger.addEventListener('refreshInit', measure);
    gsap.to(track, { x: () => -dist, ease: 'none', scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom bottom', scrub: 0.5, invalidateOnRefresh: true, onUpdate: (s) => { bar_.style.transform = `scaleX(${s.progress})`; } } });
    $$('.ep__art').forEach((art, i) => gsap.fromTo(art, { x: 140 }, { x: -140, ease: 'none', scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom bottom', scrub: 0.8 } }));
    $$('.ep__depth').forEach((el) => gsap.fromTo(el, { x: 80 }, { x: -60, ease: 'none', scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom bottom', scrub: 0.8 } }));
    gsap.from('.exp__intro .h2', { yPercent: 40, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: sec, start: 'top 70%', once: true } });
  })();

  /* ---------- specimens: camera flies forward through a field of cards ---------- */
  (() => {
    if (reduced) return;
    const group = $('#specGroup'), cards = $$('.card'), STEP = 1000;
    const render = (g) => {
      cards.forEach((c, i) => {
        const wz = -i * STEP + g;
        const o = smooth(-2700, -1200, wz) * (1 - smooth(450, 900, wz));
        c.style.opacity = o.toFixed(3);
        c.style.visibility = o < 0.01 ? 'hidden' : 'visible';
        c.style.filter = wz < -1400 ? `blur(${Math.min(8, (-wz - 1400) / 200).toFixed(1)}px)` : 'none';
      });
    };
    render(0);
    const st = { g: 0 };
    gsap.to(st, { g: STEP * 4, ease: 'none', scrollTrigger: { trigger: '.spec', start: 'top top', end: 'bottom bottom', scrub: 0.6 }, onUpdate: () => { gsap.set(group, { z: st.g }); render(st.g); } });
    gsap.from('.spec__h', { opacity: 0, y: 40, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.spec', start: 'top 60%', once: true } });
    if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
      const rx = gsap.quickTo(group, 'rotationY', { duration: 1.4, ease: 'power3' }), ry = gsap.quickTo(group, 'rotationX', { duration: 1.4, ease: 'power3' });
      $('.spec__pin').addEventListener('pointermove', (e) => { rx((e.clientX / innerWidth - 0.5) * -8); ry((e.clientY / innerHeight - 0.5) * 5); });
    }
  })();

  /* ---------- light: contrasting surface environment ---------- */
  (() => {
    ScrollTrigger.create({ trigger: '.exp', start: 'top 70%', endTrigger: '.spec', end: 'bottom 60%', onToggle: (s) => { if (!ScrollTrigger.isInViewport($('.light'), 0.1)) gauge.classList.toggle('is-off', s.isActive); } });
    ScrollTrigger.create({ trigger: '.light', start: 'top 70px', end: 'bottom 70px', onToggle: (s) => bar.classList.toggle('on-light', s.isActive) });
    ScrollTrigger.create({ trigger: '.finale', start: 'top 70px', end: 'bottom 70px', onToggle: (s) => bar.classList.toggle('on-light', s.isActive || ScrollTrigger.isInViewport($('.light'))) });
    ScrollTrigger.create({ trigger: '.light', start: 'top 85%', onEnter: () => gauge.classList.add('is-off'), onLeaveBack: () => gauge.classList.remove('is-off') });
    if (reduced) return;
    gsap.set('.facts li', { opacity: 0, y: 40 });
    ScrollTrigger.create({ trigger: '.facts', start: 'top 82%', once: true, onEnter: () => gsap.to('.facts li', { opacity: 1, y: 0, duration: 1.1, stagger: 0.14, ease: 'expo.out' }) });
    gsap.from('.light__cols > p', { opacity: 0, y: 40, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.light__cols', start: 'top 85%', once: true } });
  })();

  /* ---------- finale: three lines drift against each other ---------- */
  if (!reduced) {
    const f = { trigger: '.finale__type', start: 'top bottom', end: 'bottom 30%', scrub: 0.6 };
    gsap.fromTo('.fl--1', { x: '-14vw' }, { x: '12vw', ease: 'none', scrollTrigger: f });
    gsap.fromTo('.fl--2', { x: '14vw' }, { x: '-4vw', ease: 'none', scrollTrigger: f });
    gsap.fromTo('.fl--3', { x: '-10vw' }, { x: '6vw', ease: 'none', scrollTrigger: f });
  }

  /* ---------- form (client-side only) ---------- */
  const form = $('#form'), ferr = $('#ferr'), fok = $('#fok');
  form.addEventListener('submit', (e) => {
    e.preventDefault(); fok.hidden = true; ferr.textContent = '';
    const v = form.elements.email.value.trim();
    if (!/^\S+@\S+\.\S+$/.test(v)) { ferr.textContent = 'Enter an email address like name@example.com.'; form.elements.email.focus(); return; }
    fok.hidden = false; form.reset();
  });

  /* ---------- marine snow: particles that react to scroll velocity ---------- */
  (() => {
    const cv = $('#snow'), ctx = cv.getContext('2d');
    let W = 0, H = 0, ps = [], dpr = Math.min(devicePixelRatio || 1, 1.75), vel = 0, lastS = scrollY, running = true;
    const mk = () => ({ x: Math.random(), y: Math.random(), z: 0.2 + Math.random() * 0.8, r: Math.random() * 1.6 + 0.4, ph: Math.random() * 6.28 });
    function size() { W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ps = Array.from({ length: Math.round(Math.min(160, W / 9)) }, mk); }
    size(); addEventListener('resize', size);
    function draw(t) {
      ctx.clearRect(0, 0, W, H);
      const a = 0.25 + Math.min(0.5, depth / MAX * 0.4);
      for (const p of ps) {
        const still = root.classList.contains('paused');
        p.y += (still ? 0 : 0.0006 * snowSpeed * p.z) - vel * p.z * 0.00055;
        if (!still) p.x += Math.sin(t / 2000 + p.ph) * 0.00012;
        if (p.y > 1.02) p.y = -0.02; if (p.y < -0.02) p.y = 1.02; if (p.x > 1.02) p.x = -0.02; if (p.x < -0.02) p.x = 1.02;
        ctx.globalAlpha = a * p.z;
        ctx.fillStyle = p.z > 0.8 ? '#bff8f0' : '#e8efea';
        ctx.beginPath(); ctx.arc(p.x * W, p.y * H, p.r * p.z * 1.6, 0, 6.283); ctx.fill();
      }
    }
    if (reduced) { draw(0); return; }
    gsap.ticker.add((t) => {
      if (document.hidden) return;
      const s = scrollY; vel += ((s - lastS) - vel) * 0.18; lastS = s;
      draw(t * 1000);
    });
  })();

  /* ---------- keep triggers honest ---------- */
  addEventListener('load', () => ScrollTrigger.refresh());
  document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
