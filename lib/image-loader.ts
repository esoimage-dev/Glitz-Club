// Static hosting has no image optimiser: photos are already sized by scripts/media.mjs.
export default function imageLoader({ src, width }: { src: string; width: number }) {
  return `${process.env.NEXT_PUBLIC_BASE_PATH || ''}${src}?w=${width}`;
}
