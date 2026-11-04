'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, useMotionTemplate, useMotionValueEvent, useScroll, useTransform, type MotionValue } from 'motion/react';
import { Logo } from '../Logo';
import { INSTAGRAM } from '@/lib/data';

function Overlay({ dark, wordY, wordOp }: { dark?: boolean; wordY: MotionValue<string>; wordOp: MotionValue<number> }) {
  return (
    <div className={`hero-ui ${dark ? 'on-dark' : ''}`} aria-hidden={dark ? 'true' : undefined} inert={dark ? true : undefined}>
      <motion.div className="hero-word" style={{ y: wordY, opacity: wordOp }}>
        {dark ? <Logo /> : <h1><Logo title="Glitz Club" /></h1>}
      </motion.div>
      <motion.div className="hero-bottom" style={{ opacity: wordOp }}>
        <p className="hero-place">San Nicola Arcella,<br />davanti all’Isola di Dino</p>
        <a href={INSTAGRAM} target="_blank" rel="noreferrer" className="hero-next">Estate 2027 uscirà presto.<br />Tenetevi connessi.</a>
      </motion.div>
    </div>
  );
}

const WORDS = ['Il', 'soffitto', 'è', 'il', 'cielo.', 'Il', 'fondale', 'è', 'il', 'mare.'];

function Word({ w, i, p }: { w: string; i: number; p: MotionValue<number> }) {
  const s = 0.5 + (i / WORDS.length) * 0.32;
  const opacity = useTransform(p, [0.44, 0.48, s, s + 0.04], [0, 0.16, 0.16, 1]);
  return <motion.span style={{ opacity }}>{w} </motion.span>;
}

/** One shot, three beats: the arch window opens on the island until the page becomes the view, then the claim writes itself. */
export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const top = useTransform(p, [0, 0.42], [16, 0]);
  const [startSide, setStartSide] = useState(27);
  useEffect(() => { if (innerWidth < 860) setStartSide(9); }, []);
  const side = useTransform(p, [0, 0.42], [startSide, 0]);
  const rad = useTransform(p, [0, 0.38], [50, 0]);
  const clip = useMotionTemplate`inset(${top}vh ${side}vw 0vh ${side}vw round ${rad}vw ${rad}vw 0 0)`;
  const scale = useTransform(p, [0, 0.42], [1.14, 1]);
  const wordY = useTransform(p, [0, 0.34], ['0vh', '-16vh']);
  const wordOp = useTransform(p, [0.14, 0.34], [1, 0]);
  const shade = useTransform(p, [0.42, 0.56], [0, 0.42]);
  const stick = useRef<HTMLDivElement>(null);
  // Once the photo fills the top of the screen the header sits on it, not on white.
  useMotionValueEvent(p, 'change', (v) => { if (stick.current) stick.current.dataset.dark = v >= 0.38 ? '1' : '0'; });

  return (
    <section ref={ref} className="hero tone-day" data-tone="day" data-time="1080-1140">
      <div ref={stick} className="hero-stick">
        <Overlay wordY={wordY} wordOp={wordOp} />
        <motion.div className="hero-win" style={{ clipPath: clip }}>
          <motion.div className="hero-photo" style={{ scale }}>
            <Image src="/media/sofa-dino.jpg" alt="Divani bianchi sulla terrazza del Glitz, davanti all’Isola di Dino" fill priority sizes="100vw" quality={85} style={{ objectPosition: '50% 16%' }} />
          </motion.div>
          <motion.div className="hero-shade" style={{ opacity: shade }} />
          <div className="hero-foot" />
          <Overlay dark wordY={wordY} wordOp={wordOp} />
          <p className="hero-claim d d-xxl">{WORDS.map((w, i) => <Word key={i} w={w} i={i} p={p} />)}</p>
        </motion.div>
      </div>
    </section>
  );
}
