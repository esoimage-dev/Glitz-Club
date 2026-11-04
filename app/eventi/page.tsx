import type { Metadata } from 'next';
import Image from 'next/image';
import Season from '@/components/home/Season';
import Footer from '@/components/Footer';
import { archive, parts } from '@/lib/data';

export const metadata: Metadata = { title: 'Serate' };

export default function Eventi() {
  const years = [...new Set(archive.map((a) => a.date.slice(0, 4)))];
  return (
    <main>
      <section className="ev-top tone-night" data-tone="night">
        <h1 className="d d-mega">Le notti</h1>
      </section>
      <Season withLink={false} />
      <section id="archivio" className="arc tone-day" data-tone="day">
        <h2 className="d d-xxl">Chi c’era, lo sa.</h2>
        {years.map((y) => (
          <div key={y} className="arc-year">
            <h3 className="d d-l">{y}</h3>
            <ul className="arc-grid">
              {archive.filter((a) => a.date.startsWith(y)).map((a) => {
                const d = parts(a.date);
                return (
                  <li key={a.poster}>
                    <div data-dark="1" className="ph arc-img"><Image src={`/posters/${a.poster}.jpg`} alt={`Locandina di ${a.name}`} fill sizes="(max-width:860px) 50vw, 25vw" /></div>
                    <p className="arc-name">{a.name}<span className="dim"> {d.day} {d.month}</span></p>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </section>
      <Footer />
    </main>
  );
}
