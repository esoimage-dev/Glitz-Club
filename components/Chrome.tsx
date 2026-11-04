'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import Lenis from 'lenis';
import { LiveLogo } from './Logo';
import Intro from './Intro';
import { INSTAGRAM, TIKTOK, WHATSAPP, WHATSAPP_LABEL, events } from '@/lib/data';

const NAV = [
  { href: '/eventi', label: 'Serate', note: `${events.length} in estate`, img: '/media/fumo-folla.jpg' },
  { href: '/tavoli', label: 'Tavoli', note: 'scegli dalla mappa', img: '/media/scale-tramonto.jpg' },
  { href: '/il-club', label: 'Il club', note: 'il posto', img: '/media/sofa-dino.jpg' },
  { href: '/privati', label: 'Eventi privati', note: 'tutto per voi', img: '/media/villa-notte.jpg' },
  { href: '/info', label: 'Info', note: 'come arrivare', img: '/media/aereo-tramonto.jpg' },
];

const DARK = '[data-tone="night"], [data-dark="1"]';
const HEADER_BAND = 90;

const toTime = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(Math.floor(m % 60)).padStart(2, '0')}`;

type BarProps = { light?: boolean; path: string; open: boolean; onToggle: () => void; barRef?: React.Ref<HTMLElement> };

function Bar({ light, path, open, onToggle, barRef }: BarProps) {
  const suffix = light ? '-l' : '-d';
  return (
    <header ref={barRef} className={`hd ${light ? 'hd-light' : 'hd-dark'}`} aria-hidden={light || undefined} inert={light || undefined}>
      <div>
        <nav className="hd-nav" aria-label="Principale">
          {NAV.slice(0, 4).map((n) => <Link key={n.href} href={n.href} aria-current={path.startsWith(n.href) ? 'page' : undefined}>{n.label}</Link>)}
        </nav>
        <Link href="/" className="hd-logo hd-logo-m" aria-label="Glitz Club, home"><LiveLogo id={`logo-led-m${suffix}`} /></Link>
      </div>
      <Link href="/" className="hd-logo hd-logo-d" aria-label="Glitz Club, home"><LiveLogo id={`logo-led${suffix}`} /></Link>
      <div className="hd-right">
        <Link href="/eventi" className="btn hd-cta">Biglietti</Link>
        <button className="hd-burger" aria-label={open ? 'Chiudi il menu' : 'Apri il menu'} aria-expanded={open} onClick={onToggle}><i /></button>
      </div>
    </header>
  );
}

export default function Chrome() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const clock = useRef<{ root: HTMLDivElement | null; time: HTMLSpanElement | null; dot: SVGCircleElement | null }>({ root: null, time: null, dot: null });
  const lightBar = useRef<HTMLElement>(null);
  const lenis = useRef<Lenis | null>(null);
  const openRef = useRef(open);
  openRef.current = open;
  const fullscreen = path === '/tavoli';
  const clockOn = path === '/';

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || fullscreen) return;
    const l = new Lenis({ lerp: 0.11 });
    lenis.current = l;
    (window as unknown as { __lenis?: Lenis }).__lenis = l;
    let raf = requestAnimationFrame(function loop(t) { l.raf(t); raf = requestAnimationFrame(loop); });
    return () => { cancelAnimationFrame(raf); l.destroy(); lenis.current = null; delete (window as unknown as { __lenis?: Lenis }).__lenis; };
  }, [fullscreen]);

  useEffect(() => { setOpen(false); window.scrollTo(0, 0); }, [path]);
  useEffect(() => { open ? lenis.current?.stop() : lenis.current?.start(); document.body.style.overflow = open ? 'hidden' : ''; }, [open]);
  useEffect(() => { if (!open) return; const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false); addEventListener('keydown', k); return () => removeEventListener('keydown', k); }, [open]);

  // Runs on every scroll frame: paints the white header over dark areas and moves the clock.
  useEffect(() => {
    let raf = 0;
    const read = () => {
      raf = 0;
      const dark = [...document.querySelectorAll<HTMLElement>(DARK)].map((el) => el.getBoundingClientRect());

      if (lightBar.current) {
        let d = '';
        if (openRef.current) d = `M0 0H${innerWidth}V${HEADER_BAND}H0Z`;
        else for (const r of dark) {
          const top = Math.max(0, r.top); const bottom = Math.min(HEADER_BAND, r.bottom);
          if (bottom > top && r.right > 0 && r.left < innerWidth) d += `M${r.left} ${top}H${r.right}V${bottom}H${r.left}Z`;
        }
        lightBar.current.style.clipPath = `path('${d || 'M0 0Z'}')`;
      }

      const c = clock.current;
      if (c.time && c.root) {
        // A line sweeping the viewport top to bottom: 18:00 at the very top of the page, 05:00 at the very end.
        const max = document.documentElement.scrollHeight - innerHeight;
        const line = innerHeight * Math.min(1, Math.max(0, scrollY / (max || 1)));
        let minutes = 1080;
        document.querySelectorAll<HTMLElement>('[data-time]').forEach((s) => {
          const r = s.getBoundingClientRect();
          if (r.top > line) return;
          const [a, b] = s.dataset.time!.split('-').map(Number);
          minutes = a + (b - a) * Math.min(1, (line - r.top) / r.height);
        });
        if (scrollY >= max - 1) minutes = 1740;
        c.time.textContent = toTime(minutes);
        const ang = Math.PI * (1 - Math.min(1, Math.max(0, (minutes - 1080) / (1740 - 1080))));
        c.dot?.setAttribute('cx', (17 + 15 * Math.cos(ang)).toFixed(2));
        c.dot?.setAttribute('cy', (17 - 15 * Math.sin(ang)).toFixed(2));
        const box = c.root.getBoundingClientRect();
        const x = box.left + 12; const y = box.top + box.height / 2;
        c.root.dataset.tone = dark.some((r) => r.left <= x && r.right >= x && r.top <= y && r.bottom >= y) ? 'night' : 'day';
      }
    };
    const onS = () => { if (!raf) raf = requestAnimationFrame(read); };
    read();
    const t = setTimeout(read, 250);
    addEventListener('scroll', onS, { passive: true }); addEventListener('resize', onS);
    return () => { clearTimeout(t); cancelAnimationFrame(raf); removeEventListener('scroll', onS); removeEventListener('resize', onS); };
  }, [path, open]);

  const toggle = () => setOpen(!open);
  return (
    <>
      {path === '/' && <Intro />}
      {!open && <div className="hd-halo" aria-hidden="true" />}
      <Bar path={path} open={open} onToggle={toggle} />
      <Bar light path={path} open={open} onToggle={toggle} barRef={lightBar} />

      <AnimatePresence>
        {open && (
          <motion.div
            className="mn" role="dialog" aria-modal="true" aria-label="Menu"
            initial={{ clipPath: 'inset(100% 0% 0% 0% round 50vw 50vw 0 0)' }}
            animate={{ clipPath: 'inset(0% 0% 0% 0% round 0vw 0vw 0 0)' }}
            exit={{ clipPath: 'inset(100% 0% 0% 0% round 50vw 50vw 0 0)' }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          >
            <nav className="mn-links" aria-label="Menu">
              {NAV.map((n, i) => (
                <motion.div key={n.href} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.22 + i * 0.05, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
                  <Link href={n.href} onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)} onClick={() => setOpen(false)}>
                    {n.label} <small>{n.note}</small>
                  </Link>
                </motion.div>
              ))}
            </nav>
            <div className="mn-visual" aria-hidden="true">
              <div className="arch">
                {NAV.map((n, i) => <Image key={n.img} src={n.img} alt="" fill sizes="45vw" style={{ opacity: active === i ? 1 : 0 }} />)}
              </div>
            </div>
            <div className="mn-foot small">
              <div><a href={WHATSAPP} target="_blank" rel="noreferrer">WhatsApp {WHATSAPP_LABEL}</a><a href={INSTAGRAM} target="_blank" rel="noreferrer">Instagram</a><a href={TIKTOK} target="_blank" rel="noreferrer">TikTok</a></div>
              <div className="dim">San Nicola Arcella, davanti all’Isola di Dino</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {clockOn && !open && (
        <div ref={(r) => { clock.current.root = r; }} className="clock" data-tone="day" aria-hidden="true">
          <svg viewBox="0 0 34 18"><path d="M2 17a15 15 0 0 1 30 0" fill="none" stroke="currentColor" strokeWidth="1" opacity=".5" /><circle ref={(r) => { clock.current.dot = r; }} cx="2" cy="17" r="2.6" fill="currentColor" /></svg>
          <span ref={(r) => { clock.current.time = r; }}>18:00</span>
        </div>
      )}

      {!fullscreen && (
        <div className="mbar" data-hidden={open}>
          <Link href="/tavoli" className="btn ghost">Tavolo</Link>
          <Link href="/eventi" className="btn fill">Biglietti</Link>
        </div>
      )}
    </>
  );
}
