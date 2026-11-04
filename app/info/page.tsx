import type { Metadata } from 'next';
import Image from 'next/image';
import Footer from '@/components/Footer';
import { ADDRESS, EMAIL, WHATSAPP, WHATSAPP_LABEL, faq } from '@/lib/data';

export const metadata: Metadata = { title: 'Info' };

export default function Info() {
  return (
    <main>
      <section className="in tone-day" data-tone="day">
        <h1 className="d d-mega">Info</h1>
        <div className="in-grid">
          <div className="in-faq">
            {faq.map(([q, a]) => (
              <details key={q} className="in-q">
                <summary className="d d-l">{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
          <aside className="in-side">
            <div data-dark="1" className="ph in-img"><Image src="/media/terrazza-giorno.jpg" alt="La terrazza bianca di giorno" fill sizes="(max-width:860px) 100vw, 32vw" /></div>
            <h2 className="d d-l">Come arrivare</h2>
            <p>{ADDRESS}</p>
            <a className="link-u" href="https://www.google.com/maps/search/?api=1&query=Contrada+Dino+San+Nicola+Arcella" target="_blank" rel="noreferrer">Apri in Maps</a>
            <h2 className="d d-l" style={{ marginTop: 26 }}>Parla con noi</h2>
            <a className="link-u" href={WHATSAPP} target="_blank" rel="noreferrer">{WHATSAPP_LABEL}</a>
            <a className="link-u" href={`mailto:${EMAIL}`}>{EMAIL}</a>
          </aside>
        </div>
      </section>
      <Footer />
    </main>
  );
}
