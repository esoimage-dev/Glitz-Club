import VideoTile from '../VideoTile';

const TILES = [
  { poster: '/media/folla-arco.jpg', alt: 'La folla sotto l’arco, con i laser accesi', cls: 'mt-a' },
  { poster: '/media/dj-pad.jpg', alt: 'DJ in consolle con i pad illuminati', cls: 'mt-b' },
  { poster: '/media/fumo-folla.jpg', alt: 'Il pubblico nel fumo, visto dalla consolle', cls: 'mt-c' },
  { poster: '/media/dj-mixer.jpg', alt: 'Mani sul mixer, luci blu', cls: 'mt-d' },
];

/** Staggered tiles sized for the vertical videos still to come: pass src to VideoTile and they play. */
export default function Moments() {
  return (
    <section className="moments tone-night" data-tone="night" data-time="1530-1590">
      <h2 className="d d-xxl moments-h">Dura una notte.<br />Se ne parla tutto l’inverno.</h2>
      <div className="moments-grid">
        {TILES.map((t) => <VideoTile key={t.poster} {...t} />)}
      </div>
    </section>
  );
}
