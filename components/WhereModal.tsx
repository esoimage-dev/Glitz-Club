'use client';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'motion/react';
import { ADDRESS } from '@/lib/data';

const PLACE = encodeURIComponent('Glitz Club, San Nicola Arcella');
// The map library only downloads the first time this opens, so it costs the page nothing until then.
const WhereMap = dynamic(() => import('./WhereMap'), { ssr: false });

export default function WhereModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    addEventListener('keydown', k);
    return () => removeEventListener('keydown', k);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="wh" role="dialog" aria-modal="true" aria-label="Dove siamo" data-lenis-prevent initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
          <div className="wh-back" onClick={onClose} />
          <motion.div className="wh-panel" initial={{ y: 30 }} animate={{ y: 0 }} exit={{ y: 30 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
            <div className="wh-top">
              <h2 className="d d-l">Dove siamo</h2>
              <button type="button" className="link-u" onClick={onClose}>Chiudi</button>
            </div>
            <div className="wh-map">
              <WhereMap />
            </div>
            <p>{ADDRESS}<br /><span className="dim">Davanti all’Isola di Dino</span></p>
            <a className="btn" href={`https://www.google.com/maps/dir/?api=1&destination=${PLACE}`} target="_blank" rel="noreferrer">Apri le indicazioni</a>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
