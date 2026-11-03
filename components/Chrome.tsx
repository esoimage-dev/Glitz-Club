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
  { href: '/privati', label: 'Privati', note: 'tutto per voi', img: '/media/villa-notte.jpg' },
  { href: '/info', label: 'Info', note: 'come arrivare', img: '/media/aereo-tramonto.jpg' },
];

const toTime = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(Math.floor(m % 60)).padStart(2, '0')}`;

export default function Chrome() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [tone, setTone] = useState<'day' | 'night'>('day');
  const [hidden, setHidden] = useState(false);
  const [active, setActive] = useState(0);
  const clock = useRef<{ time: HTMLSpanElement | null; dot: SVGCircleElement | null }>({ time: null, dot: null });
  const [clockOn, setClockOn] = useState(false);
  const lenis = useRef<Lenis | null>(null);
  const fullscreen = path === '/tavoli';

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || fullscreen) return;
    const l = new Lenis({ lerp: 0.11 });
    lenis.current = l;
    let raf = requestAnimationFrame(function loop(t) { l.raf(t); raf = requestAnimationFrame(loop); });
    return () => { cancelAnimationFrame(raf); l.destroy(); lenis.current = null; };
  }, [fullscreen]);

  useEffect(() => { setOpen(false); window.scrollTo(0, 0); }, [path]);
  useEffect(() => { open ? lenis.current?.stop() : lenis.current?.start(); document.body.style.overflow = open ? 'hidden' : ''; }, [open]);
  useEffect(() => { if (!open) return; const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false); addEventListener('keydown', k); return () => removeEventListener('keydown', k); }, [open]);

  // Reads the section under the header: sets header tone, and on the home turns scroll into an hour of the night.
  useEffect(() => {
    let last = 0; let raf = 0;
    const read = () => {
      raf = 0;
      const y = scrollY;
      setHidden(y > last + 2 && y > 500); if (y < last - 2) setHidden(false); last = y;
      const secs = document.querySelectorAll<HTMLElement>('[data-tone]');
      let cur: HTMLElement | null = null;
      secs.forEach((s) => { const r = s.getBoundingClientRect(); if (r.top <= 44 && r.bottom > 44) cur = s; });
      if (cur) setTone((cur as HTMLElement).dataset.tone as 'day' | 'night');
      const timed = document.querySelectorAll<HTMLElement>('[data-time]');
      if (timed.length && clock.current.time) {
        let minutes = 0;
        timed.forEach((s) => {
          const r = s.getBoundingClientRect(); const [a, b] = s.dataset.time!.split('-').map(Number);
          const p = Math.min(1, Math.max(0, (innerHeight / 2 - r.top) / r.height));
          if (r.top <= innerHeight / 2) minutes = a + (b - a) * p;
        });
        clock.current.time.textContent = toTime(minutes);
        const t = (minutes - 1080) / (1740 - 1080); // 18:00 to 05:00 across the arch
        const ang = Math.PI * (1 - Math.min(1, Math.max(0, t)));
        clock.current.dot?.setAttribute('cx', String(17 + 15 * Math.cos(ang)));
        clock.current.dot?.setAttribute('cy', String(17 - 15 * Math.sin(ang)));
      }
    };
    const onS = () => { if (!raf) raf = requestAnimationFrame(read); };
    setClockOn(path === '/');
    setTimeout(read, 60);
    addEventListener('scroll', onS, { passive: true }); addEventListener('resize', onS);
    return () => { removeEventListener('scroll', onS); removeEventListener('resize', onS); };
  }, [path]);

  const headerTone = open ? 'night' : tone;
  return (
    <>
      {path === '/' && <Intro />}
      <header className="hd" data-tone={headerTone} data-hidden={hidden && !open && !fullscreen}>
        <div className="hd-nav-wrap">
          <nav className="hd-nav" aria-label="Principale">
            {NAV.slice(0, 4).map((n) => <Link key={n.href} href={n.href} aria-current={path.startsWith(n.href) ? 'page' : undefined}>{n.label}</Link>)}
          </nav>
          <Link href="/" className="hd-logo hd-logo-m" aria-label="Glitz Club, home"><LiveLogo id="logo-led-m" /></Link>
        </div>
        <Link href="/" className="hd-logo hd-logo-d" aria-label="Glitz Club, home"><LiveLogo /></Link>
        <div className="hd-right">
          <Link href="/eventi" className="btn hd-cta">Biglietti</Link>
          <button className="hd-burger" aria-label={open ? 'Chiudi il menu' : 'Apri il menu'} aria-expanded={open} onClick={() => setOpen(!open)}><i /></button>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="mn" role="dialog" aria-modal="true" aria-label="Menu"
            initial={{ clipPath: 'inset(100% 0% 0% 0% round 50vw 50vw 0 0)' }}
            animate={{ clipPath: 'inset(0% 0% 0% 0% round 0vw 0vw 0 0)' }}
            exit={{ clipPath: 'inset(100% 0% 0% 0% round 50vw 50vw 0 0)' }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          >
            <nav className="mn-links" aria-label="Menu" onMouseLeave={() => undefined}>
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
        <div className="clock" data-tone={tone} aria-hidden="true">
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
