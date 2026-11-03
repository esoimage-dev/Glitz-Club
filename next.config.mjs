// With NEXT_PUBLIC_BASE_PATH set (see scripts/deploy.sh) this builds the static site for GitHub Pages.
const base = process.env.NEXT_PUBLIC_BASE_PATH || '';

/** @type {import('next').NextConfig} */
export default {
  images: { loader: 'custom', loaderFile: './lib/image-loader.ts', qualities: [75, 85] },
  devIndicators: false,
  agentRules: false,
  ...(base ? { output: 'export', basePath: base, trailingSlash: true } : {}),
};
