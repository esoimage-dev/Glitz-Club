'use client';
import { useState } from 'react';
import { WHATSAPP } from '@/lib/data';

const OCCASIONS = ['Compleanno', 'Addio al celibato o nubilato', 'Matrimonio o after-party', 'Azienda', 'Lancio di prodotto', 'Cena privata', 'Altro'];
const AREAS = [['Tutto il club', 'fino a 2000'], ['Back the Stage', 'fino a 300'], ['Riva Deck', 'fino a 200'], ['Glitz Bar', 'fino a 150'], ['Da decidere insieme', '']];

export default function PrivateForm() {
  const [occ, setOcc] = useState(OCCASIONS[0]);
  const [area, setArea] = useState(AREAS[0][0]);
  const [f, setF] = useState({ name: '', date: '', people: '', notes: '' });
  const [sent, setSent] = useState(false);
  const up = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const text = encodeURIComponent(`Ciao Glitz, sono ${f.name}. ${occ} per circa ${f.people} persone, il ${f.date}. Zona: ${area}. ${f.notes}`);
  if (sent) return (
    <div className="pv-form">
      <h2 className="d d-xl">La tua richiesta è pronta.</h2>
      <p className="lede">Mandala su WhatsApp: è già scritta. Ti risponde l’event manager.</p>
      <a className="btn btn-solid" href={`${WHATSAPP}?text=${text}`} target="_blank" rel="noreferrer">Apri WhatsApp</a>
    </div>
  );
  return (
    <form className="pv-form" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
      <fieldset><legend className="d d-l">Cosa festeggiate?</legend>
        <div className="pv-opts">{OCCASIONS.map((o) => <label key={o} className="opt"><input type="radio" name="occ" checked={occ === o} onChange={() => setOcc(o)} /><span>{o}</span></label>)}</div>
      </fieldset>
      <fieldset><legend className="d d-l">Dove?</legend>
        <div className="pv-opts">{AREAS.map(([a, n]) => <label key={a} className="opt"><input type="radio" name="area" checked={area === a} onChange={() => setArea(a)} /><span>{a}{n && <em className="dim"> {n}</em>}</span></label>)}</div>
      </fieldset>
      <div className="pv-two">
        <label className="fld"><span>Quando</span><input required value={f.date} onChange={up('date')} placeholder="Data o periodo" /></label>
        <label className="fld"><span>Quanti siete</span><input required inputMode="numeric" value={f.people} onChange={up('people')} placeholder="Circa" /></label>
      </div>
      <label className="fld"><span>Nome e cognome</span><input required value={f.name} onChange={up('name')} autoComplete="name" /></label>
      <label className="fld"><span>Cos’altro dobbiamo sapere</span><textarea rows={3} value={f.notes} onChange={up('notes')} /></label>
      <button className="btn btn-solid" type="submit">Prepara la richiesta</button>
    </form>
  );
}
