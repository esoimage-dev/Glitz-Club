'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Logo } from './Logo';
import { ADDRESS, EMAIL, INSTAGRAM, TIKTOK, TICKET_URL, WHATSAPP, WHATSAPP_LABEL } from '@/lib/data';

/** The night ends at dawn, on every page. Black fades through sunrise back to white. */
export default function Footer() {
  const [state, setState] = useState<'idle' | 'done'>('idle');
  return (
    <footer className="ft" data-tone="night" data-time="1680-1740">
      <div className="ft-top">
        <h2 className="d d-xxl">Ci vediamo<br />all’alba.</h2>
        {state === 'idle' ? (
          <form className="ft-news" onSubmit={(e) => { e.preventDefault(); setState('done'); }}>
            <label className="sr-only" htmlFor="ft-mail">La tua email</label>
            <input id="ft-mail" type="email" required placeholder="La tua email, per sapere prima di tutti" autoComplete="email" />
            <button className="btn btn-line" type="submit"><span>Entra in lista</span></button>
          </form>
        ) : (
          <p className="lede" role="status" style={{ marginTop: 34 }}>Sei in lista. La prossima line-up la ricevi prima degli altri.</p>
        )}
      </div>
      <div className="ft-cols">
        <div><h4>Stasera</h4><ul><li><Link href="/eventi">Serate</Link></li><li><Link href="/tavoli">Tavoli</Link></li><li><a href={TICKET_URL} target="_blank" rel="noreferrer">Biglietti su TicketSms</a></li></ul></div>
        <div><h4>Il posto</h4><ul><li><Link href="/il-club">Il club</Link></li><li><Link href="/privati">Eventi privati</Link></li><li><Link href="/info">Come arrivare</Link></li></ul></div>
        <div><h4>Parla con noi</h4><ul><li><a href={WHATSAPP} target="_blank" rel="noreferrer">{WHATSAPP_LABEL}</a></li><li><a href={`mailto:${EMAIL}`}>{EMAIL}</a></li></ul></div>
        <div><h4>Seguici</h4><ul><li><a href={INSTAGRAM} target="_blank" rel="noreferrer">Instagram</a></li><li><a href={TIKTOK} target="_blank" rel="noreferrer">TikTok</a></li></ul></div>
      </div>
      <Logo className="ft-logo" />
      <div className="ft-legal small"><span>{ADDRESS}</span><span>© {new Date().getFullYear()} Glitz Club</span></div>
    </footer>
  );
}
