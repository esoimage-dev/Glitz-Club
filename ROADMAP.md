# Glitz Club: stato del progetto

## Fatto (v0.1)
- Logo vettoriale identico al master, animazione "L'accensione" (`public/brand/`, `/brand`)
- Design system: giorno bianco, tramonto, notte LED (`styles/base.css`)
- Pagine: home, serate e archivio, scheda serata, tavoli 3D, il club, privati, info, brand
- Modello 3D estratto dal vecchio sito, da 85 MB a 4,7 MB, riacceso con luci nuove (`lib/club-scene.ts`)
- Anteprima biglietto e richiesta tavolo via WhatsApp

## Dati da confermare (`lib/data.ts`)
- Calendario 2027: artisti e date vengono dal vecchio sito, sembrano segnaposto
- Minimi di spesa per zona, capienze, "2000 persone", prezzi biglietti (questi ultimi sono di esempio)
- Nome zona: "Sea View" o "Seat View"
- Si può scrivere che è una villa privata?

## Prossimi passi
1. Video: slot pronti in `components/VideoTile.tsx` e nella home
2. 3D: modifiche al modello (lista da Edoardo), rifinire materiali e tramonto, inquadrature sul mare. Su telefono si usa `public/models/glitz-mobile.glb`: va rigenerato con `node scripts/mobile-model.mjs` a ogni modifica del modello
3. Backend: database, back office serate e tavoli, disponibilità reale
4. Ticketing: pagamento, QR firmato, email brandizzata, scanner all'ingresso
5. Newsletter: mailing list con invio email (il form oggi non salva nulla)
6. Inglese, SEO, cookie e privacy, analytics
7. Shop e news: tenuti fuori da questa versione per snellire, si rimettono se servono
