import Image from 'next/image';
import Link from 'next/link';

/** Daylight breaks the night once: the private side of the house, on white. */
export default function Private() {
  return (
    <section className="priv tone-day" data-tone="day" data-time="1620-1680">
      <div className="priv-photo arch ph"><Image src="/media/villa-notte.jpg" alt="La villa e la piscina illuminate di notte" fill sizes="(max-width:860px) 100vw, 50vw" /></div>
      <div className="priv-txt">
        <h2 className="d d-xxl">Tutto il club, solo per voi.</h2>
        <p className="lede">Compleanni, after-party di matrimonio, lanci di prodotto, cene private. Una zona o tutto il club, da 50 a 2000 persone.</p>
        <Link href="/privati" className="btn btn-solid">Raccontaci la tua idea</Link>
      </div>
    </section>
  );
}
