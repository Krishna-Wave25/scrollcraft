// Procedural art for Website B (HADAL). Original SVG illustrations; no photography.
import fs from 'node:fs';
const out = 'sites/b/assets/';
const K = { cy: '#5CF2E0', mg: '#FF4FA3', am: '#FFB547', bone: '#E8EFEA', abyss: '#02060B', deep: '#06222B', teal: '#0B4650' };
const w = (n, s) => fs.writeFileSync(out + n, s);
const glow = (id, r = 6) => `<filter id="${id}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="${r}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
const svg = (vb, body, defs = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}"><defs>${defs}</defs>${body}</svg>`;
const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();

// ---- Jellyfish (600 x 900) ----
function jelly(color, accent, n, seed) {
  const tent = [];
  for (let i = 0; i < n; i++) {
    const x = 170 + (260 * i) / (n - 1), sway = (rnd() - .5) * 90, len = 380 + rnd() * 330;
    tent.push(`<path d="M${x} 400 C${x + sway} ${400 + len * .35} ${x - sway} ${400 + len * .7} ${x + sway * .4} ${400 + len}" fill="none" stroke="${color}" stroke-width="${1.4 + rnd() * 1.6}" stroke-linecap="round" opacity=".${5 + Math.floor(rnd() * 4)}"/>`);
  }
  const ribs = [0, 1, 2, 3, 4, 5].map((i) => `<path d="M300 130 C${300 - 120 + i * 40} 200 ${180 + i * 48} 300 ${i < 3 ? 160 + i * 40 : 300 + (i - 3) * 50} 390" fill="none" stroke="${accent}" stroke-width="1.2" opacity=".35"/>`).join('');
  return svg('0 0 600 900', `<g filter="url(#g)">
<path d="M90 400 C90 140 200 70 300 70 S510 140 510 400 C470 372 440 430 400 396 C360 440 330 380 300 410 C270 380 240 440 200 396 C160 430 130 372 90 400Z" fill="url(#bell)" stroke="${accent}" stroke-width="2" stroke-opacity=".7"/>
${ribs}<ellipse cx="300" cy="250" rx="70" ry="90" fill="${accent}" opacity=".12"/>${tent.join('')}
<path d="M255 410 C230 520 300 560 280 700 M345 410 C370 520 300 570 330 720" stroke="${accent}" stroke-width="7" fill="none" stroke-linecap="round" opacity=".45"/></g>`,
    `${glow('g', 5)}<radialGradient id="bell" cx=".5" cy=".7" r=".8"><stop offset="0" stop-color="${color}" stop-opacity=".05"/><stop offset=".7" stop-color="${color}" stop-opacity=".28"/><stop offset="1" stop-color="${accent}" stop-opacity=".6"/></radialGradient>`);
}
w('jelly-1.svg', jelly(K.cy, K.cy, 11, 1));
w('jelly-2.svg', jelly(K.mg, '#ff8cc4', 9, 2));
w('jelly-3.svg', jelly('#8ab4ff', K.cy, 13, 3));

// ---- Specimens (600 x 600) ----
w('sp-angler.svg', svg('0 0 600 600', `<g filter="url(#g)">
<path d="M90 330 C100 200 260 150 360 210 C440 250 520 300 520 340 C520 400 440 470 330 460 C250 520 150 470 90 330Z" fill="#0d2a33" stroke="${K.cy}" stroke-opacity=".45" stroke-width="2"/>
<path d="M100 340 C150 380 220 400 300 390 M120 318 L96 334 M150 333 L122 354 M176 340 L150 366" stroke="${K.bone}" stroke-opacity=".8" stroke-width="3" fill="none" stroke-linecap="round"/>
<circle cx="330" cy="270" r="20" fill="${K.abyss}" stroke="${K.cy}" stroke-opacity=".6"/><circle cx="335" cy="266" r="6" fill="${K.cy}"/>
<path d="M250 190 C230 100 150 70 110 110" stroke="${K.cy}" stroke-opacity=".6" stroke-width="3" fill="none"/>
<circle cx="108" cy="112" r="16" fill="${K.am}"/><circle cx="108" cy="112" r="44" fill="${K.am}" opacity=".18"/>
<path d="M520 340 L585 300 L580 380Z" fill="#0d2a33" stroke="${K.cy}" stroke-opacity=".4"/></g>`, glow('g', 4)));
w('sp-siphon.svg', svg('0 0 600 600', `<g filter="url(#g)" fill="none" stroke-linecap="round">
<path d="M80 480 C200 520 220 340 320 360 S440 220 520 120" stroke="${K.mg}" stroke-opacity=".5" stroke-width="4"/>
${Array.from({ length: 14 }, (_, i) => { const t = i / 13, x = 80 + 440 * t, y = 480 - 360 * t + Math.sin(t * 9) * 46; return `<circle cx="${x}" cy="${y}" r="${12 + (1 - t) * 14}" fill="${K.mg}" fill-opacity=".14" stroke="${K.mg}" stroke-opacity=".8" stroke-width="2"/><path d="M${x} ${y + 12} q ${(i % 2 ? 1 : -1) * 18} 40 ${(i % 2 ? -1 : 1) * 6} 70" stroke="${K.mg}" stroke-opacity=".4" stroke-width="2"/>`; }).join('')}</g>`, glow('g', 4)));
w('sp-amphipod.svg', svg('0 0 600 600', `<g filter="url(#g)" fill="none" stroke="${K.cy}" stroke-linecap="round">
${Array.from({ length: 9 }, (_, i) => `<path d="M${120 + i * 48} ${300 - Math.sin(i / 8 * 3.14) * 90} q 30 ${40 + i * 4} 6 ${96 - i * 5}" stroke-width="${12 - i * .6}" stroke-opacity=".${3 + (i % 4)}" fill="${K.cy}" fill-opacity=".08"/>`).join('')}
<path d="M120 290 C60 250 40 200 70 150 M130 270 C90 230 100 170 140 140" stroke-width="2" stroke-opacity=".7"/>
<circle cx="132" cy="298" r="9" fill="${K.am}" stroke="none"/>
${Array.from({ length: 9 }, (_, i) => `<path d="M${130 + i * 48} ${360 - Math.sin(i / 8 * 3.14) * 80} l ${-6 + (i % 3) * 5} 54" stroke-width="2" stroke-opacity=".5"/>`).join('')}</g>`, glow('g', 3)));
w('sp-ostracod.svg', svg('0 0 600 600', `<g filter="url(#g)" fill="none" stroke="${K.cy}" stroke-opacity=".7">
${[250, 200, 150, 100, 55].map((r, i) => `<circle cx="300" cy="300" r="${r}" stroke-width="${i === 0 ? 3 : 1.5}" stroke-dasharray="${i % 2 ? '4 10' : '1 0'}"/>`).join('')}
${Array.from({ length: 36 }, (_, i) => { const a = i * Math.PI / 18, r1 = 55, r2 = 250 - (i % 2) * 40; return `<path d="M${300 + Math.cos(a) * r1} ${300 + Math.sin(a) * r1} L${300 + Math.cos(a) * r2} ${300 + Math.sin(a) * r2}" stroke-width="1" stroke-opacity=".35"/>`; }).join('')}
<circle cx="300" cy="300" r="22" fill="${K.cy}" stroke="none"/></g>`, glow('g', 4)));
w('sp-tube.svg', svg('0 0 600 600', `<g filter="url(#g)" fill="none" stroke-linecap="round">
${Array.from({ length: 8 }, (_, i) => { const x = 130 + i * 52, h = 220 + ((i * 97) % 150); return `<path d="M${x} 600 C${x - 20} ${600 - h * .5} ${x + 24} ${600 - h * .8} ${x + 4} ${600 - h}" stroke="${K.bone}" stroke-opacity=".28" stroke-width="16"/><path d="M${x + 4} ${600 - h} l -18 -30 M${x + 4} ${600 - h} l 0 -38 M${x + 4} ${600 - h} l 18 -30" stroke="${K.mg}" stroke-width="5" stroke-opacity=".9"/>`; }).join('')}
<path d="M0 600 C100 570 200 590 300 575 S500 590 600 570" stroke="${K.cy}" stroke-opacity=".4" stroke-width="2"/></g>`, glow('g', 3)));

// ---- Seabed ridges (1600 x 700) ----
const ridge = (c, d) => svg('0 0 1600 700', `<path d="${d}" fill="${c}"/>`);
w('ridge-1.svg', ridge('#031219', 'M0 360 C160 300 320 400 520 330 S880 230 1100 320 S1440 380 1600 300 V700 H0Z'));
w('ridge-2.svg', ridge('#020b10', 'M0 450 C200 390 360 480 600 420 S980 360 1200 440 S1500 470 1600 400 V700 H0Z'));
w('ridge-3.svg', ridge('#01070b', 'M0 560 C260 500 420 580 700 530 S1100 500 1300 560 S1500 570 1600 520 V700 H0Z'));

// ---- Light rays from the surface (1600 x 1000) ----
w('rays.svg', svg('0 0 1600 1000', `<g fill="url(#r)">${Array.from({ length: 11 }, (_, i) => { const x = 80 + i * 150 + (i % 3) * 30, wd = 40 + (i * 37) % 90; return `<polygon points="${x},0 ${x + wd},0 ${x + wd * 3.2 - 260 + (i % 4) * 60},1000 ${x - wd * 2 - 160 + (i % 4) * 60},1000" opacity="${.35 + (i % 4) * .15}"/>`; }).join('')}</g>`,
  `<linearGradient id="r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bff8f0" stop-opacity=".85"/><stop offset=".5" stop-color="#5CF2E0" stop-opacity=".2"/><stop offset="1" stop-color="#5CF2E0" stop-opacity="0"/></linearGradient>`));

// ---- Trench profile (1600 x 900): the section that gets revealed by a mask ----
const strata = ['#0b4650', '#083440', '#06242d', '#041820', '#02101a', '#01080e'];
w('trench.svg', svg('0 0 1600 900', `<rect width="1600" height="900" fill="url(#w)"/>
${strata.map((c, i) => `<rect y="${i * 150}" width="1600" height="150" fill="${c}" opacity=".0"/>`).join('')}
<path d="M0 220 C220 210 400 240 560 300 C640 330 700 420 760 560 C790 640 800 760 830 860 L880 900 L930 860 C980 760 990 640 1020 560 C1080 420 1140 330 1220 300 C1380 240 1500 210 1600 220 V900 H0Z" fill="#010508"/>
<path d="M0 220 C220 210 400 240 560 300 C640 330 700 420 760 560 C790 640 800 760 830 860" fill="none" stroke="${K.cy}" stroke-width="2.5" filter="url(#g)"/>
<path d="M1600 220 C1500 210 1380 240 1220 300 C1140 330 1080 420 1020 560 C990 640 980 760 930 860" fill="none" stroke="${K.cy}" stroke-width="2.5" filter="url(#g)"/>
<g stroke="${K.bone}" stroke-opacity=".18" stroke-width="1" stroke-dasharray="3 9">${[150, 300, 450, 600, 750].map((y) => `<line x1="0" x2="1600" y1="${y}" y2="${y}"/>`).join('')}</g>
<circle cx="880" cy="880" r="7" fill="${K.mg}" filter="url(#g)"/>`,
  `${glow('g', 5)}<linearGradient id="w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d5560"/><stop offset=".25" stop-color="#083540"/><stop offset=".6" stop-color="#03141c"/><stop offset="1" stop-color="#010609"/></linearGradient>`));

w('favicon.svg', svg('0 0 32 32', `<rect width="32" height="32" fill="${K.abyss}"/><circle cx="16" cy="16" r="9" fill="none" stroke="${K.cy}" stroke-width="2"/><circle cx="16" cy="16" r="3" fill="${K.mg}"/>`));
console.log(fs.readdirSync(out).length, 'assets');
