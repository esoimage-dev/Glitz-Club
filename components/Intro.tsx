'use client';
import { useEffect, useState } from 'react';
import { LOGO_H, LOGO_PATHS, LOGO_W } from '@/lib/logo-paths';

const ORDER: (keyof typeof LOGO_PATHS)[] = ['G', 'L', 'I', 'T', 'Z', 'C', 'Lc', 'U', 'B'];
const ALL = Object.values(LOGO_PATHS).join(' ');
const ARCH = 'M-1 0V-1A1 1 0 0 1 1 -1V0Z';

/**
 * "L'accensione". Light runs along the outline of every letter in LED colours, the lockup
 * flickers on like a sign, then the black opens from the ground up in the shape of the arch.
 * The final frame is the registered logo, untouched.
 */
export default function Intro() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (document.documentElement.dataset.intro === 'seen') { setDone(true); return; }
    try { sessionStorage.setItem('glitz-intro', '1'); } catch {}
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t = setTimeout(() => setDone(true), reduced ? 0 : 3950);
    return () => clearTimeout(t);
  }, []);

  if (done) return null;
  return (
    <div className="intro" aria-hidden="true" onClick={() => setDone(true)}>
      <svg className="intro-bg" width="100%" height="100%">
        <defs>
          <mask id="intro-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
            <rect width="100%" height="100%" fill="#fff" />
            <path className="intro-hole" d={ARCH} fill="#000" />
          </mask>
          <linearGradient id="intro-line" x1="0" x2="1" y1="0" y2="0"><stop stopColor="#5a5cf7" /><stop offset=".55" stopColor="#d41fd0" /><stop offset="1" stopColor="#ff8a2a" /></linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="#000" mask="url(#intro-mask)" />
        <path className="intro-hole intro-hole-line" d={ARCH} fill="none" stroke="url(#intro-line)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
      </svg>
      <svg className="intro-logo" viewBox={`0 0 ${LOGO_W} ${LOGO_H}`}>
        <defs>
          <linearGradient id="led-sweep" gradientUnits="userSpaceOnUse" x1="0" x2={LOGO_W} y1="0" y2="0">
            <stop offset="0" stopColor="#5a5cf7" />
            <stop offset=".5" stopColor="#d41fd0" />
            <stop offset="1" stopColor="#ff8a2a" />
          </linearGradient>
        </defs>
        <path className="intro-glow" fill="url(#led-sweep)" fillRule="evenodd" d={ALL} />
        {ORDER.map((k, i) => (
          <path key={k} className="st" pathLength={1} d={LOGO_PATHS[k]} style={{ ['--d' as string]: `${i < 5 ? i * 0.1 : 0.55 + (i - 5) * 0.08}s` }} />
        ))}
        {ORDER.map((k, i) => (
          <path key={k} className="fl" fillRule="evenodd" d={LOGO_PATHS[k]} style={{ ['--f' as string]: `${1.4 + [0, 0.1, 0.32, 0.05, 0.18, 0.4, 0.4, 0.4, 0.4][i]}s` }} />
        ))}
      </svg>
    </div>
  );
}
