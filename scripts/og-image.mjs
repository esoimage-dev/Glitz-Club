// Renders the social preview (WhatsApp, Instagram, X...): the real sunset on the sea and the logo, nothing else.
// Run: node scripts/og-image.mjs x [photo] [output] [vertical position]
import { chromium } from 'playwright';
import fs from 'node:fs';
import sharp from 'sharp';
const logo = fs.readFileSync('public/brand/glitz-logo-white.svg', 'utf8');
const photo = process.argv[3] || 'aereo-tramonto';
const out = process.argv[4] || 'public/brand/og.jpg';
const b64 = fs.readFileSync(`public/media/${photo}.jpg`).toString('base64');
const html = `<!doctype html><body style="margin:0;width:1200px;height:630px;position:relative;overflow:hidden;background:#000">
<img src="data:image/jpeg;base64,${b64}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% ${process.argv[5] || '3%'}">
<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.1),rgba(0,0,0,.28) 55%,rgba(0,0,0,.62))"></div>
<div style="position:absolute;left:50%;top:50%;width:600px;transform:translate(-50%,-50%);filter:drop-shadow(0 2px 24px rgba(0,0,0,.45))">${logo}</div>
</body>`;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.setContent(html);
await p.waitForTimeout(400);
const png = await p.screenshot();
await b.close();
await sharp(png).jpeg({ quality: 84, mozjpeg: true }).toFile(out);
console.log(out, fs.statSync(out).size);
