// Optimises the raw photos into public/media and public/posters. Run: node scripts/media.mjs <scratch-dir>
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
const A = 'asset', S = process.argv[2], IMG = process.argv[3];
const photos = {
  'sofa-dino': `${A}/fd476a69-49b7-42f4-882c-c2de45da3139.jpg`,
  'lounge-giardino': `${A}/a8dc8353-ea8b-4fd9-8892-e3985115400a.jpg`,
  'terrazza-giorno': `${A}/d9359d35-91ef-4b87-a4d5-71133f4f51ba.jpg`,
  'arco-magenta': `${A}/c76c9930-f0af-4795-857d-a15c50927e9d.jpg`,
  'scale-tramonto': `${A}/e9c0bb16-0acc-4281-a257-db9f988470c6.jpg`,
  'aereo-tramonto': `${A}/6lina1we_PHOTO-2025-09-16-12-45-39.jpg`,
  'aereo-sera': `${A}/9c0lj4wr_PHOTO-2025-09-16-12-45-38 2.jpg`,
  'palma-piscina': `${A}/1kevf5m4_PHOTO-2025-09-16-12-54-45.jpg`,
  'villa-notte': `${A}/main.jpg`,
  'sole-arco': `${S}/site/media/DSC09646.jpg`,
  'arco-giorno': `${S}/site/media/DSC09387.jpg`,
};
for (const [n, f] of Object.entries(photos)) {
  await sharp(f, { limitInputPixels: false }).rotate().resize({ width: 2600, height: 2600, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toFile(`public/media/${n}.jpg`);
  console.log(n);
}
// Night shots only exist in the Instagram screenshots for now: low-res stand-ins until the videos arrive.
const crops = {
  'folla-arco': ['2.png', 535, 700, 620, 780],
  'dj-pad': ['2.png', 1160, 720, 620, 760],
  'dj-mixer': ['3.png', 1785, 440, 615, 750],
  'fumo-folla': ['3.png', 1785, 1260, 615, 620],
  'dj-laser': ['3.png', 1160, 1260, 620, 600],
};
for (const [n, [f, left, top, width, height]] of Object.entries(crops))
  await sharp(path.join(IMG, f)).extract({ left, top, width, height }).jpeg({ quality: 86 }).toFile(`public/media/${n}.jpg`);
const dir = `${S}/site/posters`;
for (const f of fs.readdirSync(dir)) {
  await sharp(path.join(dir, f)).resize({ width: 900, withoutEnlargement: true }).jpeg({ quality: 82 }).toFile(`public/posters/${path.parse(f).name.replace('2027-2027','2027')}.jpg`);
}
