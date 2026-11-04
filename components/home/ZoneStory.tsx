'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useMotionValueEvent, useScroll, useTransform, type MotionValue } from 'motion/react';
import { zones } from '@/lib/data';
import type { ClubScene } from '@/lib/club-scene';

const STEPS = zones;
const N = STEPS.length;

// Scroll (0 to 1) to position along the camera path. Slows near each zone but never stops, so the page never feels stuck.
const toPath = (v: number) => {
  const x = Math.min(1, Math.max(0, v)) * N;
  return x - (0.55 * Math.sin(2 * Math.PI * x)) / (2 * Math.PI);
};

function Panel({ p, index, children }: { p: MotionValue<number>; index: number; children: React.ReactNode }) {
  // Zone text is tied to scroll: one fades out completely before the next fades in.
  const u = useTransform(p, (v) => v * N);
  const last = index === N;
  const inputs = index === 0 ? [0, 0.42, 0.56] : last ? [index - 0.42, index - 0.2, N] : [index - 0.42, index - 0.2, index + 0.42, index + 0.56];
  const opacity = useTransform(u, inputs, index === 0 ? [1, 1, 0] : last ? [0, 1, 1] : [0, 1, 1, 0]);
  const y = useTransform(u, inputs, index === 0 ? [0, 0, -24] : last ? [24, 0, 0] : [24, 0, 0, -24]);
  const visibility = useTransform(opacity, (o) => (o < 0.01 ? 'hidden' : 'visible'));
  return <motion.div className="zs-panel" style={{ opacity, y, visibility }}>{children}</motion.div>;
}

/** Scroll flies a camera through the 3D club, zone by zone. The photo stays underneath as the fallback. */
export default function ZoneStory() {
  const ref = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const dots = useRef<HTMLOListElement>(null);
  const dock = useRef<HTMLDivElement>(null);
  const scene = useRef<ClubScene | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [step, setStep] = useState(-1);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] });

  useMotionValueEvent(p, 'change', (v) => {
    scene.current?.setPathPosition(toPath(v));
    const on = v > 0.0005 && v < 0.9995;
    if (dock.current) dock.current.dataset.active = String(on);
    document.documentElement.dataset.zs = on ? '1' : '0';
    const u = v * N;
    setStep(u < 0.5 ? -1 : Math.min(N - 1, Math.round(u) - 1));
  });

  useEffect(() => {
    const el = ref.current; if (!el) return;
    let disposed = false; let started = false;
    const start = async () => {
      if (started) return; started = true;
      const m = await import('@/lib/club-scene');
      if (disposed || !m.hasWebGL() || !canvas.current) return;
      const s = new m.ClubScene(canvas.current);
      scene.current = s;
      s.setPath([m.SHOTS.sea, ...STEPS.map((z) => m.SHOTS[z.id])]);
      s.setPathPosition(toPath(p.get()), true);
      s.onContextChange = (alive) => setLoaded(alive);
      await s.load();
      if (disposed) return s.dispose();
      setLoaded(true);
    };
    // On desktop it loads right after the intro, long before it is needed. On phones only when getting close, to spare data.
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); start(); } }, { rootMargin: '250% 0px' });
    io.observe(el);
    // Waits for a pause in the scrolling, so preparing the club never lands in the middle of a gesture.
    let lastY = -1;
    const timer = innerWidth >= 860 ? setInterval(() => {
      if (performance.now() > 4300 && scrollY === lastY) { clearInterval(timer); start(); }
      lastY = scrollY;
    }, 350) : undefined;
    return () => { disposed = true; delete document.documentElement.dataset.zs; clearInterval(timer); io.disconnect(); scene.current?.dispose(); scene.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Scrolls to where the camera rests on that zone. */
  const goTo = (i: number) => {
    const el = ref.current; if (!el) return;
    const y = el.getBoundingClientRect().top + scrollY + ((i + 1) / N) * (el.offsetHeight - innerHeight);
    const lenis = (window as unknown as { __lenis?: { scrollTo: (y: number, o: object) => void } }).__lenis;
    if (lenis) lenis.scrollTo(y, { duration: 2.4 }); else scrollTo({ top: y, behavior: 'smooth' });
  };

  // On phones the zone row scrolls sideways: keep the current one in view.
  useEffect(() => {
    const row = dots.current; const btn = row?.querySelector<HTMLElement>('[data-on="true"]');
    if (row && btn && row.scrollWidth > row.clientWidth) row.scrollTo({ left: btn.offsetLeft - (row.clientWidth - btn.offsetWidth) / 2, behavior: 'smooth' });
  }, [step]);

  return (
    <section ref={ref} className="zs tone-night" data-tone="night" data-time="1440-1530">
      <div className="zs-stick">
        <div className="zs-fallback" style={{ opacity: loaded ? 0 : 1 }}><Image src="/media/aereo-sera.jpg" alt="" fill sizes="(max-width:860px) 80vw, 100vw" /></div>
        <canvas ref={canvas} className="zs-canvas" style={{ opacity: loaded ? 1 : 0 }} aria-hidden="true" />
        <div className="zs-grad" />
        <div className="zs-ui">
          <div className="zs-copy">
            <Panel p={p} index={0}><h2 className="d d-xxl zs-title">Non prenotare un tavolo. Scegli la tua vista.</h2></Panel>
            {STEPS.map((s, i) => (
              <Panel key={s.id} p={p} index={i + 1}>
                <div className="zs-zone">
                  <h3 className="d d-xxl">{s.name}</h3>
                  <p className="lede">{s.line}</p>
                  <p className="small dim">Tavoli da €{s.from} di consumazione minima</p>
                </div>
              </Panel>
            ))}
          </div>
          <div ref={dock} className="zs-bottom" data-active="false">
            <ol ref={dots} className="zs-dots" aria-label="Vai a una zona del club">
              {STEPS.map((s, i) => <li key={s.id}><button type="button" data-on={i === step} aria-current={i === step ? 'true' : undefined} onClick={() => goTo(i)}>{s.name}</button></li>)}
            </ol>
            <Link href="/tavoli" className="btn btn-led">Scegli il tavolo sulla mappa</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
