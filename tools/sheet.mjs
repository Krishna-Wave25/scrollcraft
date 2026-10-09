// Usage: node tools/sheet.mjs <site> <prefix> <out.png> [cols]  — contact sheet of screenshots for review.
import { chromium } from 'playwright-core';
import fs from 'node:fs'; import path from 'node:path'; import { pathToFileURL } from 'node:url';
const [site, prefix, out, cols = '3'] = process.argv.slice(2);
const dir = path.resolve(`artifacts/website-${site}`);
const files = fs.readdirSync(dir).filter((f) => f.startsWith(prefix) && f.endsWith('.png') && !f.includes('sheet')).sort();
const html = `<body style="margin:0;background:#222;display:grid;grid-template-columns:repeat(${cols},1fr);gap:6px">${files.map((f) => `<div style="color:#fff;font:12px sans-serif"><img src="file:///${pathToFileURL(dir).href.replace('file:///','')}/${f}" style="width:100%;display:block">${f}</div>`).join('')}</body>`;
const b = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
const p = await b.newPage({ viewport: { width: 1800, height: 900 } });
fs.writeFileSync('artifacts/_sheet.html', html);
await p.goto('file:///' + pathToFileURL(path.resolve('artifacts/_sheet.html')).href.replace('file:///',''));
await p.waitForTimeout(500);
await p.screenshot({ path: `artifacts/${out}`, fullPage: true });
await b.close(); console.log(files.length, 'frames ->', out);
