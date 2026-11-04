'use client';
import { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const GLITZ: [number, number] = [15.78, 39.8426];
const LABEL_FONT = ['Noto Sans Regular'];

const road = (id: string, classes: string[], widths: [number, number][], opacity: number): maplibregl.LayerSpecification => ({
  id, type: 'line', source: 'map', 'source-layer': 'transportation',
  filter: ['in', ['get', 'class'], ['literal', classes]],
  layout: { 'line-cap': 'round', 'line-join': 'round' },
  paint: { 'line-color': '#ffffff', 'line-opacity': opacity, 'line-width': ['interpolate', ['linear'], ['zoom'], ...widths.flat()] },
});

// The site's night palette: black land, Tyrrhenian sea, white roads. Colour stays on the pin.
const STYLE: maplibregl.StyleSpecification = {
  version: 8,
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  sources: { map: { type: 'vector', url: 'https://tiles.openfreemap.org/planet' } },
  layers: [
    { id: 'land', type: 'background', paint: { 'background-color': '#0b0c0e' } },
    { id: 'green', type: 'fill', source: 'map', 'source-layer': 'landcover', filter: ['in', ['get', 'class'], ['literal', ['wood', 'grass', 'farmland']]], paint: { 'fill-color': '#10170f' } },
    { id: 'water', type: 'fill', source: 'map', 'source-layer': 'water', paint: { 'fill-color': '#0f4a68' } },
    { id: 'buildings', type: 'fill', source: 'map', 'source-layer': 'building', minzoom: 14, paint: { 'fill-color': '#26272a' } },
    road('roads-small', ['minor', 'service', 'track', 'path'], [[11, 0.2], [15, 1.1], [18, 5]], 0.42),
    road('roads-mid', ['tertiary', 'secondary'], [[9, 0.5], [15, 1.8], [18, 8]], 0.72),
    road('roads-big', ['primary', 'trunk', 'motorway'], [[7, 0.7], [15, 2.6], [18, 11]], 0.92),
    {
      id: 'places', type: 'symbol', source: 'map', 'source-layer': 'place',
      filter: ['in', ['get', 'class'], ['literal', ['town', 'village', 'island', 'islet', 'suburb']]],
      layout: { 'text-field': ['coalesce', ['get', 'name:it'], ['get', 'name']], 'text-font': LABEL_FONT, 'text-size': 12 },
      paint: { 'text-color': '#c9ccd1', 'text-halo-color': '#0b0c0e', 'text-halo-width': 1.4 },
    },
  ],
};

export default function WhereMap() {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!box.current) return;
    let map: maplibregl.Map | null = null;
    try {
      // The bundler can't follow the library's worker, so it's served from public/vendor
      maplibregl.setWorkerUrl(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/vendor/maplibre-gl-worker.mjs`);
      map = new maplibregl.Map({ container: box.current, style: STYLE, center: GLITZ, zoom: 13.4, minZoom: 9, maxZoom: 18, attributionControl: { compact: true }, dragRotate: false, pitchWithRotate: false });
      map.touchZoomRotate.disableRotation();
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
      const pin = document.createElement('div');
      pin.className = 'wh-pin';
      pin.innerHTML = '<svg viewBox="0 0 40 40" aria-hidden="true"><defs><linearGradient id="wh-led" x1="0" x2="1"><stop stop-color="#5a5cf7"/><stop offset=".55" stop-color="#d41fd0"/><stop offset="1" stop-color="#ff8a2a"/></linearGradient></defs><path d="M6 38V20a14 14 0 0 1 28 0v18" fill="none" stroke="url(#wh-led)" stroke-width="3.4" stroke-linecap="round"/></svg><span>Glitz Club</span>';
      new maplibregl.Marker({ element: pin, anchor: 'bottom' }).setLngLat(GLITZ).addTo(map);
    } catch {
      // No WebGL: the panel still has the address and the directions button
    }
    return () => { map?.remove(); };
  }, []);

  return <div ref={box} className="wh-canvas" />;
}
