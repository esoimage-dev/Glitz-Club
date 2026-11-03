import type { Metadata } from 'next';
import Image from 'next/image';
import PrivateForm from '@/components/PrivateForm';
import Footer from '@/components/Footer';

export const metadata: Metadata = { title: 'Eventi privati' };

export default function Privati() {
  return (
    <main>
      <section className="pv tone-day" data-tone="day">
        <h1 className="d d-mega pv-h">Solo voi.</h1>
        <div className="pv-grid">
          <div className="pv-left">
            <div className="arch ph pv-img"><Image src="/media/sole-arco.jpg" alt="Il sole che tramonta dentro l’arco" fill priority sizes="(max-width:860px) 90vw, 40vw" /></div>
            <p className="lede">Una zona o tutto il club, da 50 a 2000 persone. Mettiamo noi staff, suono e luci. Voi portate il motivo.</p>
          </div>
          <PrivateForm />
        </div>
      </section>
      <Footer />
    </main>
  );
}
