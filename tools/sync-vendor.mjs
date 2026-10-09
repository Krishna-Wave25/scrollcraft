// Copies self-hosted libs + fonts from node_modules into each site.
import fs from 'node:fs';
const nm = 'node_modules';
const cp = (from, to) => { fs.mkdirSync(to.replace(/\/[^/]+$/, ''), { recursive: true }); fs.copyFileSync(from, to); };
for (const s of ['a', 'b']) {
  cp(`${nm}/gsap/dist/gsap.min.js`, `sites/${s}/vendor/gsap.min.js`);
  cp(`${nm}/gsap/dist/ScrollTrigger.min.js`, `sites/${s}/vendor/ScrollTrigger.min.js`);
  cp(`${nm}/lenis/dist/lenis.min.js`, `sites/${s}/vendor/lenis.min.js`);
}
const f = (pkg, name) => cp(`${nm}/@fontsource/${pkg}/files/${name}`, `sites/%S%/fonts/${name}`);
const fonts = { a: [['instrument-serif','instrument-serif-latin-400-normal.woff2'],['instrument-serif','instrument-serif-latin-400-italic.woff2'],['hanken-grotesk','hanken-grotesk-latin-400-normal.woff2'],['hanken-grotesk','hanken-grotesk-latin-500-normal.woff2'],['hanken-grotesk','hanken-grotesk-latin-700-normal.woff2']],
  b: [['unbounded','unbounded-latin-400-normal.woff2'],['unbounded','unbounded-latin-700-normal.woff2'],['unbounded','unbounded-latin-900-normal.woff2'],['familjen-grotesk','familjen-grotesk-latin-400-normal.woff2'],['familjen-grotesk','familjen-grotesk-latin-600-normal.woff2'],['familjen-grotesk','familjen-grotesk-latin-400-italic.woff2']] };
for (const s of Object.keys(fonts)) for (const [p, n] of fonts[s]) cp(`${nm}/@fontsource/${p}/files/${n}`, `sites/${s}/fonts/${n}`);
console.log('vendor synced');
