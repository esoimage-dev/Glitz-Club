'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Logo } from './Logo';
import { TICKET_URL, longDate, type GlitzEvent } from '@/lib/data';

// Example prices: the real ones come from the back office.
const TIERS = [
  { id: 'ingresso', name: 'Ingresso', price: 25, note: 'Accesso alla pista' },
  { id: 'drink', name: 'Ingresso e drink', price: 30, note: 'Un drink al bar incluso' },
  { id: 'prima', name: 'Primo ingresso', price: 40, note: 'Corsia dedicata fino a mezzanotte' },
];

const code = (s: string) => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };

/** Stand-in QR: replaced by the signed code from the ticketing backend. */
function FakeQR({ seed }: { seed: string }) {
  let h = code(seed); const cells: boolean[] = [];
  for (let i = 0; i < 169; i++) { h = (h * 1664525 + 1013904223) >>> 0; cells.push(h % 100 > 52); }
  return (
    <svg viewBox="0 0 13 13" className="tk-qr" aria-label="Codice del biglietto" shapeRendering="crispEdges">
      {cells.map((on, i) => on && <rect key={i} x={i % 13} y={Math.floor(i / 13)} width="1" height="1" fill="currentColor" />)}
    </svg>
  );
}

export default function TicketSheet({ event }: { event: GlitzEvent }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [step, setStep] = useState<'pick' | 'you' | 'ticket'>('pick');
  const [tier, setTier] = useState(TIERS[0]);
  const [qty, setQty] = useState(2);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; if (open) { const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false); addEventListener('keydown', k); return () => removeEventListener('keydown', k); } }, [open]);

  return (
    <>
      <button className="btn btn-led" onClick={() => { setStep('pick'); setOpen(true); }}>Compra i biglietti</button>
      {mounted && createPortal(<AnimatePresence>
        {open && (
          <motion.div className="tk" role="dialog" aria-modal="true" aria-label={`Biglietti per ${event.name}`} data-lenis-prevent initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="tk-back" onClick={() => setOpen(false)} />
            <motion.div className="tk-panel tone-day" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
              <div className="tk-top"><p>{event.name}, {longDate(event.date)}</p><button className="link-u" onClick={() => setOpen(false)}>Chiudi</button></div>

              {step === 'pick' && (
                <>
                  <h2 className="d d-xl">Quanti siete?</h2>
                  <div className="tk-tiers" role="radiogroup" aria-label="Tipo di biglietto">
                    {TIERS.map((t) => (
                      <button key={t.id} role="radio" aria-checked={tier.id === t.id} className="tk-tier" onClick={() => setTier(t)}>
                        <span><b>{t.name}</b><br /><span className="dim small">{t.note}</span></span><span className="num d-l">€{t.price}</span>
                      </button>
                    ))}
                  </div>
                  <div className="tk-qty">
                    <span>Biglietti</span>
                    <div><button aria-label="Uno in meno" onClick={() => setQty(Math.max(1, qty - 1))}>−</button><output aria-live="polite">{qty}</output><button aria-label="Uno in più" onClick={() => setQty(Math.min(10, qty + 1))}>+</button></div>
                  </div>
                  <button className="btn btn-solid tk-go" onClick={() => setStep('you')}>Continua, €{tier.price * qty}</button>
                  <p className="small dim">Prezzi di esempio. Finché il nostro ticketing non è attivo si compra su <a className="link-u" href={TICKET_URL} target="_blank" rel="noreferrer">TicketSms</a>.</p>
                </>
              )}

              {step === 'you' && (
                <form onSubmit={(e) => { e.preventDefault(); setStep('ticket'); }}>
                  <h2 className="d d-xl">A chi lo mandiamo?</h2>
                  <label className="fld"><span>Nome e cognome</span><input required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label>
                  <label className="fld"><span>Email</span><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
                  <button className="btn btn-solid tk-go" type="submit">Vedi il biglietto</button>
                  <button type="button" className="link-u small" onClick={() => setStep('pick')}>Torna indietro</button>
                </form>
              )}

              {step === 'ticket' && (
                <>
                  <motion.div className="tk-pass" initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
                    <Logo className="tk-pass-logo" />
                    <p className="d d-l">{event.name}</p>
                    <p>{longDate(event.date)}, dalle 23:30</p>
                    <FakeQR seed={name + event.slug} />
                    <p className="small">{name}<br />{qty} × {tier.name}</p>
                  </motion.div>
                  <p className="small dim tk-demo">Così arriva il biglietto via email a {email}. Anteprima: nessun pagamento e nessun invio.</p>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>, document.body)}
    </>
  );
}
