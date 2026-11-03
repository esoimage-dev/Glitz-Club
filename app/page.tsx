import Hero from '@/components/home/Hero';
import Yacht from '@/components/home/Yacht';
import Sunset from '@/components/home/Sunset';
import ArchOn from '@/components/home/ArchOn';
import Season from '@/components/home/Season';
import ZoneStory from '@/components/home/ZoneStory';
import Moments from '@/components/home/Moments';
import Wall from '@/components/home/Wall';
import Private from '@/components/home/Private';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main>
      <Hero />
      <Yacht />
      <Sunset />
      <ArchOn />
      <Season />
      <ZoneStory />
      <Moments />
      <Wall />
      <Private />
      <Footer />
    </main>
  );
}
