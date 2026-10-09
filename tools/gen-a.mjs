// Procedural art for Website A (HOLLIN). Original SVG compositions; no photography.
import fs from 'node:fs';
const out = 'sites/a/assets/';
const C = { fog:'#D8DDD9', mist:'#E6E9E4', chalk:'#F1F0EA', ink:'#14201B', pine:'#2B4639', moss:'#4F6B57', lichen:'#A5B596', pith:'#EDE5B0', sea:'#6C8E94', deep:'#35545B', rose:'#C9A196', sand:'#D9CBA9', dusk:'#7C8AA0' };
const grain = (id, seed, op = .22) => `<filter id="${id}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="${seed}" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0.08  0 0 0 0 0.12  0 0 0 0 0.1  0 0 0 ${op * 3} -0.4"/></filter>`;
const svg = (w, h, body, seed = 1, g = true) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><defs>${grain('g', seed)}</defs>${body}${g ? `<rect width="${w}" height="${h}" filter="url(#g)" opacity=".55" style="mix-blend-mode:multiply"/>` : ''}</svg>`;
const lin = (id, a, b, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
const w = (name, s) => fs.writeFileSync(out + name, s);

// ---------- HERO LAYERS (1600 x 1100, parallax stack) ----------
w('hero-sky.svg', svg(1600, 1100, `<defs>${lin('s', '#93A0B4', C.fog)}${lin('h', '#fff0', C.pith)}<radialGradient id="r"><stop offset="0" stop-color="${C.pith}"/><stop offset=".55" stop-color="${C.pith}" stop-opacity=".55"/><stop offset="1" stop-color="${C.pith}" stop-opacity="0"/></radialGradient></defs>
<rect width="1600" height="1100" fill="url(#s)"/><rect y="500" width="1600" height="600" fill="url(#h)" opacity=".8"/>
<circle cx="1040" cy="520" r="420" fill="url(#r)" opacity=".7"/><circle cx="1040" cy="520" r="138" fill="${C.pith}"/>`, 3));
w('hero-far.svg', svg(1600, 1100, `<path d="M0 640 C160 560 300 600 470 540 S760 470 920 560 S1260 600 1600 500 V1100 H0Z" fill="${C.sea}" opacity=".5"/><path d="M0 720 C200 650 380 700 560 640 S980 600 1180 670 S1480 690 1600 640 V1100 H0Z" fill="${C.deep}" opacity=".55"/>`, 4, false));
w('hero-mid.svg', svg(1600, 1100, `<path d="M0 800 C180 730 360 790 560 740 S960 700 1160 770 S1500 780 1600 740 V1100 H0Z" fill="${C.moss}"/><path d="M0 900 C260 840 520 890 760 860 S1240 830 1600 880 V1100 H0Z" fill="${C.pine}"/>
<g fill="${C.chalk}"><rect x="230" y="700" width="210" height="120"/><rect x="210" y="690" width="250" height="16"/><path d="M280 820 V756 a45 45 0 0 1 90 0 V820Z" fill="${C.ink}"/><rect x="400" y="730" width="22" height="30" fill="${C.ink}"/></g>`, 5));
w('hero-fg.svg', svg(1600, 1100, `<path d="M0 1100 V880 C60 860 90 900 150 850 C190 820 230 870 280 940 L300 1100Z" fill="${C.ink}"/><path d="M1600 1100 V820 C1520 840 1470 780 1400 840 C1350 880 1330 960 1290 1100Z" fill="${C.ink}"/>
<g fill="${C.ink}"><path d="M1190 1100 C1160 900 1190 760 1210 640 C1230 760 1262 900 1236 1100Z"/><path d="M1290 1100 C1270 940 1290 830 1306 740 C1322 830 1346 950 1330 1100Z"/></g><rect y="1000" width="1600" height="100" fill="${C.ink}"/>`, 6, false));

// ---------- STAY PANELS (800 x 1000) ----------
const stays = {
  'stay-1': svg(800, 1000, `<defs>${lin('a', C.pith, C.fog)}</defs><rect width="800" height="1000" fill="url(#a)"/><circle cx="560" cy="330" r="150" fill="${C.chalk}" opacity=".9"/>
<rect x="0" y="640" width="800" height="360" fill="${C.sea}"/><rect y="640" width="800" height="14" fill="${C.deep}" opacity=".5"/><rect y="700" width="800" height="6" fill="${C.chalk}" opacity=".25"/><rect y="770" width="800" height="5" fill="${C.chalk}" opacity=".2"/>
<rect x="120" y="360" width="330" height="640" fill="${C.chalk}"/><path d="M190 1000 V620 a95 95 0 0 1 190 0 V1000Z" fill="${C.sea}"/><path d="M190 1000 V620 a95 95 0 0 1 190 0 V1000Z" fill="${C.ink}" opacity=".18"/><rect x="450" y="360" width="60" height="640" fill="${C.sand}"/>
<path d="M620 1000 C600 800 620 700 640 620 C660 700 690 800 676 1000Z" fill="${C.pine}"/>`, 11),
  'stay-2': svg(800, 1000, `<defs>${lin('a', C.rose, C.mist)}</defs><rect width="800" height="1000" fill="url(#a)"/><circle cx="220" cy="250" r="90" fill="${C.pith}"/>
<path d="M0 560 C200 480 360 560 520 500 S740 440 800 480 V1000H0Z" fill="${C.sand}"/><path d="M0 700 C160 640 340 720 540 650 S740 620 800 650 V1000H0Z" fill="${C.rose}"/><path d="M0 860 C240 790 420 880 800 800 V1000H0Z" fill="${C.sand}" opacity=".9"/>
<rect x="470" y="548" width="150" height="86" fill="${C.chalk}"/><rect x="470" y="540" width="170" height="10" fill="${C.mist}"/><rect x="510" y="580" width="32" height="54" fill="${C.ink}" opacity=".8"/><path d="M620 634 L840 700 L700 700Z" fill="${C.ink}" opacity=".18"/>`, 12),
  'stay-3': svg(800, 1000, `<defs>${lin('a', C.dusk, C.fog)}</defs><rect width="800" height="1000" fill="url(#a)"/><rect y="560" width="800" height="440" fill="${C.pine}"/>
<g fill="${C.chalk}"><path d="M0 1000 V860 H220 V800 H360 V740 H500 V680 H800 V1000Z"/></g><g fill="${C.mist}"><rect y="860" width="220" height="12"/><rect x="220" y="800" width="140" height="12"/><rect x="360" y="740" width="140" height="12"/></g>
<rect x="520" y="740" width="250" height="110" fill="${C.sea}"/><rect x="520" y="740" width="250" height="110" fill="${C.pith}" opacity=".25"/><circle cx="130" cy="500" r="190" fill="${C.pine}"/><circle cx="260" cy="560" r="130" fill="${C.moss}"/>`, 13),
  'stay-4': svg(800, 1000, `<defs>${lin('a', C.fog, C.chalk)}${lin('w', C.deep, C.sea)}</defs><rect width="800" height="1000" fill="url(#a)"/><path d="M0 560 L180 330 L330 500 L520 260 L800 560Z" fill="${C.dusk}" opacity=".7"/><path d="M0 560 L240 420 L400 540 L620 380 L800 560Z" fill="${C.lichen}"/>
<rect y="560" width="800" height="440" fill="url(#w)"/><rect y="640" width="800" height="5" fill="${C.chalk}" opacity=".3"/><rect y="760" width="800" height="5" fill="${C.chalk}" opacity=".25"/><rect y="880" width="800" height="5" fill="${C.chalk}" opacity=".2"/>
<g fill="${C.ink}"><rect x="200" y="640" width="6" height="150"/><rect x="330" y="640" width="6" height="150"/><rect x="210" y="590" width="136" height="60" fill="${C.pine}"/><path d="M196 592 L278 540 L350 592Z"/></g><rect x="200" y="790" width="140" height="120" fill="${C.ink}" opacity=".25"/>`, 14),
  'stay-5': svg(800, 1000, `<rect width="800" height="1000" fill="${C.sand}"/><rect x="60" y="0" width="680" height="1000" fill="${C.chalk}"/>
<g fill="${C.ink}" opacity=".9"><rect x="130" y="120" width="170" height="270" rx="85"/><rect x="500" y="120" width="170" height="270" rx="85"/><rect x="130" y="470" width="170" height="270" rx="85"/><rect x="500" y="470" width="170" height="270" rx="85"/></g>
<path d="M60 0 H740 V1000 H500 L60 560Z" fill="${C.ink}" opacity=".13"/><rect x="60" y="860" width="680" height="140" fill="${C.rose}"/><circle cx="400" cy="900" r="70" fill="${C.pine}"/><rect x="394" y="900" width="12" height="100" fill="${C.pine}"/>`, 15),
  'stay-6': svg(800, 1000, `<defs>${lin('a', C.pith, C.mist)}${lin('w', C.sea, C.deep)}</defs><rect width="800" height="1000" fill="url(#a)"/><circle cx="400" cy="400" r="210" fill="${C.rose}" opacity=".7"/>
<path d="M0 600 H320 L380 500 H800 V1000H0Z" fill="${C.sand}"/><rect y="760" width="800" height="240" fill="url(#w)"/><path d="M0 760 C100 740 140 780 240 760 S420 740 520 764 S700 750 800 762 V780 H0Z" fill="${C.chalk}" opacity=".5"/>
<rect x="470" y="300" width="64" height="200" fill="${C.chalk}"/><rect x="460" y="286" width="84" height="20" fill="${C.ink}"/><rect x="486" y="250" width="32" height="38" fill="${C.ink}"/><path d="M0 600 V640 H300 L340 600Z" fill="${C.ink}" opacity=".15"/>`, 16),
};
for (const [k, v] of Object.entries(stays)) w(k + '.svg', v);

// wide interlude art (1600 x 1000): concentric rings over dusk hills
w('interlude.svg', svg(1600, 1000, `<defs>${lin('a', C.pine, C.ink)}</defs><rect width="1600" height="1000" fill="url(#a)"/>
<circle cx="800" cy="470" r="260" fill="${C.pith}"/><g fill="none" stroke="${C.lichen}" stroke-width="2" opacity=".5"><circle cx="800" cy="470" r="340"/><circle cx="800" cy="470" r="430"/><circle cx="800" cy="470" r="540"/></g>
<path d="M0 1000 V720 C260 640 520 700 800 650 S1340 620 1600 700 V1000Z" fill="${C.ink}"/><path d="M0 1000 V860 C300 800 600 860 900 820 S1400 800 1600 850 V1000Z" fill="${C.pine}" opacity=".7"/>`, 21));
w('favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="${C.ink}"/><path d="M8 28 V16 a8 8 0 0 1 16 0 V28Z" fill="${C.pith}"/></svg>`);
console.log(fs.readdirSync(out));
