// Single source of content until the back office exists. Everything here moves to the database later.
export type GlitzEvent = {
  slug: string; date: string; name: string; tagline: string; lineup: string[]; poster?: string;
};

export const TICKET_URL = 'https://www.ticketsms.it/glitz-club';
export const WHATSAPP = 'https://wa.me/393444289232';
export const WHATSAPP_LABEL = '+39 344 428 9232';
export const EMAIL = 'glitzclubofficial@gmail.com';
export const INSTAGRAM = 'https://instagram.com/glitzclubofficial';
export const TIKTOK = 'https://tiktok.com/@glitzclubofficial';
export const ADDRESS = 'Contrada Dino, 87020 San Nicola Arcella (CS)';

export const events: GlitzEvent[] = [
  { slug: 'damante-opening', date: '2027-06-26', name: 'Damante', tagline: 'Si apre la stagione', lineup: ['Andrea Damante', 'Resident Glitz'], poster: '/posters/2027-06-26.jpg' },
  { slug: 'face-to-face', date: '2027-07-03', name: 'Face to Face', tagline: 'Melodic techno, a due', lineup: ['Wonik', 'Mauro Milano'], poster: '/posters/2027-07-03.jpg' },
  { slug: 'ludwig', date: '2027-07-10', name: 'Ludwig', tagline: 'La notte urban', lineup: ['Raul Dumitras', 'Warm-up Riccardo Lena'], poster: '/posters/2027-07-10.jpg' },
  { slug: 'attenzione-instabile', date: '2027-07-17', name: 'A.I.', tagline: 'Attenzione instabile', lineup: ['A.I. Collective', 'Guest da annunciare'] },
  { slug: 'mamacita', date: '2027-07-24', name: 'Mamacita', tagline: 'Reggaeton fino al mattino', lineup: ['Mamacita DJs', 'Latin show'] },
  { slug: 'ludwig-house-disco', date: '2027-08-06', name: 'Ludwig', tagline: 'House e disco', lineup: ['Ludwig', 'Resident Marco Cavax'] },
  { slug: 'pagante-ferragosto', date: '2027-08-14', name: 'Pagante', tagline: 'La notte di Ferragosto', lineup: ['Il Pagante', 'Live e DJ set'] },
  { slug: 'bob-sinclar', date: '2027-08-21', name: 'Bob Sinclar', tagline: 'Headliner internazionale', lineup: ['Bob Sinclar', 'Opening Angelica Nova'] },
  { slug: 'gue', date: '2027-08-27', name: 'Guè', tagline: 'Live in concerto', lineup: ['Guè', 'DJ Harsh'] },
  { slug: 'mamacita-closing', date: '2027-08-28', name: 'Mamacita', tagline: "L'ultima notte d'estate", lineup: ['Mamacita DJs', 'Special guest e fuochi'] },
];

export const archive = [
  { date: '2026-08-08', name: 'Ludwig', poster: '2026-08-08-ludwig' },
  { date: '2026-08-01', name: 'Mamacita', poster: '2026-08-01-mamacita' },
  { date: '2026-07-25', name: 'Thalab', poster: '2026-07-25-thalab' },
  { date: '2026-07-18', name: 'Ladies Night', poster: '2026-07-18-ladies-night' },
  { date: '2026-07-11', name: 'James Carter', poster: '2026-07-11-james-carter' },
  { date: '2026-07-04', name: 'Black Party', poster: '2026-07-04-black-party-with-wonik' },
  { date: '2026-06-27', name: 'Cristian Marchi', poster: '2026-06-27-cristian-marchi--opening' },
  { date: '2025-08-23', name: 'Ludovica Pagani', poster: '2025-08-23-ludovica-pagani' },
  { date: '2025-08-16', name: 'Timeless', poster: '2025-08-16-timeless-with-wonik' },
  { date: '2025-08-11', name: 'Damante', poster: '2025-08-11-damante' },
  { date: '2025-08-02', name: 'Goodboys', poster: '2025-08-02-goodboys' },
  { date: '2025-07-26', name: 'Georgia Mos', poster: '2025-07-26-georgia-mos' },
  { date: '2025-07-12', name: 'Asia Nardi', poster: '2025-07-12-asia-nardi' },
];

export type ZoneId = 'riva' | 'back' | 'glitzbar' | 'prato-back' | 'seaview';
export const zones: { id: ZoneId; name: string; from: number; line: string; seats: string; photo: string }[] = [
  { id: 'back', name: 'Back the Stage', from: 400, line: 'Dietro la consolle, a filo pista. Il DJ lo guardi in faccia.', seats: 'Sedute morbide, tavolini tondi', photo: '/media/terrazza-giorno.jpg' },
  { id: 'riva', name: 'Riva Deck', from: 300, line: 'Il cuore del club. Divani bianchi, pista davanti, mare dietro.', seats: 'Divani bianchi, base in legno', photo: '/media/scale-tramonto.jpg' },
  { id: 'glitzbar', name: 'Glitz Bar', from: 300, line: 'Per chi vuole ballare restando seduto a un tavolo vero.', seats: 'Panche, tavoli in legno', photo: '/media/lounge-giardino.jpg' },
  { id: 'prato-back', name: 'Prato Back', from: 300, line: 'Poltrone sul prato, sotto gli alberi. La festa, un passo più in là.', seats: 'Poltrone morbide, tavolini bianchi', photo: '/media/arco-giorno.jpg' },
  { id: 'seaview', name: 'Sea View', from: 250, line: 'La ringhiera, il Tirreno, l’Isola di Dino. Nient’altro davanti.', seats: 'Seduta panoramica lungo la ringhiera', photo: '/media/sofa-dino.jpg' },
];

export const wall = [
  'Goodboys', 'Topic', 'Damante', 'Cristian Marchi', 'Wonik', 'Thalab', 'Ludwig', 'James Carter',
  'Ludovica Pagani', 'Georgia Mos', 'Mamacita', 'Asia Nardi', 'Mauro Milano',
];

export const faq = [
  ['Da che età si entra?', 'Dai 18 anni, con un documento valido.'],
  ['Come ci si veste?', 'Smart ed elegante. Niente infradito, canottiere o capi da spiaggia.'],
  ['A che ora si comincia?', 'In genere dalle 23:00, fino all’alba. L’orario esatto è nella pagina di ogni serata.'],
  ['Come prenoto un tavolo?', 'Scegli il tavolo sulla mappa e manda la richiesta. Lo staff conferma posizione e minimo di spesa su WhatsApp.'],
  ['Si parcheggia?', 'Ci sono aree di sosta vicine. Nelle grandi serate conviene arrivare presto o prendere una navetta privata.'],
  ['Si paga con la carta?', 'Sì, a bar e tavoli: carte, contactless e smartphone.'],
  ['E se piove?', 'Le serate si fanno. In caso di allerta meteo trovi la comunicazione ufficiale su @glitzclubofficial.'],
];

const MONTHS = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
const DAYS = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
export const parts = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return { year: y, month: MONTHS[m - 1], day: d, weekday: DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()], dd: String(d).padStart(2, '0'), mm: String(m).padStart(2, '0') };
};
export const longDate = (iso: string) => { const p = parts(iso); return `${p.weekday} ${p.day} ${p.month}`; };
