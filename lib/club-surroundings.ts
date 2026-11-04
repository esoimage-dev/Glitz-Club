import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/*
 * Everything around the club, built in code on top of the model: terraces and cliff towards the sea,
 * perimeter hedge, the open white gate, the road and a stylised neighbourhood.
 * World: +x is the sea, -x the road, y up, metres. Deliberately low-poly and muted: the club keeps the attention.
 */

type P2 = [number, number];
export type Mood = 'night' | 'sunset';

const T1 = -0.9;  // first lawn past the last seats, lowered
const T2 = -2.3;
const T3 = -3.7;  // lighter lawn, then the cliff
const EDGE_1 = 30;
const EDGE_2 = 39;
const EDGE_3 = 47;
const NORTH = -36;
const SOUTH = 75.5;
const ROAD_Y = 0.82;

// Where the grey access road meets the white ramp (planimetria, plan 570,946 and 650,958)
const GATE_A: P2 = [-22.5, -0.45];
const GATE_B: P2 = [-23.05, 3.1];

const PROPERTY: P2[] = [[-23.6, -20], [16, NORTH - 0.5], [48, NORTH - 0.5], [48, SOUTH + 0.5], [25, 72], [-36.2, 72], [-36.2, 17.3], [-28.2, 17], [-24.4, 3.4], [-23.9, -0.9]];

const ROAD_LINE = new THREE.CatmullRomCurve3([[-90, -420], [-62, -260], [-42, -120], [-33, -40], [-31, 0], [-38.5, 22], [-42, 60], [-56, 140], [-92, 260], [-120, 420]].map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal');
const ROAD_POINTS = ROAD_LINE.getPoints(170);

const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const noise = (x: number, z: number) => Math.sin(x * 0.13 + 1.3) * Math.cos(z * 0.11 - 0.7) + 0.5 * Math.sin(x * 0.31 + z * 0.23) + 0.25 * Math.sin(x * 0.71 - z * 0.67);
const coast = (z: number) => 54 + 3.4 * Math.sin(z / 37) + 1.6 * Math.sin(z / 11);

function inside(p: P2[], x: number, z: number) {
  let c = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    if (p[i][1] > z !== p[j][1] > z && x < ((p[j][0] - p[i][0]) * (z - p[i][1])) / (p[j][1] - p[i][1]) + p[i][0]) c = !c;
  }
  return c;
}

const roadDistance = (x: number, z: number) => {
  let best = Infinity;
  for (const p of ROAD_POINTS) { const d = (p.x - x) ** 2 + (p.z - z) ** 2; if (d < best) best = d; }
  return Math.sqrt(best);
};

function terrain(x: number, z: number) {
  const seaward = smooth(10, 48, x);
  let y = lerp(0.74, T3 - 0.1, seaward);
  if (x < -48) y += ((-48 - x) / 340) ** 1.5 * 74 * (0.74 + 0.26 * noise(x * 0.4, z * 0.4)) + smooth(-48, -110, x) * noise(x, z) * 1.6;
  const away = Math.max(0, Math.abs(z - 20) - 140);
  if (x < 20) y += (away / 500) ** 1.6 * 16;
  const edge = coast(z);
  if (x > edge - 6) {
    const d = (x - (edge - 6)) / 13;
    const jag = noise(x * 2.6, z * 2.6) * 0.9 * (1 - Math.abs(d * 2 - 1));
    y = lerp(y, -11, smooth(0, 1, d)) + jag;
  }
  return y;
}

function ground(x: number, z: number) {
  if (x > 15 && x < EDGE_3 + 0.5 && z > NORTH && z < SOUTH) return -6; // under the terraces
  if (inside(PROPERTY, x, z)) return -0.1;
  const y = terrain(x, z);
  const d = x > -8 ? Infinity : roadDistance(x, z);
  if (d < 22) {
    // The road cuts a level bench: nearest centre height, blending back into the hillside
    let best = ROAD_POINTS[0]; let bd = Infinity;
    for (const p of ROAD_POINTS) { const k = (p.x - x) ** 2 + (p.z - z) ** 2; if (k < bd) { bd = k; best = p; } }
    return lerp(roadHeight(best.x, best.z) - 0.08, y, smooth(5, 22, d));
  }
  return y;
}
const roadHeight = (x: number, z: number) => Math.max(ROAD_Y, terrain(x, z));

/** Non-uniform grid: fine around the club, coarse to the horizon. */
function buildGround(step: number) {
  const axis = (from: number, to: number, a: number, b: number) => {
    const out: number[] = [];
    for (let v = from; v < a; v += 48) out.push(v);
    for (let v = a; v < b; v += step) out.push(v);
    for (let v = b; v <= to; v += 48) out.push(v);
    return out;
  };
  const xs = axis(-560, 90, -70, 76);
  const zs = axis(-900, 900, -70, 110);
  const pos: number[] = []; const col: number[] = []; const c = new THREE.Color();
  const grass = new THREE.Color('#3f5233'); const grassB = new THREE.Color('#566642'); const rock = new THREE.Color('#857a68'); const rockB = new THREE.Color('#5f574a');
  const paint = (cx: number, cy: number, cz: number) => {
    const edge = coast(cz);
    const r = smooth(edge - 4, edge, cx);
    c.copy(grass).lerp(grassB, 0.5 + 0.5 * noise(cx * 0.5, cz * 0.5));
    if (r > 0) c.lerp(rock, r).lerp(rockB, smooth(-5, -11, cy) * 0.5 + 0.2 * Math.abs(noise(cx * 3, cz * 3)));
    for (let k = 0; k < 3; k++) col.push(c.r, c.g, c.b);
  };
  const heights = xs.map((x) => zs.map((z) => ground(x, z)));
  for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < zs.length - 1; j++) {
    const corners = [[i, j], [i, j + 1], [i + 1, j], [i + 1, j], [i, j + 1], [i + 1, j + 1]];
    for (let t = 0; t < 6; t += 3) {
      let cx = 0; let cy = 0; let cz = 0;
      for (const [a, b] of corners.slice(t, t + 3)) { pos.push(xs[a], heights[a][b], zs[b]); cx += xs[a] / 3; cy += heights[a][b] / 3; cz += zs[b] / 3; }
      paint(cx, cy, cz);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}

/** A flat lawn with visible stone sides: its own retaining wall. */
function plate(points: P2[], y: number, depth: number) {
  const shape = new THREE.Shape(points.map(([x, z]) => new THREE.Vector2(x, -z)));
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  g.rotateX(-Math.PI / 2);
  g.translate(0, y - depth, 0);
  return g;
}

const wave = (base: number, z: number, amp = 1.1) => base + amp * Math.sin(z / 17 + base);
const edgeLine = (base: number, n = 12): P2[] => Array.from({ length: n + 1 }, (_, i) => { const z = NORTH + ((SOUTH - NORTH) * i) / n; return [wave(base, z), z]; });

type Span = { a: P2; b: P2; y0: number; y1: number; w: number };

export function buildSurroundings(phone: boolean, tables: { id: string; zone: string; p: [number, number, number] }[], topAt: (x: number, z: number) => number) {
  const group = new THREE.Group();
  group.name = 'Contesto';
  let seed = 41;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const flat = (color: string) => new THREE.MeshLambertMaterial({ color, flatShading: true });
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material | THREE.Material[]) => { const m = new THREE.Mesh(geo, mat); group.add(m); return m; };

  add(buildGround(phone ? 3.5 : 2), new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));

  // --- Terraces. Stone sides, lawn getting lighter towards the sea
  const stone = flat('#cfc9b8');
  const lawn = (c: string) => [flat(c), stone];
  const reversed = (l: P2[]) => [...l].reverse();
  add(plate([[15.2, NORTH], ...edgeLine(EDGE_1), [25, SOUTH], [25.2, 67.2], [22.2, 24], [12.6, 20.4], [16.7, -23]], T1, 4), lawn('#46603a'));
  add(plate([...reversed(edgeLine(EDGE_2)), ...edgeLine(EDGE_1)], T2, 4), lawn('#587243'));
  add(plate([...reversed(edgeLine(EDGE_3, 12)), ...edgeLine(EDGE_2)], T3, 7), lawn('#74894f'));

  // --- Hedges. Box core plus clumps on top so it reads as a plant, not a wall
  const spans: Span[] = [];
  const line = (pts: P2[], y0: number, y1: number, w: number) => { for (let i = 1; i < pts.length; i++) spans.push({ a: pts[i - 1], b: pts[i], y0, y1, w }); };
  // Clean line between the Riva Deck side and the house lawn, closing the step between the two levels
  line([[-9.2, 19.25], [22.1, 23.85]], 0.1, 1.45, 0.85);
  // Sea side, one on every drop
  line([[16.9, -23], [12.9, 20.4]], T1, 0.75, 0.9);
  line([[12.9, 20.4], [22.5, 24], [25.5, 67.2], [25.5, SOUTH]], T1, 1.15, 0.9);
  line(edgeLine(EDGE_1), T2, T1 + 1, 0.9);
  line(edgeLine(EDGE_2), T3, T2 + 1, 0.9);
  // Perimeter: road side and both flanks, stepping down with the terraces
  line([[-23.9, -0.9], [-23.6, -20], [15.6, NORTH]], -1.5, 3.1, 1.3);
  line([[15.6, NORTH], [wave(EDGE_1, NORTH), NORTH]], -5, T1 + 2.3, 1.3);
  line([[wave(EDGE_1, NORTH), NORTH], [wave(EDGE_2, NORTH), NORTH]], -5, T2 + 2.3, 1.3);
  line([[wave(EDGE_2, NORTH), NORTH], [47, NORTH]], -8, T3 + 2.3, 1.3);
  line([[-24.4, 3.5], [-28.2, 17], [-36.2, 17.3], [-36.2, 72], [25.5, 72]], -1.5, 3.1, 1.3);
  line([[25.5, SOUTH], [wave(EDGE_1, SOUTH), SOUTH]], -5, T1 + 2.3, 1.3);
  line([[wave(EDGE_1, SOUTH), SOUTH], [wave(EDGE_2, SOUTH), SOUTH]], -5, T2 + 2.3, 1.3);
  line([[wave(EDGE_2, SOUTH), SOUTH], [47, SOUTH]], -8, T3 + 2.3, 1.3);

  const dummy = new THREE.Object3D(); const tint = new THREE.Color();
  const hedgeShades = ['#2c4227', '#34492c', '#3b5230'];
  const box = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial(), spans.length);
  const clumpSpacing = phone ? 2.6 : 1.5;
  const totalClumps = spans.reduce((n, s) => n + Math.ceil(Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1]) / clumpSpacing), 0);
  const clumps = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshLambertMaterial({ flatShading: true }), totalClumps);
  let ci = 0;
  spans.forEach((s, i) => {
    const dx = s.b[0] - s.a[0]; const dz = s.b[1] - s.a[1]; const len = Math.hypot(dx, dz);
    dummy.position.set((s.a[0] + s.b[0]) / 2, (s.y0 + s.y1) / 2, (s.a[1] + s.b[1]) / 2);
    dummy.rotation.set(0, -Math.atan2(dz, dx), 0);
    dummy.scale.set(len + s.w * 0.4, s.y1 - s.y0, s.w);
    dummy.updateMatrix();
    box.setMatrixAt(i, dummy.matrix);
    box.setColorAt(i, tint.set(hedgeShades[i % 3]));
    const n = Math.ceil(len / clumpSpacing);
    for (let k = 0; k < n; k++) {
      const t = (k + 0.5) / n;
      dummy.position.set(s.a[0] + dx * t + (rnd() - 0.5) * 0.3, s.y1 - 0.05 + rnd() * 0.12, s.a[1] + dz * t + (rnd() - 0.5) * 0.3);
      dummy.rotation.set(rnd() * 3, rnd() * 3, 0);
      const r = s.w * (0.5 + rnd() * 0.18) * (phone ? 1.3 : 1);
      dummy.scale.set(r, r * 0.62, r);
      dummy.updateMatrix();
      clumps.setMatrixAt(ci, dummy.matrix);
      clumps.setColorAt(ci, tint.set(hedgeShades[Math.floor(rnd() * 3)]));
      ci++;
    }
  });
  group.add(box, clumps);

  // --- Isola di Dino: smooth, rock low down and green on top, out to the right when facing the sea
  const island = (() => {
    const RINGS = 22; const SEG = 72;
    const LEN = 118; const WID = 56; const H = 34;
    const pos: number[] = []; const col: number[] = []; const idx: number[] = [];
    const rock = new THREE.Color('#a4977c'); const rockDark = new THREE.Color('#857a63'); const green = new THREE.Color('#566d42'); const greenB = new THREE.Color('#6d8350');
    const c = new THREE.Color();
    for (let r = 0; r <= RINGS; r++) {
      const t = r / RINGS;
      for (let a = 0; a < SEG; a++) {
        const th = (a / SEG) * Math.PI * 2;
        const wob = 1 + 0.1 * Math.sin(th * 3 + 0.6) + 0.07 * Math.sin(th * 7 + 2) + 0.03 * Math.sin(th * 17);
        const rad = (1 - t) * wob;
        // Sheer cliff for the first rings, then a rounded green back
        const px = Math.cos(th) * LEN * rad; const pz = Math.sin(th) * WID * rad;
        // Sheer cliff first, then a gently domed green back
        const prof = t < 0.18 ? (t / 0.18) ** 0.7 * 0.62 : 0.62 + 0.38 * Math.sin(((t - 0.18) / 0.82) * Math.PI * 0.5);
        const y = -10.3 + prof * H + noise(px * 0.09, pz * 0.09) * (t < 0.18 ? 0.8 : 1.6);
        pos.push(px, y, pz);
        c.copy(rock).lerp(rockDark, 0.5 + 0.3 * noise(px * 0.2, y * 0.8));
        const top = smooth(0.15, 0.23, t + 0.015 * noise(px * 0.15, pz * 0.15));
        c.lerp(green, top).lerp(greenB, top * (0.5 + 0.35 * noise(px * 0.07, pz * 0.11)));
        col.push(c.r, c.g, c.b);
      }
    }
    for (let r = 0; r < RINGS; r++) for (let a = 0; a < SEG; a++) {
      const n = (a + 1) % SEG; const A = r * SEG + a; const B = r * SEG + n; const C = (r + 1) * SEG + a; const D = (r + 1) * SEG + n;
      idx.push(A, C, B, B, C, D);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx); g.computeVertexNormals();
    return g;
  })();
  const dino = add(island, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide, fog: false }));
  dino.position.set(540, 0, 40); dino.rotation.y = Math.PI / 2 - 0.22; // shows its long side to the club

  // Sea all the way to the horizon, under the model's own sea
  const seaMaterial = new THREE.MeshStandardMaterial({ roughness: 0.75, metalness: 0, fog: false });
  const seaFar = new THREE.CircleGeometry(2500, 48); seaFar.rotateX(-Math.PI / 2); seaFar.translate(0, -10.32, 0);
  add(seaFar, seaMaterial);

  // --- Wood deck around every white block, stone path to the bathroom's front door
  const DECK_Y = 0.83;
  const blocks: [number, number, number, number][] = [[-26.14, -21.94, 15.67, 22.17], [8.45, 10.15, 22.45, 24.35], [-29.4, -27.6, 33.4, 40.8]];
  const planks: [number, number, number, number][] = [];
  const deckRing = (x0: number, x1: number, z0: number, z1: number, w: number, north = true) => {
    const P = 0.34;
    for (let x = x0 - w; x < x1 + w; x += P) for (const [a, b] of north ? [[z0 - w, z0], [z1, z1 + w]] : [[z1, z1 + w]]) planks.push([x + P / 2, (a + b) / 2, P - 0.03, b - a]);
    for (let z = z0; z < z1; z += P) for (const [a, b] of [[x0 - w, x0], [x1, x1 + w]]) planks.push([(a + b) / 2, z + P / 2, b - a, P - 0.03]);
  };
  // The small block backs onto the hedge, so no deck on that side
  blocks.forEach(([x0, x1, z0, z1], i) => deckRing(x0, x1, z0, z1, 1.1, i !== 1));
  const deck = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial(), planks.length);
  planks.forEach(([x, z, w, d], i) => {
    dummy.rotation.set(0, 0, 0); dummy.position.set(x, DECK_Y, z); dummy.scale.set(w, 0.06, d); dummy.updateMatrix(); deck.setMatrixAt(i, dummy.matrix);
    deck.setColorAt(i, tint.set(['#8f6a48', '#9a7350', '#856243'][i % 3]));
  });
  group.add(deck);
  const stonePts: P2[] = [];
  const A: P2 = [-15.5, 21.9]; const B: P2 = [-20.6, 19];
  const steps = Math.ceil(Math.hypot(B[0] - A[0], B[1] - A[1]) / 0.43);
  const nx = -(B[1] - A[1]); const nz = B[0] - A[0]; const nl = Math.hypot(nx, nz);
  for (let i = 0; i <= steps; i++) for (const side of [-1, 1]) stonePts.push([lerp(A[0], B[0], i / steps) + (nx / nl) * side * 0.25, lerp(A[1], B[1], i / steps) + (nz / nl) * side * 0.25]);
  const stones = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.21, 0.21, 0.055, 8), new THREE.MeshLambertMaterial({ color: '#888c7e' }), stonePts.length);
  stonePts.forEach(([x, z], i) => { dummy.position.set(x, 0.82, z); dummy.rotation.set(0, i * 0.6, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); stones.setMatrixAt(i, dummy.matrix); });
  group.add(stones);

  // --- The lawn between the bar and the bathrooms: two loungers, a low table, planted pots
  const white = new THREE.MeshLambertMaterial({ color: '#ece9df' });
  const wood = new THREE.MeshLambertMaterial({ color: '#8a6749' });
  const loungerParts: THREE.BufferGeometry[] = []; const loungerWood: THREE.BufferGeometry[] = [];
  for (const [x, z, yaw] of [[-13.2, 16.6, 0.5], [-15.1, 16.3, 0.5], [-17.6, 16.9, -0.4]]) {
    const m = new THREE.Matrix4().compose(new THREE.Vector3(x, 0.8, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0)), new THREE.Vector3(1, 1, 1));
    const part = (list: THREE.BufferGeometry[], w: number, h: number, d: number, px: number, py: number, pz: number, tilt = 0) => {
      const g = new THREE.BoxGeometry(w, h, d); if (tilt) g.rotateX(tilt); g.translate(px, py, pz); g.applyMatrix4(m); list.push(g);
    };
    part(loungerWood, 0.74, 0.07, 1.5, 0, 0.26, 0.28); part(loungerWood, 0.74, 0.07, 0.72, 0, 0.5, -0.74, 0.62);
    for (const lx of [-0.32, 0.32]) for (const lz of [-0.3, 0.9]) part(loungerWood, 0.06, 0.26, 0.06, lx, 0.13, lz);
    part(loungerParts, 0.68, 0.09, 1.42, 0, 0.34, 0.28); part(loungerParts, 0.68, 0.09, 0.68, 0, 0.58, -0.72, 0.62);
  }
  add(mergeGeometries(loungerParts), white); add(mergeGeometries(loungerWood), wood);
  const tableTop = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 14); tableTop.translate(-14.2, 1.26, 18.1);
  const tableLeg = new THREE.CylinderGeometry(0.03, 0.05, 0.42, 6); tableLeg.translate(-14.2, 1.03, 18.1);
  add(mergeGeometries([tableTop, tableLeg]), white);
  // Pots: terracotta, a clipped shrub, a few flowers
  const potSpots: [number, number, number][] = [[-11.2, 16.2, 1], [-11.4, 18.6, 0.8], [-19.6, 15.6, 1.1], [-20.6, 22.2, 0.8], [7.2, 22.3, 0.9], [11.4, 25.1, 0.9], [-19.4, 18.1, 0.75]];
  const pots = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.34, 0.24, 0.5, 12), new THREE.MeshLambertMaterial({ color: '#b5714f' }), potSpots.length);
  const shrubs = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshLambertMaterial({ color: '#46613a', flatShading: true }), potSpots.length);
  const flowers = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshLambertMaterial({ color: '#b05a98' }), potSpots.length * 4);
  potSpots.forEach(([x, z, r], i) => {
    dummy.rotation.set(0, 0, 0); dummy.position.set(x, 1.05, z); dummy.scale.setScalar(r); dummy.updateMatrix(); pots.setMatrixAt(i, dummy.matrix);
    dummy.position.set(x, 1.3 + r * 0.45, z); dummy.scale.set(r * 0.62, r * 0.6, r * 0.62); dummy.updateMatrix(); shrubs.setMatrixAt(i, dummy.matrix);
    for (let k = 0; k < 4; k++) { const a = k * 1.7 + i; dummy.position.set(x + Math.cos(a) * r * 0.5, 1.5 + r * 0.45 + (k % 2) * 0.12, z + Math.sin(a) * r * 0.5); dummy.scale.setScalar(0.08); dummy.updateMatrix(); flowers.setMatrixAt(i * 4 + k, dummy.matrix); }
  });
  group.add(pots, shrubs, flowers);

  // --- Road and the access apron up to the gate
  const roadPos: number[] = [];
  const HALF = 3;
  const samples = ROAD_POINTS;
  for (let i = 0; i < samples.length - 1; i++) {
    const a = samples[i]; const b = samples[i + 1];
    const dir = new THREE.Vector3().subVectors(b, a).normalize();
    const nx = -dir.z * HALF; const nz = dir.x * HALF;
    const ya = roadHeight(a.x, a.z); const yb = roadHeight(b.x, b.z);
    roadPos.push(a.x + nx, ya, a.z + nz, a.x - nx, ya, a.z - nz, b.x + nx, yb, b.z + nz, b.x + nx, yb, b.z + nz, a.x - nx, ya, a.z - nz, b.x - nx, yb, b.z - nz);
  }
  const road = new THREE.BufferGeometry();
  road.setAttribute('position', new THREE.Float32BufferAttribute(roadPos, 3));
  road.computeVertexNormals();
  const roadMat = new THREE.MeshLambertMaterial({ color: '#4c4d50', side: THREE.DoubleSide });
  add(road, roadMat);
  const apron = new THREE.PlaneGeometry(3.4, 6.2);
  apron.rotateX(-Math.PI / 2);
  apron.rotateY(0.18);
  apron.translate(-27.4, ROAD_Y + 0.02, 0.1);
  add(apron, new THREE.MeshLambertMaterial({ color: '#8f8c84' }));

  // --- The gate: white, big and standing open, right where grey becomes white
  const gateParts: THREE.BufferGeometry[] = [];
  const bar = (w: number, h: number, d: number, m: THREE.Matrix4, x: number, y: number, z: number) => {
    const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); g.applyMatrix4(m); gateParts.push(g);
  };
  const gateDir = new THREE.Vector2(GATE_B[0] - GATE_A[0], GATE_B[1] - GATE_A[1]);
  const gateWidth = gateDir.length();
  const yaw = -Math.atan2(gateDir.y, gateDir.x);
  const GY = 0.8;
  for (const [side, post] of [[1, GATE_A], [-1, GATE_B]] as [number, P2][]) {
    const m = new THREE.Matrix4().compose(new THREE.Vector3(post[0], GY, post[1]), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0)), new THREE.Vector3(1, 1, 1));
    bar(0.62, 3.1, 0.62, m, -side * 0.31, 1.55, 0);  // pier
    bar(0.8, 0.14, 0.8, m, -side * 0.31, 3.17, 0);   // cap
    // Leaf swung inwards, towards the club: fully open
    const leafLen = gateWidth / 2 + 0.35;
    const hinge = new THREE.Matrix4().multiplyMatrices(m, new THREE.Matrix4().makeRotationY(side * 1.42));
    const sgn = side;
    for (const y of [0.32, 2.05]) bar(leafLen, 0.1, 0.07, hinge, sgn * leafLen / 2, y, 0);
    const bars = Math.round(leafLen / 0.2);
    for (let k = 0; k <= bars; k++) {
      const x = sgn * (k / bars) * leafLen;
      bar(0.045, 2.2 + 0.32 * Math.sin((k / bars) * Math.PI / 2), 0.045, hinge, x, 1.1 + 0.16 * Math.sin((k / bars) * Math.PI / 2), 0);
    }
    bar(0.09, 2.6, 0.09, hinge, sgn * leafLen, 1.28, 0);
    bar(0.09, 2.5, 0.09, hinge, 0, 1.25, 0);
  }
  add(mergeGeometries(gateParts), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.5 }));

  // --- Neighbourhood
  const houses = phone ? 90 : 190;
  const bodies = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ flatShading: true }), houses);
  const roofGeo = new THREE.ConeGeometry(0.72, 1, 4); roofGeo.rotateY(Math.PI / 4);
  const roofs = new THREE.InstancedMesh(roofGeo, new THREE.MeshLambertMaterial({ flatShading: true }), houses);
  const windowMat = new THREE.MeshStandardMaterial({ color: '#2a241c', emissive: '#ffc27a', emissiveIntensity: 1 });
  const windows = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), windowMat, houses * 2);
  const walls = ['#d9d5c9', '#cfcabc', '#e0dcd0', '#c7c1b0'];
  const roofColors = ['#b0694a', '#a55f43', '#bb7552', '#9c5a40'];
  let placed = 0; let wi = 0; let guard = 0;
  while (placed < houses && guard++ < 9000) {
    const far = rnd() > 0.72;
    const x = far ? lerp(-420, 30, rnd()) : lerp(-150, 34, rnd());
    const z = far ? lerp(-620, 620, rnd()) : lerp(-230, 270, rnd());
    if (x > coast(z) - 14) continue;
    if (x > -62 && z > NORTH - 14 && z < SOUTH + 14) continue;
    if (x > -38 && z > NORTH - 14 && z < 76) continue;
    const rd = roadDistance(x, z);
    if (rd < 9 || (rd > 70 && rnd() > 0.45)) continue;
    const base = ground(x, z);
    if (base > 42) continue;
    const w = 7 + rnd() * 7; const d = 6 + rnd() * 6; const h = 3.1 + rnd() * 3.4;
    const rot = Math.round(rnd() * 3) * (Math.PI / 2) + (rnd() - 0.5) * 0.5;
    dummy.position.set(x, base + h / 2 - 0.3, z); dummy.rotation.set(0, rot, 0); dummy.scale.set(w, h + 0.6, d); dummy.updateMatrix();
    bodies.setMatrixAt(placed, dummy.matrix); bodies.setColorAt(placed, tint.set(walls[Math.floor(rnd() * 4)]));
    const flatRoof = rnd() > 0.93;
    dummy.position.y = base + h + (flatRoof ? 0.1 : 0.72); dummy.scale.set(flatRoof ? w * 0.01 : w * 1.05, flatRoof ? 0.01 : 1.5, flatRoof ? d * 0.01 : d * 1.05); dummy.updateMatrix();
    roofs.setMatrixAt(placed, dummy.matrix); roofs.setColorAt(placed, tint.set(roofColors[Math.floor(rnd() * 4)]));
    for (const off of [-0.22, 0.22]) {
      const q = new THREE.Vector3(w * off, 0, d / 2 + 0.02).applyAxisAngle(new THREE.Vector3(0, 1, 0), rot);
      dummy.position.set(x + q.x, base + h * 0.52, z + q.z); dummy.scale.set(1.1, 1.3, 0.05); dummy.updateMatrix();
      windows.setMatrixAt(wi++, rnd() > 0.32 ? dummy.matrix : new THREE.Matrix4().makeScale(0, 0, 0));
    }
    placed++;
  }
  bodies.count = placed; roofs.count = placed; windows.count = wi;
  group.add(bodies, roofs, windows);

  // --- Trees, kept away from the club
  const trees = phone ? 110 : 280;
  const crowns = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshLambertMaterial({ flatShading: true }), trees);
  const shades = ['#2d4228', '#35492b', '#415431', '#2a3d2a'];
  let t = 0; guard = 0;
  while (t < trees && guard++ < 9000) {
    // A good third thick around the property, as the green macchia seen from above
    const close = rnd() < 0.38;
    const x = close ? lerp(-10, 50, rnd()) : lerp(-420, 48, rnd()); const z = close ? lerp(-170, 230, rnd()) : lerp(-620, 620, rnd());
    if (x > coast(z) - 5 || roadDistance(x, z) < 6) continue;
    if (x > -46 && z > NORTH - 4 && z < SOUTH + 4) continue;
    const base = ground(x, z); const r = 2 + rnd() * 3;
    dummy.position.set(x, base + r * 0.9, z); dummy.rotation.set(rnd(), rnd() * 3, 0); dummy.scale.set(r, r * (0.9 + rnd() * 0.4), r); dummy.updateMatrix();
    crowns.setMatrixAt(t, dummy.matrix); crowns.setColorAt(t, tint.set(shades[Math.floor(rnd() * 4)]));
    t++;
  }
  crowns.count = t;
  group.add(crowns);

  // A few trees on the terraces, for depth
  const terraceTrees: [number, number, number, number][] = [[34, -18, T2, 3.2], [35, 12, T2, 2.6], [33, 44, T2, 3.4], [43, -28, T3, 2.4], [42, 2, T3, 3], [44, 30, T3, 2.5], [43, 60, T3, 3.1], [27, 50, T1, 2.2]];
  const tt = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshLambertMaterial({ color: '#3a5230', flatShading: true }), terraceTrees.length);
  const trunkGeo = new THREE.CylinderGeometry(0.1, 0.16, 1, 5);
  const trunks = new THREE.InstancedMesh(trunkGeo, new THREE.MeshLambertMaterial({ color: '#6f5b45' }), terraceTrees.length);
  terraceTrees.forEach(([x, z, y, r], i) => {
    dummy.rotation.set(0, i, 0);
    dummy.position.set(x, y + r * 1.25, z); dummy.scale.set(r, r * 0.8, r); dummy.updateMatrix(); tt.setMatrixAt(i, dummy.matrix);
    dummy.position.set(x, y + r * 0.45, z); dummy.scale.set(1, r * 0.9, 1); dummy.updateMatrix(); trunks.setMatrixAt(i, dummy.matrix);
  });
  group.add(tt, trunks);

  // --- Boulders at the foot of the cliff
  const nRocks = phone ? 30 : 70;
  const rocks = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshLambertMaterial({ flatShading: true }), nRocks);
  for (let i = 0; i < nRocks; i++) {
    const z = lerp(-420, 420, rnd()); const x = coast(z) + rnd() * 5; const r = 0.5 + rnd() * rnd() * 1.4;
    dummy.position.set(x, terrain(x, z) - r * 0.2, z); dummy.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3); dummy.scale.set(r, r * 0.5, r); dummy.updateMatrix();
    rocks.setMatrixAt(i, dummy.matrix); rocks.setColorAt(i, tint.set(rnd() > 0.5 ? '#4f483d' : '#423c33'));
  }
  group.add(rocks);

  // --- Street lamps
  const lampPoints = ROAD_LINE.getSpacedPoints(phone ? 34 : 60).filter((p) => Math.abs(p.z) < 300);
  const lampMat = new THREE.MeshStandardMaterial({ color: '#ffe2b0', emissive: '#ffbd70', emissiveIntensity: 1 });
  const lamps = new THREE.InstancedMesh(new THREE.SphereGeometry(0.2, 6, 5), lampMat, lampPoints.length);
  const poles = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.05, 0.07, 1, 5), new THREE.MeshLambertMaterial({ color: '#2c2c2e' }), lampPoints.length);
  lampPoints.forEach((p, i) => {
    const y = roadHeight(p.x, p.z);
    dummy.rotation.set(0, 0, 0);
    dummy.position.set(p.x - 3.6, y + 4.4, p.z); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); lamps.setMatrixAt(i, dummy.matrix);
    dummy.position.set(p.x - 3.6, y + 2.2, p.z); dummy.scale.set(1, 4.4, 1); dummy.updateMatrix(); poles.setMatrixAt(i, dummy.matrix);
  });
  group.add(lamps, poles);

  // --- Night lights on the outer seats: a lit lantern on each table, low garden lamps along the row
  const glowMat = new THREE.MeshStandardMaterial({ color: '#ffe0ad', emissive: '#ffb765', emissiveIntensity: 1 });
  const outer = tables.filter((t) => t.zone === 'prato-back' || /^SV(6|7|8|9|10|11)$/.test(t.id));
  const glow = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), glowMat, outer.length * 2);
  const stems = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.03, 0.04, 1, 5), new THREE.MeshLambertMaterial({ color: '#2c2c2e' }), outer.length);
  outer.forEach((t, i) => {
    const [x, y, z] = t.p;
    dummy.rotation.set(0, 0, 0);
    dummy.position.set(x, y + 0.12, z); dummy.scale.setScalar(0.07); dummy.updateMatrix(); glow.setMatrixAt(i * 2, dummy.matrix);
    const ground = y - 0.75;
    dummy.position.set(x + 1.15, ground + 1.05, z + 0.6); dummy.scale.setScalar(0.09); dummy.updateMatrix(); glow.setMatrixAt(i * 2 + 1, dummy.matrix);
    dummy.position.set(x + 1.15, ground + 0.5, z + 0.6); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); stems.setMatrixAt(i, dummy.matrix);
  });
  group.add(glow, stems);

  // --- Table lamp on the main bar, on the corner towards the console
  const LAMP: P2 = [-6.55, 13.15];
  const barTop = topAt(LAMP[0], LAMP[1]);
  const lampParts: THREE.BufferGeometry[] = [];
  const foot = new THREE.CylinderGeometry(0.09, 0.11, 0.04, 12); foot.translate(LAMP[0], barTop + 0.02, LAMP[1]); lampParts.push(foot);
  const stem = new THREE.CylinderGeometry(0.014, 0.014, 0.42, 6); stem.translate(LAMP[0], barTop + 0.25, LAMP[1]); lampParts.push(stem);
  add(mergeGeometries(lampParts), new THREE.MeshStandardMaterial({ color: '#2a2622', roughness: 0.4 }));
  const shadeGeo = new THREE.CylinderGeometry(0.11, 0.21, 0.26, 16, 1, true); shadeGeo.translate(LAMP[0], barTop + 0.56, LAMP[1]);
  const shadeMat = new THREE.MeshStandardMaterial({ color: '#fff0d6', emissive: '#ffb765', emissiveIntensity: 1, side: THREE.DoubleSide });
  add(shadeGeo, shadeMat);

  // Real light only where it shows: the row and the bar lamp. Phones keep the glow without the extra lights.
  const pools: THREE.PointLight[] = [];
  if (!phone) {
    const row = tables.filter((t) => t.zone === 'prato-back');
    const mid = row[Math.floor(row.length / 2)]?.p ?? [12, 1, -15];
    for (const [x, y, z, power] of [[mid[0] + 1, mid[1] + 1.4, mid[2] - 5, 16], [mid[0] + 1, mid[1] + 1.4, mid[2] + 5, 16], [LAMP[0], barTop + 0.5, LAMP[1], 5]]) {
      const l = new THREE.PointLight('#ffb36b', power, 12, 1.8); l.position.set(x, y, z); l.userData.power = power; pools.push(l); group.add(l);
    }
  }

  return {
    group,
    seaMaterial,
    setMood(mood: Mood) {
      windowMat.emissiveIntensity = mood === 'night' ? 1.1 : 0.12;
      lampMat.emissiveIntensity = mood === 'night' ? 2.4 : 0.3;
      glowMat.emissiveIntensity = mood === 'night' ? 3 : 0.35;
      shadeMat.emissiveIntensity = mood === 'night' ? 1.6 : 0.3;
      pools.forEach((l) => { l.intensity = mood === 'night' ? l.userData.power : 0; });
    },
  };
}
