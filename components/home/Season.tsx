'use client';
import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion, useMotionValue, useSpring } from 'motion/react';
import { INSTAGRAM, SEASON, SOON, isPast, parts, seasonEvents, upcoming } from '@/lib/data';

/** The calendar is the poster: names as big as a festival bill, the real artwork follows the cursor. */
export default function Season({ limit, withLink = true }: { limit?: number; withLink?: boolean }) {
  const list = limit ? seasonEvents.slice(0, limit) : seasonEvents;
  const [hover, setHover] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0); const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 180, damping: 22 }); const y = useSpring(my, { stiffness: 180, damping: 22 });
  return (
    <section className="season tone-night" data-tone="night" data-time="1380-1440">
      <div className="season-head">
        <h2 className="d d-l">Estate {SEASON}</h2>
        {upcoming.length === 0 && <p className="season-soon">{SOON.line} <a className="link-u" href={INSTAGRAM} target="_blank" rel="noreferrer">{SOON.cta}</a></p>}
      </div>
      <div ref={box} className="season-list" onMouseMove={(e) => { const r = box.current!.getBoundingClientRect(); mx.set(e.clientX - r.left); my.set(e.clientY - r.top); }} onMouseLeave={() => setHover(null)}>
        {list.map((ev) => {
          const d = parts(ev.date);
          return (
            <Link key={ev.slug} href={`/eventi/${ev.slug}`} className="sr" onMouseEnter={() => setHover(ev.poster ?? null)}>
              <span className="sr-date">{d.day} {d.month.slice(0, 3)}</span>
              <span className="d sr-name">{ev.name}</span>
              <span className="sr-tag">{ev.tagline}</span>
              <span className="sr-cta">{isPast(ev.date) ? 'Locandina' : 'Biglietti'}</span>
              {ev.poster && <span className="sr-thumb ph"><Image src={ev.poster} alt="" fill sizes="96px" /></span>}
            </Link>
          );
        })}
        <AnimatePresence>
          {hover && (
            <motion.div className="sr-poster ph" style={{ x, y }} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.3 }} aria-hidden="true">
              <Image src={hover} alt="" fill sizes="340px" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {withLink && <div className="season-foot"><Link href="/eventi" className="btn btn-led">Tutte le serate e l’archivio</Link></div>}
    </section>
  );
}
