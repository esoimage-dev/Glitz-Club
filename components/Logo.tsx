import { LOGO_H, LOGO_PATHS, LOGO_W } from '@/lib/logo-paths';

const ALL = Object.values(LOGO_PATHS).join(' ');

/** The registered lockup. Geometry is fixed: scale it, never redraw it. */
export function Logo({ className, title = 'Glitz Club' }: { className?: string; title?: string }) {
  return (
    <svg className={className} viewBox={`0 0 ${LOGO_W} ${LOGO_H}`} role="img" aria-label={title} fill="currentColor">
      <path fillRule="evenodd" d={ALL} />
    </svg>
  );
}

/** Same lockup, turning LED on hover: used in the header. */
export function LiveLogo({ id = 'logo-led' }: { id?: string }) {
  return (
    <svg className="logo-live" viewBox={`0 0 ${LOGO_W} ${LOGO_H}`} role="img" aria-label="Glitz Club" fill="currentColor">
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" x2={LOGO_W} y1="0" y2="0">
          <stop offset="0" stopColor="#5a5cf7" />
          <stop offset=".55" stopColor="#d41fd0" />
          <stop offset="1" stopColor="#ff8a2a" />
        </linearGradient>
      </defs>
      <path fillRule="evenodd" d={ALL} />
      <path className="sw" fillRule="evenodd" d={ALL} />
    </svg>
  );
}
