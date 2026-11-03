import type { Metadata } from 'next';
import TablePicker from '@/components/TablePicker';

export const metadata: Metadata = { title: 'Scegli il tavolo' };

export default function Tavoli() { return <TablePicker />; }
