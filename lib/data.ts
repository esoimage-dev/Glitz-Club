// Single source of content until the back office exists. Everything here moves to the database later.
export type GlitzEvent = {
  slug: string; date: string; name: string; tagline: string; lineup: string[]; poster?: string; doors?: string;
};

export const SOON = { line: 'Estate 2027 uscirà presto.', cta: 'Tenetevi connessi nel posto giusto.' };

export const TICKET_URL = 'https://www.ticketsms.it/glitz-club';
export const WHATSAPP = 'https://wa.me/393444289232';
export const WHATSAPP_LABEL = '+39 344 428 9232';
export const EMAIL = 'glitzclubofficial@gmail.com';
export const INSTAGRAM = 'https://instagram.com/glitzclubofficial';
export const TIKTOK = 'https://tiktok.com/@glitzclubofficial';
export const ADDRESS = 'Contrada Dino, 87020 San Nicola Arcella (CS)';

// Summer 2026 as it actually went: dates from the TicketSms archive and the Instagram posters.
// When the 2027 programme is out, add its nights here and publish: the whole site switches over by date.
// Header and mobile button become "Biglietti" and open the next night, the hero announces it, the list shows the new season.
export const events: GlitzEvent[] = [
  { slug: 'cristian-marchi-opening', date: '2026-06-27', name: 'Cristian Marchi', tagline: 'Opening party', lineup: ['Cristian Marchi'], poster: '/posters/2026-06-27-cristian-marchi--opening.jpg' },
  { slug: 'black-party', date: '2026-07-04', name: 'Black Party', tagline: 'Con Wonik', lineup: ['Wonik'], poster: '/posters/2026-07-04-black-party-with-wonik.jpg' },
  { slug: 'james-carter', date: '2026-07-11', name: 'James Carter', tagline: 'In consolle', lineup: ['James Carter'], poster: '/posters/2026-07-11-james-carter.jpg' },
  { slug: 'ladies-night', date: '2026-07-18', name: 'Ladies Night', tagline: 'La notte delle ragazze', lineup: ['Ladies Night'], poster: '/posters/2026-07-18-ladies-night.jpg' },
  { slug: 'thalab', date: '2026-07-25', name: 'Thalab', tagline: 'In consolle', lineup: ['Thalab'], poster: '/posters/2026-07-25-thalab.jpg' },
  { slug: 'mamacita', date: '2026-08-01', name: 'Mamacita', tagline: 'Summer tour', lineup: ['Mamacita'], poster: '/posters/2026-08-01-mamacita.jpg' },
  { slug: 'glitz-room', date: '2026-08-06', name: 'Glitz Room', tagline: 'Il Glitz in un’altra veste', lineup: ['Dalle 19:30 alle 01:00', 'Ingresso omaggio'], poster: '/posters/2026-08-06-glitz-room.jpg', doors: 'Dalle 19:30' },
  { slug: 'ludwig', date: '2026-08-08', name: 'Ludwig', tagline: 'In consolle', lineup: ['Ludwig'], poster: '/posters/2026-08-08-ludwig.jpg' },
  { slug: 'face-to-face', date: '2026-08-22', name: 'Face to Face', tagline: 'Wonik e Mauro Milano', lineup: ['Wonik', 'Mauro Milano'], poster: '/posters/2026-08-22-face-to-face.jpg' },
  { slug: 'damante', date: '2026-08-29', name: 'Damante', tagline: 'In consolle', lineup: ['Damante', 'Opening Wonik e Mauro Milano'], poster: '/posters/2026-08-29-damante.jpg' },
];

export const isPast = (iso: string) => new Date(`${iso}T23:59:59`) < new Date();
export const upcoming = events.filter((e) => !isPast(e.date)).sort((a, b) => a.date.localeCompare(b.date));
export const SEASON = Number((upcoming[0]?.date ?? events[events.length - 1].date).slice(0, 4));
export const seasonEvents = events.filter((e) => e.date.startsWith(String(SEASON)));
export const mainCta = upcoming[0]
  ? { label: 'Biglietti', href: `/eventi/${upcoming[0].slug}` }
  : { label: 'Serate', href: '/eventi' };

export const archive = [
  { date: '2026-08-29', name: 'Damante', poster: '2026-08-29-damante' },
  { date: '2026-08-22', name: 'Face to Face', poster: '2026-08-22-face-to-face' },
  { date: '2026-08-08', name: 'Ludwig', poster: '2026-08-08-ludwig' },
  { date: '2026-08-06', name: 'Glitz Room', poster: '2026-08-06-glitz-room' },
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
