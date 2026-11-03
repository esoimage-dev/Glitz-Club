import Link from 'next/link';
import { wall } from '@/lib/data';

/** Set like a festival bill: lines fill the page edge to edge, the first names biggest. */
export default function Wall() {
  return (
    <section className="wall tone-night" data-tone="night" data-time="1590-1620">
      <h2 className="wall-h">Sono passati da qui</h2>
      <ul className="wall-list">
        {wall.map((n, i) => <li key={n} className={`d wl-${i < 2 ? 'a' : i < 5 ? 'b' : 'c'}`}>{n}</li>)}
      </ul>
      <Link href="/eventi#archivio" className="link-u">L’archivio delle serate</Link>
    </section>
  );
}
