import type { Metadata } from 'next';
import Replay from '@/components/BrandReplay';
import { Logo } from '@/components/Logo';

export const metadata: Metadata = { title: 'Brand', robots: { index: false } };

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';

const COLORS = [
  ['Bianco', '#FFFFFF', 'Il giorno. Il colore del club.', '#000'],
  ['Nero', '#000000', 'La notte. Mai grigio scuro.', '#fff'],
  ['Foschia', '#E8EDEF', 'Solo per le superfici di giorno.', '#000'],
  ['Tirreno', '#0F5E7D', 'Piccoli dettagli di giorno.', '#fff'],
];

export default function Brand() {
  return (
    <main>
      <section className="br tone-night" data-tone="night">
        <h1 className="d d-xxl">Il brand in una pagina</h1>
        <p className="lede">Il sito è una giornata al Glitz: bianco fino al tramonto, nero quando si accende l’arco. Il colore esiste solo come tramonto o come luce.</p>
      </section>
      <section className="br tone-night" data-tone="night">
        <h2 className="d d-l">L’accensione</h2>
        <Replay />
        <p className="small dim">La luce corre lungo il contorno delle lettere, l’insegna sfarfalla e si accende. L’ultimo fotogramma è il logo registrato, identico.</p>
      </section>
      <section className="br tone-day" data-tone="day">
        <h2 className="d d-l">Logo</h2>
        <div className="br-logos">
          <div className="br-logo" style={{ background: '#fff', color: '#000', boxShadow: 'inset 0 0 0 1px #000' }}><Logo /></div>
          <div className="br-logo" style={{ background: '#000', color: '#fff' }}><Logo /></div>
        </div>
        <p className="small">Vettoriale ricavato dal master da 4500 px: <a className="link-u" href={`${BASE}/brand/glitz-logo-white.svg`} download>SVG bianco</a>, <a className="link-u" href={`${BASE}/brand/glitz-logo-black.svg`} download>SVG nero</a>.</p>
      </section>
      <section className="br tone-day" data-tone="day">
        <h2 className="d d-l">Colore</h2>
        <div className="br-cols">
          {COLORS.map(([n, h, u, c]) => (
            <div key={n} className="br-col" style={{ background: h, color: c, boxShadow: h === '#FFFFFF' ? 'inset 0 0 0 1px #000' : undefined }}><b>{n}</b><span>{h}</span><span className="small">{u}</span></div>
          ))}
          <div className="br-col br-wide" style={{ background: 'linear-gradient(90deg,#ffd7a8,#f4895f,#c43a78,#36197a)', color: '#fff' }}><b>Tramonto</b><span className="small">Solo nel passaggio dal giorno alla notte.</span></div>
          <div className="br-col br-wide" style={{ background: 'linear-gradient(90deg,#5a5cf7,#d41fd0 55%,#ff8a2a)', color: '#fff' }}><b>LED</b><span className="small">I colori veri dell’arco. Solo di notte, solo come luce.</span></div>
        </div>
      </section>
      <section className="br tone-day" data-tone="day">
        <h2 className="d d-l">Tipografia</h2>
        <p className="d d-mega">Melodrama</p>
        <p>Titoli e nomi degli artisti. Alta, sottile, a forte contrasto: la stessa famiglia di forme del logo. Da Fontshare.</p>
        <p className="br-sw">Switzer</p>
        <p>Tutto il resto. Pulita, svizzera, quasi invisibile. Da Fontshare.</p>
      </section>
      <section className="br tone-night" data-tone="night">
        <h2 className="d d-l">L’arco</h2>
        <p className="lede">È l’unica forma curva: finestre delle foto, apertura del menu, intro. I bottoni sono mezzi archi sdraiati. Tutto il resto ha angoli vivi.</p>
        <div className="arch ph br-arch" />
      </section>
      <section className="br tone-day" data-tone="day">
        <h2 className="d d-l">Come parliamo</h2>
        <ul className="br-voice d d-xl">
          <li>Il soffitto è il cielo.</li><li>Non prenotare un tavolo. Scegli la tua vista.</li><li>Chi c’era, lo sa.</li>
        </ul>
        <p className="lede">Frasi corte. Concrete. Mai “esclusivo”, “unico” o “esperienza”: lo si mostra. Si dà del tu.</p>
      </section>
    </main>
  );
}
