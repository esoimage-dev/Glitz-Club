'use client';
import { useRef } from 'react';
import Image from 'next/image';
import { motion, useMotionValueEvent, useScroll, useTransform } from 'motion/react';

/** The sentence is laid out sideways: vertical scroll pushes it past the camera while the sky goes from white to night. */
export default function Sunset() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const x = useTransform(p, [0, 1], ['0%', '-76%']);
  const bg = useTransform(p, [0, 0.2, 0.42, 0.62, 0.82, 1], ['#ffffff', '#ffe2bd', '#f79a68', '#c6417c', '#35197a', '#000000']);
  const color = useTransform(p, [0.42, 0.52], ['#000000', '#ffffff']);
  // The sky is dark enough for white type from here on.
  useMotionValueEvent(p, 'change', (v) => { if (ref.current) ref.current.dataset.tone = v >= 0.49 ? 'night' : 'day'; });
  return (
    <section ref={ref} className="sunset" data-tone="day" data-time="1185-1290">
      <motion.div className="sunset-stick" style={{ background: bg, color }}>
        <motion.div className="sunset-track" style={{ x }}>
          <h2 className="sr-only">Alle otto tutti si girano dalla stessa parte.</h2>
          <span className="d sunset-w" aria-hidden="true">Alle otto</span>
          <figure data-dark="1" className="ph sunset-p1"><Image src="/media/sole-arco.jpg" alt="Il sole che tramonta dentro l’arco del Glitz" fill sizes="60vw" /></figure>
          <span className="d sunset-w" aria-hidden="true">tutti si girano</span>
          <figure data-dark="1" className="ph sunset-p2 arch"><Image src="/media/aereo-tramonto.jpg" alt="Il club dall’alto al tramonto, con il mare e la costa" fill sizes="40vw" /></figure>
          <span className="d sunset-w" aria-hidden="true">dalla stessa parte.</span>
          <figure data-dark="1" className="ph sunset-p3"><Image src="/media/scale-tramonto.jpg" alt="Le scale illuminate che salgono verso l’arco" fill sizes="36vw" /></figure>
        </motion.div>
      </motion.div>
    </section>
  );
}
