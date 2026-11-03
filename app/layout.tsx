import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import '@/styles/base.css';
import '@/styles/home.css';
import '@/styles/pages.css';
import Chrome from '@/components/Chrome';

const display = localFont({
  variable: '--font-display',
  display: 'swap',
  src: [
    { path: './fonts/melodrama-300.woff2', weight: '300' },
    { path: './fonts/melodrama-400.woff2', weight: '400' },
    { path: './fonts/melodrama-500.woff2', weight: '500' },
    { path: './fonts/melodrama-700.woff2', weight: '700' },
  ],
});
const text = localFont({
  variable: '--font-text',
  display: 'swap',
  src: [
    { path: './fonts/switzer-400.woff2', weight: '400' },
    { path: './fonts/switzer-500.woff2', weight: '500' },
    { path: './fonts/switzer-600.woff2', weight: '600' },
  ],
});

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';

export const metadata: Metadata = {
  title: { default: 'Glitz Club, San Nicola Arcella', template: '%s, Glitz Club' },
  description: "Il club all'aperto davanti all'Isola di Dino. Serate d'estate, tavoli vista mare e l'arco che si accende al tramonto.",
  icons: { icon: `${BASE}/brand/favicon.svg` },
  // The Pages link is a preview: the calendar is unconfirmed, so search engines stay out.
  ...(BASE ? { robots: { index: false, follow: false } } : {}),
};
export const viewport: Viewport = { themeColor: '#000000', viewportFit: 'cover' };

// Runs before paint so returning visitors never see a flash of the intro.
const introGate = `try{var p=location.pathname;if(p.charAt(p.length-1)==='/')p=p.slice(0,-1);if(sessionStorage.getItem('glitz-intro')||p!=='${BASE}')document.documentElement.dataset.intro='seen'}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={`${display.variable} ${text.variable}`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: introGate }} /></head>
      <body>
        <Chrome />
        {children}
      </body>
    </html>
  );
}
