// Static hosting has no image optimiser: scripts/image-sizes.mjs prepares the sizes this picks from.
export default function imageLoader({ src, width }: { src: string; width: number }) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || '';
  if (src.startsWith('/media/') && width <= 1920) {
    const size = width <= 640 ? 640 : width <= 1080 ? 1080 : 1920;
    return `${base}/media/w${size}/${src.slice(7).replace('.jpg', '.webp')}?w=${width}`;
  }
  return `${base}${src}?w=${width}`;
}
