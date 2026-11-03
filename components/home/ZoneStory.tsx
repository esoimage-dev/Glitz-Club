'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useMotionValueEvent, useScroll } from 'motion/react';
import { zones } from '@/lib/data';
import type { ClubScene, Shot } from '@/lib/club-scene';

const STEPS = zones;

/** Scroll flies a camera through the 3D club, zone by zone. Photo stays underneath as the fallback. */
export default function ZoneStory() {
  const ref = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<ClubScene | null>(null);
  const shots = useRef<Shot[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [step, setStep] = useState(-1);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] });

  const apply = (v: number) => {
    const s = scene.current; if (!s || !shots.current.length) return;
    const n = shots.current.length - 1;
    const f = Math.min(n - 0.0001, Math.max(0, v * n));
    const i = Math.floor(f);
    // Hold on each zone, travel between them
    const local = f - i;
    const t = Math.min(1, Math.max(0, (local - 0.35) / 0.65));
    s.blend(shots.current[i], shots.current[i + 1], t);
  };

  useMotionValueEvent(p, 'change', (v) => {
    apply(v);
    const n = STEPS.length + 1;
    setStep(Math.min(STEPS.length - 1, Math.floor(v * n * 1.0001) - 1));
  });

  useEffect(() => {
    const el = ref.current; if (!el) return;
    let disposed = false;
    const io = new IntersectionObserver(async ([e]) => {
      if (!e.isIntersecting || scene.current) return;
      io.disconnect();
      const m = await import('@/lib/club-scene');
      if (disposed || !m.hasWebGL() || !canvas.current) return;
      const s = new m.ClubScene(canvas.current);
      scene.current = s;
      shots.current = [m.SHOTS.sea, ...STEPS.map((z) => m.SHOTS[z.id])];
      await s.load();
      if (disposed) return s.dispose();
      apply(p.get());
      setLoaded(true);
    }, { rootMargin: '120% 0px' });
    io.observe(el);
    return () => { disposed = true; io.disconnect(); scene.current?.dispose(); scene.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const z = step >= 0 ? STEPS[step] : null;
  return (
    <section ref={ref} className="zs tone-night" data-tone="night" data-time="1440-1530">
      <div className="zs-stick">
        <div className="zs-fallback" style={{ opacity: loaded ? 0 : 1 }}><Image src="/media/aereo-sera.jpg" alt="" fill sizes="100vw" /></div>
        <canvas ref={canvas} className="zs-canvas" style={{ opacity: loaded ? 1 : 0 }} aria-hidden="true" />
        <div className="zs-grad" />
        <div className="zs-ui">
          {!z ? (
            <h2 key="intro" className="d d-xxl zs-title">Non prenotare un tavolo. Scegli la tua vista.</h2>
          ) : (
            <div key={z.id} className="zs-zone">
              <h3 className="d d-xxl">{z.name}</h3>
              <p className="lede">{z.line}</p>
              <p className="small dim">Tavoli da €{z.from} di consumazione minima</p>
            </div>
          )}
          <div className="zs-bottom">
            <ol className="zs-dots" aria-label="Zone del club">
              {STEPS.map((s, i) => <li key={s.id} data-on={i === step}>{s.name}</li>)}
            </ol>
            <Link href={z ? `/tavoli?zona=${z.id}` : '/tavoli'} className="btn btn-led">Scegli il tavolo sulla mappa</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
