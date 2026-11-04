import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import Footer from '@/components/Footer';
import { zones } from '@/lib/data';

export const metadata: Metadata = { title: 'Il club' };

export default function Club() {
  return (
    <main>
      <section className="cl-hero tone-night" data-tone="night">
        <Image src="/media/aereo-sera.jpg" alt="Il Glitz dall’alto all’imbrunire, con la pista illuminata di magenta e il mare dietro" fill priority sizes="100vw" quality={85} />
        <h1 className="d d-mega">Il posto</h1>
      </section>
      <section className="cl-story tone-day" data-tone="day">
        <p className="d d-xl">Una villa sul mare che d’estate apre il cancello.</p>
        <div className="cl-story-b">
          <p className="lede">Di fronte, l’Isola di Dino. Sotto, il Tirreno calabrese. In mezzo, una terrazza bianca con un palco che ha ospitato artisti da tutto il mondo.</p>
          <p className="d d-l">2000 persone.<br />180° di mare.<br />Zero soffitti.</p>
        </div>
      </section>
      <div className="cl-stack">
        {zones.map((z) => (
          <section key={z.id} className="cl-zone tone-night" data-tone="night">
            <Image src={z.photo} alt="" fill sizes="100vw" loading="eager" />
            <div className="cl-zone-t">
              <h2 className="d d-xxl">{z.name}</h2>
              <div className="cl-zone-b">
                <p className="lede">{z.line}</p>
                <Link href={`/tavoli?zona=${z.id}`} className="btn btn-solid">Tavoli da €{z.from}</Link>
              </div>
            </div>
          </section>
        ))}
      </div>
      <section className="cl-artist tone-day" data-tone="day">
        <div data-dark="1" className="arch ph cl-artist-img"><Image src="/media/palma-piscina.jpg" alt="La piscina con vista mare dell’area artisti" fill sizes="(max-width:860px) 80vw, 36vw" /></div>
        <div>
          <h2 className="d d-xl">Anche gli artisti vogliono la vista.</h2>
          <p className="lede" style={{ marginTop: 22 }}>L’area riservata ha piscina panoramica, camerino privato e ingresso separato.</p>
        </div>
      </section>
      <Footer />
    </main>
  );
}
