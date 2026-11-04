'use client';
import { useRef } from 'react';
import Image from 'next/image';
import { motion, useMotionTemplate, useScroll, useTransform } from 'motion/react';

// A wide, low span like the real truss: 9 metres across, springing straight from the stage.
const ARC = 'M24 512 A476 476 0 0 1 976 512';
const TRUSS = 'M2 512 A498 498 0 0 1 998 512';
// Real lengths instead of normalised dashes: Safari rounds tiny dash values and the line advances in jumps.
const ARC_LEN = Math.PI * 476;
const TRUSS_LEN = Math.PI * 498;
const LAMPS = [0.1, 0.22, 0.34, 0.5, 0.66, 0.78, 0.9];

/** The turning point. Scroll literally switches the arch on: first the LED line, then the lamps, then the room. */
export default function ArchOn() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const len = useTransform(p, [0.05, 0.55], [0, 1]);
  const photo = useTransform(p, [0.5, 0.78], [0, 1]);
  const photoScale = useTransform(p, [0.5, 1], [1.12, 1]);
  const txt1 = useTransform(p, [0, 0.08, 0.42, 0.52], [0, 1, 1, 0]);
  const txt2 = useTransform(p, [0.66, 0.78], [0, 1]);
  const glow = useTransform(p, [0.3, 0.6], [0, 1]);
  const arcDrawn = useTransform(len, (v) => v * ARC_LEN);
  const trussDrawn = useTransform(len, (v) => v * TRUSS_LEN);
  const arcDash = useMotionTemplate`${arcDrawn} ${ARC_LEN}`;
  const trussDash = useMotionTemplate`${trussDrawn} ${TRUSS_LEN}`;
  const svgOp = useTransform(p, [0.56, 0.72], [1, 0]);
  return (
    <section ref={ref} className="archon tone-night" data-tone="night" data-time="1290-1380">
      <div className="archon-stick">
        <motion.div className="archon-photo" style={{ opacity: photo, scale: photoScale }}>
          <Image src="/media/arco-magenta.jpg" alt="L’arco acceso sopra la pista, con il cielo del tramonto" fill sizes="(max-width:860px) 80vw, 100vw" quality={85} style={{ objectPosition: '50% 26%' }} />
        </motion.div>
        <motion.div className="archon-veil" style={{ opacity: photo }} />
        <motion.svg style={{ opacity: svgOp }} className="archon-svg" viewBox="0 0 1000 520" fill="none" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
          <defs>
            <linearGradient id="archled" x1="0" x2="1" y1="0" y2="0"><stop stopColor="#5a5cf7" /><stop offset=".55" stopColor="#d41fd0" /><stop offset="1" stopColor="#ff8a2a" /></linearGradient>
          </defs>
          <motion.path d={TRUSS} stroke="#fff" strokeOpacity=".4" strokeWidth="1" style={{ strokeDasharray: trussDash }} />
          {/* Glow built from wider, fainter strokes: an SVG blur would repaint the whole arch every frame */}
          <motion.g style={{ opacity: glow }}>
            <motion.path d={ARC} stroke="url(#archled)" strokeWidth="26" strokeOpacity=".08" style={{ strokeDasharray: arcDash }} />
            <motion.path d={ARC} stroke="url(#archled)" strokeWidth="14" strokeOpacity=".16" style={{ strokeDasharray: arcDash }} />
            <motion.path d={ARC} stroke="url(#archled)" strokeWidth="7" strokeOpacity=".32" style={{ strokeDasharray: arcDash }} />
          </motion.g>
          <motion.path d={ARC} stroke="url(#archled)" strokeWidth="3.5" style={{ strokeDasharray: arcDash }} />
          {LAMPS.map((l) => {
            const a = Math.PI * (1 - l);
            return <Lamp key={l} x={Math.round(500 + 498 * Math.cos(a))} y={Math.round(512 - 498 * Math.sin(a))} from={0.18 + l * 0.36} p={p} />;
          })}
        </motion.svg>
        <motion.h2 className="d d-xxl archon-h1" style={{ opacity: txt1 }}>Poi si<br />accende l’arco.</motion.h2>
        <motion.div className="archon-h2" style={{ opacity: txt2 }}>
          <p className="d d-xl">Nove metri di luce. Sotto, la consolle. Dietro, il mare.</p>
        </motion.div>
      </div>
    </section>
  );
}

function Lamp({ x, y, from, p }: { x: number; y: number; from: number; p: ReturnType<typeof useScroll>['scrollYProgress'] }) {
  const opacity = useTransform(p, [from, from + 0.02, from + 0.04, from + 0.06], [0, 1, 0.3, 1]);
  return (
    <motion.g style={{ opacity }}>
      <circle cx={x} cy={y} r="15" fill="#fff" opacity=".14" />
      <circle cx={x} cy={y} r="5.5" fill="#fff" />
    </motion.g>
  );
}
