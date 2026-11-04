import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Footer from '@/components/Footer';
import TicketSheet from '@/components/TicketSheet';
import { INSTAGRAM, SOON, events, isPast, longDate, parts } from '@/lib/data';

export function generateStaticParams() { return events.map((e) => ({ slug: e.slug })); }

type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: events.find((e) => e.slug === slug)?.name ?? 'Serata' };
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  const i = events.findIndex((e) => e.slug === slug);
  if (i < 0) notFound();
  const ev = events[i];
  const after = events[i + 1];
  const d = parts(ev.date);
  return (
    <main>
      <article className="evd tone-night" data-tone="night">
        <header className="evd-head">
          <p className="evd-date">{longDate(ev.date)} {d.year}</p>
          <h1 className="d evd-name">{ev.name}</h1>
        </header>
        <div className="evd-body">
          <div className="evd-poster ph">
            {ev.poster ? <Image src={ev.poster} alt={`Locandina di ${ev.name}`} fill sizes="(max-width:860px) 100vw, 40vw" priority /> : <TypePoster name={ev.name} date={`${d.day} ${d.month}`} />}
          </div>
          <div className="evd-info">
            <p className="d d-xl">{ev.tagline}</p>
            <ul className="evd-lineup">{ev.lineup.map((l) => <li key={l}>{l}</li>)}</ul>
            {isPast(ev.date) ? (
              <p className="evd-soon">{SOON.line} <a className="link-u" href={INSTAGRAM} target="_blank" rel="noreferrer">{SOON.cta}</a></p>
            ) : (
              <div className="evd-actions">
                <TicketSheet event={ev} />
                <Link href={`/tavoli?evento=${ev.slug}`} className="btn btn-line"><span>Scegli un tavolo</span></Link>
              </div>
            )}
            <dl className="evd-facts">
              <div><dt className="dim">Cancelli</dt><dd>{ev.doors ?? 'Dalle 23:30'}</dd></div>
              <div><dt className="dim">Età</dt><dd>18+, con documento</dd></div>
              <div><dt className="dim">Dress code</dt><dd>Smart ed elegante</dd></div>
              <div><dt className="dim">Dove</dt><dd>Contrada Dino, San Nicola Arcella</dd></div>
            </dl>
          </div>
        </div>
        {after && (
          <Link href={`/eventi/${after.slug}`} className="evd-next">
            <span className="dim">La notte dopo</span>
            <span className="d d-xxl">{after.name}</span>
          </Link>
        )}
      </article>
      <Footer />
    </main>
  );
}

/** Used until an event gets its artwork: the arch and the name, nothing else. */
function TypePoster({ name, date }: { name: string; date: string }) {
  return (
    <div className="tp">
      <svg viewBox="0 0 400 500" fill="none" aria-hidden="true"><defs><linearGradient id="tp" x1="0" x2="1"><stop stopColor="#5a5cf7" /><stop offset=".55" stopColor="#d41fd0" /><stop offset="1" stopColor="#ff8a2a" /></linearGradient></defs><path d="M40 500V220a160 160 0 0 1 320 0v280" stroke="url(#tp)" strokeWidth="2.5" /></svg>
      <div className="tp-t"><span className="d">{name}</span><span>{date}</span></div>
    </div>
  );
}
