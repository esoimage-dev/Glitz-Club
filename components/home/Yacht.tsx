'use client';
import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'motion/react';

/** Daylight, editorial: three photos drifting at different speeds around one big sentence. */
export default function Yacht() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const a = useTransform(p, [0, 1], ['6%', '-14%']);
  const b = useTransform(p, [0, 1], ['18%', '-22%']);
  const c = useTransform(p, [0, 1], ['-4%', '10%']);
  return (
    <section ref={ref} className="yacht tone-day" data-tone="day" data-time="1140-1185">
      <h2 className="d d-xxl yacht-h">Tutto bianco. Come uno yacht che non salpa mai.</h2>
      <motion.figure className="yacht-a ph" style={{ y: a }}>
        <Image src="/media/lounge-giardino.jpg" alt="Lounge bianca tra gli alberi del giardino" fill sizes="(max-width:860px) 80vw, 46vw" />
      </motion.figure>
      <motion.figure className="yacht-b ph arch" style={{ y: b }}>
        <Image src="/media/palma-piscina.jpg" alt="Piscina e palma con vista sull’Isola di Dino" fill sizes="(max-width:860px) 60vw, 28vw" />
      </motion.figure>
      <div className="yacht-txt">
        <p className="lede">Ringhiere bianche, divani bianchi, legno da ponte di coperta. Sotto, il Tirreno. A destra, il palco che aspetta.</p>
        <Link href="/il-club" className="link-u">Guarda il posto</Link>
      </div>
      <motion.figure className="yacht-c ph" style={{ y: c }}>
        <Image src="/media/arco-giorno.jpg" alt="L’arco e la terrazza di giorno, con il mare dietro" fill sizes="(max-width:860px) 100vw, 62vw" />
      </motion.figure>
    </section>
  );
}
