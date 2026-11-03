'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { WHATSAPP, events, longDate, zones, type ZoneId } from '@/lib/data';
import tablesData from '@/lib/tables.json';
import type { ClubScene, Mood } from '@/lib/club-scene';

type T = { id: string; zone: ZoneId; p: [number, number, number] };
const TABLES = tablesData as T[];

const hash = (s: string) => { let h = 5381; for (const c of s) h = (h * 33 + c.charCodeAt(0)) >>> 0; return h; };
// Simulated until the back office holds real availability.
const isTaken = (table: string, ev: string) => hash(table + ev) % 100 < 26;

const centre = (id: ZoneId): [number, number, number] => {
  const list = TABLES.filter((t) => t.zone === id);
  const s = list.reduce((a, t) => [a[0] + t.p[0], a[1] + t.p[1], a[2] + t.p[2]], [0, 0, 0]);
  return [s[0] / list.length, s[1] / list.length + 1, s[2] / list.length];
};

export default function TablePicker() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<ClubScene | null>(null);
  const markers = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [ready, setReady] = useState(false);
  const [noGL, setNoGL] = useState(false);
  const [mood, setMood] = useState<Mood>('night');
  const [ev, setEv] = useState(events[0].slug);
  const [zone, setZone] = useState<ZoneId | null>(null);
  const [table, setTable] = useState<string | null>(null);
  const [guests, setGuests] = useState(6);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [sent, setSent] = useState(false);

  const event = events.find((e) => e.slug === ev)!;
  const taken = useMemo(() => new Set(TABLES.filter((t) => isTaken(t.id, ev)).map((t) => t.id)), [ev]);
  const zoneInfo = zones.find((z) => z.id === zone);
  const visible = zone ? TABLES.filter((t) => t.zone === zone) : [];
  const positions = useRef<Record<string, [number, number, number]>>({});
  positions.current = zone ? Object.fromEntries(visible.map((t) => [t.id, [t.p[0], t.p[1] + 1.1, t.p[2]]])) : Object.fromEntries(zones.map((z) => [z.id, centre(z.id)]));

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const qe = q.get('evento'); if (qe && events.some((e) => e.slug === qe)) setEv(qe);
    let disposed = false;
    (async () => {
      const m = await import('@/lib/club-scene');
      if (disposed || !canvas.current) return;
      if (!m.hasWebGL()) { setNoGL(true); return; }
      const s = new m.ClubScene(canvas.current, { interactive: true });
      scene.current = s;
      (window as unknown as { __club: ClubScene }).__club = s;
      s.onFrame = () => {
        markers.current.forEach((el, id) => {
          const p = positions.current[id]; if (!p) return;
          const v = s.project(p);
          el.style.transform = `translate(${v.x}px, ${v.y}px) translate(-50%, -50%)`;
          el.style.visibility = v.behind ? 'hidden' : 'visible';
        });
      };
      await s.load();
      if (disposed) return s.dispose();
      setReady(true);
      const qz = q.get('zona') as ZoneId | null;
      if (qz && zones.some((z) => z.id === qz)) pickZone(qz, s);
    })();
    return () => { disposed = true; scene.current?.dispose(); scene.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { scene.current?.setTableStates(taken); }, [taken, ready]);

  const nudge = () => { const s = scene.current; if (s) s.onFrame?.(); };
  useEffect(nudge, [zone, table, ready]);

  async function pickZone(id: ZoneId | null, s = scene.current) {
    setZone(id); setTable(null); setSent(false);
    if (!s) return;
    const m = await import('@/lib/club-scene');
    s.highlight(id, null);
    s.flyTo(id ? m.SHOTS[id] : m.SHOTS.overview);
  }
  function pickTable(id: string) {
    if (taken.has(id)) return;
    setTable(id); setSent(false);
    const s = scene.current; if (!s) return;
    s.highlight(zone, id);
    s.flyTo(s.shotForTable(id), 1100);
  }
  const toggleMood = (m: Mood) => { setMood(m); scene.current?.setMood(m); };

  const waText = encodeURIComponent(`Ciao Glitz, sono ${name}. Vorrei il tavolo ${table} (${zoneInfo?.name}) per ${event.name}, ${longDate(event.date)}. Siamo in ${guests}. Telefono ${phone}.`);

  return (
    <main className="tp-page tone-night" data-tone="night">
      <div className="tp-stage">
        <canvas ref={canvas} className="tp-canvas" aria-label="Modello 3D del Glitz Club" />
        {!ready && !noGL && <p className="tp-loading d d-l" role="status">Accendiamo il club…</p>}
        {noGL && <p className="tp-loading">Questo dispositivo non mostra il 3D. Scegli zona e tavolo dall’elenco.</p>}
        <div className="tp-markers">
          {ready && !zone && zones.map((z) => (
            <button key={z.id} ref={(r) => { if (r) markers.current.set(z.id, r); else markers.current.delete(z.id); }} className="tp-zm" onClick={() => pickZone(z.id)}>
              {z.name}
            </button>
          ))}
          {ready && zone && visible.map((t) => (
            <button key={t.id} ref={(r) => { if (r) markers.current.set(t.id, r); else markers.current.delete(t.id); }} className="tp-tm" data-taken={taken.has(t.id)} data-sel={table === t.id} disabled={taken.has(t.id)} aria-label={`Tavolo ${t.id}${taken.has(t.id) ? ', occupato' : ''}`} onClick={() => pickTable(t.id)}>
              {t.id}
            </button>
          ))}
        </div>
        <div className="tp-mood" role="group" aria-label="Luce">
          <button aria-pressed={mood === 'sunset'} onClick={() => toggleMood('sunset')}>Tramonto</button>
          <button aria-pressed={mood === 'night'} onClick={() => toggleMood('night')}>Notte</button>
        </div>
      </div>

      <aside className="tp-panel" data-lenis-prevent>
        {!zone && (
          <div className="tp-step">
            <h1 className="d d-xl">Scegli la tua vista.</h1>
            <label className="tp-ev"><span className="dim small">Per la serata</span>
              <select value={ev} onChange={(e) => setEv(e.target.value)}>
                {events.map((e) => <option key={e.slug} value={e.slug}>{e.name}, {longDate(e.date)}</option>)}
              </select>
            </label>
            <ul className="tp-zones">
              {zones.map((z) => {
                const free = TABLES.filter((t) => t.zone === z.id && !taken.has(t.id)).length;
                return (
                  <li key={z.id}><button onClick={() => pickZone(z.id)}>
                    <span className="d">{z.name}</span>
                    <span className="small dim">da €{z.from}, {free} tavoli liberi</span>
                  </button></li>
                );
              })}
            </ul>
          </div>
        )}

        {zone && zoneInfo && !sent && (
          <div className="tp-step">
            <button className="link-u small tp-back" onClick={() => pickZone(null)}>Tutte le zone</button>
            <h2 className="d d-xl">{table ? <>Tavolo <span className="num">{table}</span></> : zoneInfo.name}</h2>
            {!table && <>
              <p className="lede">{zoneInfo.line}</p>
              <p className="small dim">{zoneInfo.seats}. Consumazione minima da €{zoneInfo.from}, due bottiglie incluse.</p>
              <div className="tp-chips">
                {visible.map((t) => <button key={t.id} disabled={taken.has(t.id)} onClick={() => pickTable(t.id)}>{t.id}</button>)}
              </div>
              <p className="small dim">I tavoli barrati sono già presi per {event.name}.</p>
            </>}
            {table && (
              <form className="tp-form" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
                <p className="small dim">{zoneInfo.name}, {event.name}, {longDate(event.date)}</p>
                <dl className="tp-sum"><div><dt className="dim">Consumazione minima</dt><dd className="num d-l">€{zoneInfo.from}</dd></div></dl>
                <div className="tk-qty"><span>Ospiti</span><div><button type="button" aria-label="Un ospite in meno" onClick={() => setGuests(Math.max(2, guests - 1))}>−</button><output aria-live="polite">{guests}</output><button type="button" aria-label="Un ospite in più" onClick={() => setGuests(Math.min(14, guests + 1))}>+</button></div></div>
                <label className="fld"><span>Nome e cognome</span><input required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label>
                <label className="fld"><span>Telefono</span><input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" /></label>
                <button className="btn btn-led" type="submit">Richiedi il tavolo {table}</button>
                <p className="small dim">Non paghi ora. Lo staff conferma su WhatsApp.</p>
              </form>
            )}
          </div>
        )}

        {sent && (
          <div className="tp-step tp-done">
            <h2 className="d d-xl">Ci siamo quasi, {name.split(' ')[0]}.</h2>
            <p className="lede">Manda il messaggio su WhatsApp: è già scritto. Lo staff conferma il tavolo {table} da lì.</p>
            <a className="btn btn-led" href={`${WHATSAPP}?text=${waText}`} target="_blank" rel="noreferrer">Apri WhatsApp</a>
            <button className="link-u small" onClick={() => setSent(false)}>Modifica la richiesta</button>
          </div>
        )}
        <p className="small dim tp-note">Mappa ricostruita dalla planimetria. Disponibilità simulata in questa anteprima. <Link href="/info" className="link-u">Domande?</Link></p>
      </aside>
    </main>
  );
}
