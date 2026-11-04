// Web-sized versions of every photo, so phones and small windows never decode a 2600px JPEG while scrolling.
// Run after scripts/media.mjs: node scripts/image-sizes.mjs
import sharp from 'sharp';
import fs from 'node:fs';
for (const w of [640, 1080, 1920]) {
  fs.mkdirSync(`public/media/w${w}`, { recursive: true });
  for (const f of fs.readdirSync('public/media')) {
    if (!f.endsWith('.jpg')) continue;
    await sharp(`public/media/${f}`).resize({ width: w, withoutEnlargement: true }).webp({ quality: 76 }).toFile(`public/media/w${w}/${f.replace('.jpg', '.webp')}`);
  }
}
