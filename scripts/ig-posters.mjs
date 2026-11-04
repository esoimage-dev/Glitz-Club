// The last 2026 posters only exist in the Instagram screenshots: stitches them back together until the originals arrive.
// Run: node scripts/ig-posters.mjs <screenshots-dir>
import sharp from 'sharp';
import path from 'node:path';
const dir = process.argv[2];
const K = 1.47; // screenshot scale
const tile = async (file, x, y0, y1) => sharp(path.join(dir, file)).extract({ left: Math.round(x * K), top: Math.round(y0 * K), width: Math.round(422 * K), height: Math.round((y1 - y0) * K) }).toBuffer({ resolveWithObject: true });

// Tile is cut by the bottom of screenshot 1 and continues in screenshot 2, scrolled by 894 px
async function stitched(x, name) {
  const top = await tile('1.png', x, 775, 1300);
  const bottom = await tile('2.png', x, 1300 - 894, 444);
  const w = top.info.width; const h = top.info.height + bottom.info.height;
  await sharp({ create: { width: w, height: h, channels: 3, background: '#000' } })
    .composite([{ input: top.data, top: 0, left: 0 }, { input: bottom.data, top: top.info.height, left: 0 }])
    .jpeg({ quality: 88 }).toFile(`public/posters/${name}.jpg`);
}
await stitched(788, '2026-08-29-damante');
await stitched(1212, '2026-08-22-face-to-face');
const room = await tile('2.png', 1212, 490, 1008); // starts below the reel icon
await sharp(room.data).jpeg({ quality: 88 }).toFile('public/posters/2026-08-06-glitz-room.jpg');
