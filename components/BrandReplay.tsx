'use client';
import { useState } from 'react';
import { LOGO_H, LOGO_PATHS, LOGO_W } from '@/lib/logo-paths';

const ORDER: (keyof typeof LOGO_PATHS)[] = ['G', 'L', 'I', 'T', 'Z', 'C', 'Lc', 'U', 'B'];
const ALL = Object.values(LOGO_PATHS).join(' ');

export default function BrandReplay() {
  const [k, setK] = useState(0);
  return (
    <div className="br-replay">
      <svg key={k} className="intro-logo intro-logo-loop" viewBox={`0 0 ${LOGO_W} ${LOGO_H}`} role="img" aria-label="Il logo Glitz che si accende">
        <defs><linearGradient id="led-sweep" gradientUnits="userSpaceOnUse" x1="0" x2={LOGO_W} y1="0" y2="0"><stop offset="0" stopColor="#5a5cf7" /><stop offset=".5" stopColor="#d41fd0" /><stop offset="1" stopColor="#ff8a2a" /></linearGradient></defs>
        <path className="intro-glow" fill="url(#led-sweep)" fillRule="evenodd" d={ALL} />
        {ORDER.map((p, i) => <path key={p} className="st" pathLength={1000} d={LOGO_PATHS[p]} style={{ ['--d' as string]: `${i < 5 ? i * 0.1 : 0.55 + (i - 5) * 0.08}s` }} />)}
        {ORDER.map((p, i) => <path key={p} className="fl" fillRule="evenodd" d={LOGO_PATHS[p]} style={{ ['--f' as string]: `${1.4 + [0, 0.1, 0.32, 0.05, 0.18, 0.4, 0.4, 0.4, 0.4][i]}s` }} />)}
      </svg>
      <button className="btn btn-line" onClick={() => setK(k + 1)}><span>Riaccendi</span></button>
    </div>
  );
}
