# Glitz Club: stato del progetto

## Fatto (v0.1)
- Logo vettoriale identico al master, animazione "L'accensione" (`public/brand/`, `/brand`)
- Design system: giorno bianco, tramonto, notte LED (`styles/base.css`)
- Pagine: home, serate e archivio, scheda serata, tavoli 3D, il club, privati, info, brand
- Modello 3D estratto dal vecchio sito, da 85 MB a 4,7 MB, riacceso con luci nuove (`lib/club-scene.ts`)
- Anteprima biglietto e richiesta tavolo via WhatsApp

## Dati da confermare (`lib/data.ts`)
- Sito attuale: mostra l'estate 2026 reale (archivio TicketSms e Instagram). Il calendario 2027 va aggiunto in `events`: alla pubblicazione il tasto "Serate" diventa "Biglietti" e apre la serata successiva, e tornano annuncio in hero e selezione serata
- Sottotitoli delle serate 2026 ("In consolle" ecc.): scritti da me, da rivedere. Locandine di agosto ritagliate dagli screenshot: servono gli originali
- Minimi di spesa per zona, capienze, "2000 persone", prezzi biglietti (questi ultimi sono di esempio)
- Nome zona: "Sea View" o "Seat View"
- Si può scrivere che è una villa privata?

## Come è fatto il 3D
- `lib/club-surroundings.ts`: tutto il contesto, in codice (terrazzamenti, scogliera, siepi, cancello, strada, case, palme, luci esterne, abat-jour). Si modifica e basta.
- `lib/club-scene.ts`: luci, cielo, camere, panning e relativi limiti.
- `scripts/model-source/glitz-base.html`: il modello originale con le nostre correzioni (scale, bar, alberi). Se cambia va riesportato con `GlitzMap.exportGLB()`, compresso con `gltf-transform optimize` (meshopt, simplify-error 0.008, join e flatten disattivati), copiato in `public/models/glitz.glb`; poi `node scripts/mobile-model.mjs`.
- Il contesto è stilizzato e non segue la mappa reale, per scelta.

## Prossimi passi
1. Video: slot pronti in `components/VideoTile.tsx` e nella home
2. 3D: modifiche al modello (lista da Edoardo), rifinire materiali e tramonto, inquadrature sul mare. Su telefono si usa `public/models/glitz-mobile.glb`: va rigenerato con `node scripts/mobile-model.mjs` a ogni modifica del modello
3. Backend: database, back office serate e tavoli, disponibilità reale
4. Ticketing: pagamento, QR firmato, email brandizzata, scanner all'ingresso
5. Newsletter: mailing list con invio email (il form oggi non salva nulla)
6. Inglese, SEO, cookie e privacy, analytics
7. Shop e news: tenuti fuori da questa versione per snellire, si rimettono se servono
