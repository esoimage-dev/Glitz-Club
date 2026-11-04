import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import tablesData from './tables.json';
import type { ZoneId } from './data';

export type Mood = 'night' | 'sunset';
export type Shot = { pos: [number, number, number]; target: [number, number, number] };
export type TableInfo = { id: string; zone: ZoneId; p: [number, number, number] };
export const TABLES = tablesData as TableInfo[];

export const SHOTS: Record<'overview' | 'arch' | 'sea' | ZoneId, Shot> = {
  overview: { pos: [-46, 40, 44], target: [2, 0, -2] },
  sea: { pos: [-30, 17, 25], target: [40, 0, -30] },
  arch: { pos: [-14, 7, 13], target: [-6, 3, -13] },
  back: { pos: [-14, 8.5, 11], target: [-3, 2, -11] },
  riva: { pos: [-13, 13, 21], target: [4, 1.5, 6] },
  glitzbar: { pos: [-5, 11, 3], target: [-16, 1, -10] },
  'prato-back': { pos: [1, 9, -7], target: [14, 0, -18] },
  seaview: { pos: [-4, 9, 16], target: [12, 0, 6] },
};

const SKY: Record<Mood, [string, string, string, string]> = {
  night: ['#01010a', '#080824', '#1a1140', '#34184f'],
  sunset: ['#2b2a5e', '#8a4c88', '#ef8a62', '#ffd2a0'],
};

const LED = [new THREE.Color('#5a5cf7'), new THREE.Color('#d41fd0'), new THREE.Color('#ff8a2a')];
const ledAt = (t: number) => (t < 0.55 ? LED[0].clone().lerp(LED[1], t / 0.55) : LED[1].clone().lerp(LED[2], (t - 0.55) / 0.45));

const isPhone = () => innerWidth < 860;

function skyTexture(mood: Mood) {
  const c = document.createElement('canvas');
  c.width = 4; c.height = 512;
  const g = c.getContext('2d')!;
  const grd = g.createLinearGradient(0, 0, 0, 512);
  const s = SKY[mood];
  grd.addColorStop(0, s[0]); grd.addColorStop(0.35, s[1]); grd.addColorStop(0.62, s[2]); grd.addColorStop(0.78, s[3]); grd.addColorStop(1, s[3]);
  g.fillStyle = grd; g.fillRect(0, 0, 4, 512);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** The friend's model, relit: renders on demand so an idle page costs nothing. */
export class ClubScene {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  composer: EffectComposer | null = null;
  ready = false;
  private needs = true;
  private raf = 0;
  private fly: { t0: number; dur: number; p0: THREE.Vector3; p1: THREE.Vector3; t0v: THREE.Vector3; t1v: THREE.Vector3 } | null = null;
  private tableMeshes = new Map<string, THREE.Mesh[]>();
  private lights: { hemi: THREE.HemisphereLight; sun: THREE.DirectionalLight; floor: THREE.PointLight[]; strips: THREE.PointLight[] };
  private selected: string | null = null;
  private zoneLit: ZoneId | null = null;
  private soldOut = new Set<string>();
  private seaMats = new Set<THREE.MeshStandardMaterial>();
  onFrame?: () => void;
  mood: Mood = 'night';

  constructor(private canvas: HTMLCanvasElement, opts: { interactive?: boolean } = {}) {
    const low = isPhone() || (navigator.hardwareConcurrency || 8) <= 4;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: false });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.5, 2600);
    this.controls = new OrbitControls(this.camera, canvas);
    Object.assign(this.controls, { enableDamping: true, dampingFactor: 0.08, minDistance: 14, maxDistance: 130, maxPolarAngle: 1.42, enabled: !!opts.interactive, zoomToCursor: true });
    this.controls.addEventListener('change', () => { this.needs = true; });
    // OrbitControls sets touch-action:none on connect, even disabled: that alone kills page scroll on phones.
    if (!opts.interactive) this.controls.disconnect();
    canvas.addEventListener('webglcontextlost', this.onContextLost);
    canvas.addEventListener('webglcontextrestored', this.onContextRestored);

    const hemi = new THREE.HemisphereLight('#7a78d8', '#0a0a18', 1.1);
    const sun = new THREE.DirectionalLight('#a9b4ff', 0.6);
    sun.position.set(90, 60, -60);
    const floor = [[-5, 3.4, -3], [3, 3.4, -5], [-2, 3.4, 3]].map(([x, y, z], i) => {
      const l = new THREE.PointLight(i === 1 ? '#ff2fd0' : '#c81be0', 26, 11, 1.6);
      l.position.set(x, y, z); return l;
    });
    const strips = [[-14, 3.2, -14], [6, 3, 16]].map(([x, y, z]) => {
      const l = new THREE.PointLight('#ffb066', 40, 16, 1.8);
      l.position.set(x, y, z); return l;
    });
    this.lights = { hemi, sun, floor, strips };
    this.scene.add(hemi, sun, ...floor, ...strips);

    if (!low) {
      this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
      // Bloom bypasses canvas antialiasing, so the render target does its own.
      this.composer = new EffectComposer(this.renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 }));
      this.composer.addPass(new RenderPass(this.scene, this.camera));
      this.composer.addPass(new UnrealBloomPass(new THREE.Vector2(512, 512), 0.42, 0.55, 0.96));
      this.composer.addPass(new OutputPass());
    }
    this.setMood('night');
    this.setShot(SHOTS.overview);
    this.resize();
    const ro = new ResizeObserver(() => this.resize());
    ro.observe(canvas);
    this.ro = ro;
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);
  }
  private ro: ResizeObserver;
  /** Called when the phone reclaims the GPU: the page falls back to the photo instead of a black flash. */
  onContextChange?: (alive: boolean) => void;
  private onContextLost = (e: Event) => { e.preventDefault(); this.onContextChange?.(false); };
  private onContextRestored = () => { this.needs = true; this.onContextChange?.(true); };
  private size = '';
  private frames: number[] = [];
  private lastRender = 0;
  private path: { pos: THREE.CatmullRomCurve3; target: THREE.CatmullRomCurve3; length: number } | null = null;
  private pathGoal = 0;
  private pathNow: number | null = null;
  private lastLoop = 0;

  async load(url = `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/models/${isPhone() ? 'glitz-mobile' : 'glitz'}.glb`) {
    const loader = new GLTFLoader();
    MeshoptDecoder.useWorkers?.(2);
    loader.setMeshoptDecoder(MeshoptDecoder);
    const gltf = await loader.loadAsync(url);
    this.scene.add(gltf.scene);
    gltf.scene.updateMatrixWorld(true);

    const arch = new THREE.Box3();
    const ledMats: { m: THREE.MeshStandardMaterial; x: number }[] = [];
    gltf.scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      let parent: THREE.Object3D | null = mesh;
      while (parent) {
        const match = parent.name?.match(/^TABLE_([A-Z]+\d+)/);
        if (match) { const arr = this.tableMeshes.get(match[1]) ?? []; arr.push(mesh); this.tableMeshes.set(match[1], arr); break; }
        parent = parent.parent;
      }
      const m = mesh.material as THREE.MeshStandardMaterial;
      if (!m?.emissive) return;
      const size = new THREE.Box3().setFromObject(mesh).getSize(new THREE.Vector3());
      if (size.x > 500 && size.z > 500 && size.y < 2) { this.seaMats.add(m); return; }
      const isArchLed = m.emissiveIntensity > 0.2 && m.emissive.b > 0.8 && m.emissive.r < 0.7 && m.emissive.g < 0.5;
      if (isArchLed) {
        const box = new THREE.Box3().setFromObject(mesh);
        arch.union(box);
        ledMats.push({ m, x: box.getCenter(new THREE.Vector3()).x + box.getCenter(new THREE.Vector3()).z });
      }
    });
    // Repaint the arch with the real LED sweep seen in the photos: violet, magenta, orange.
    if (ledMats.length) {
      const xs = ledMats.map((l) => l.x);
      const [a, b] = [Math.min(...xs), Math.max(...xs)];
      const seen = new Set<THREE.Material>();
      ledMats.forEach(({ m, x }) => {
        if (seen.has(m)) return; seen.add(m);
        const c = ledAt((x - a) / (b - a || 1));
        m.color.copy(c); m.emissive.copy(c); m.emissiveIntensity = 4.5;
      });
    }
    this.paintSea();
    this.applyTableStates();
    // Shaders and geometry go to the GPU now, off screen, not on the frame the section scrolls into view.
    await this.renderer.compileAsync(this.scene, this.camera);
    this.draw();
    this.ready = true;
  }

  setMood(mood: Mood) {
    this.mood = mood;
    (this.scene.background as THREE.Texture | null)?.dispose?.();
    this.scene.background = skyTexture(mood);
    const night = mood === 'night';
    this.scene.fog = new THREE.Fog(night ? '#0d0a2a' : '#ef9a74', 140, 760);
    this.renderer.toneMappingExposure = night ? 1.1 : 0.95;
    const { hemi, sun, floor, strips } = this.lights;
    hemi.color.set(night ? '#a9b2ee' : '#f6e8ee'); hemi.groundColor.set(night ? '#14142c' : '#5a4a68'); hemi.intensity = night ? 1.25 : 1.5;
    sun.color.set(night ? '#a9b4ff' : '#ffc08f'); sun.intensity = night ? 0.35 : 1.5;
    this.paintSea();
    floor.forEach((l) => { l.intensity = night ? 26 : 5; });
    strips.forEach((l) => { l.intensity = night ? 14 : 4; });
    this.needs = true;
  }

  private paintSea() {
    this.seaMats.forEach((m) => {
      m.metalness = 0; m.roughness = 0.75;
      m.color.set(this.mood === 'night' ? '#070a26' : '#c7695f');
    });
  }

  setTableStates(soldOut: Iterable<string>) { this.soldOut = new Set(soldOut); this.applyTableStates(); }

  highlight(zone: ZoneId | null, table: string | null) {
    this.zoneLit = zone; this.selected = table; this.applyTableStates();
  }

  private applyTableStates() {
    this.tableMeshes.forEach((meshes, id) => {
      const info = TABLES.find((t) => t.id === id);
      const isSel = this.selected === id;
      const inZone = !!this.zoneLit && info?.zone === this.zoneLit && !this.soldOut.has(id);
      meshes.forEach((mesh) => {
        const ud = mesh.userData as { base?: THREE.Material; lit?: THREE.MeshStandardMaterial };
        if (!ud.base) ud.base = mesh.material as THREE.Material;
        if (!isSel && !inZone) { mesh.material = ud.base; return; }
        if (!ud.lit) ud.lit = (ud.base as THREE.MeshStandardMaterial).clone();
        ud.lit.emissive?.set(isSel ? '#ffffff' : '#d41fd0');
        ud.lit.emissiveIntensity = isSel ? 2.2 : 0.35;
        mesh.material = ud.lit;
      });
    });
    this.needs = true;
  }

  setShot(s: Shot) {
    this.fly = null;
    this.camera.position.set(...s.pos);
    this.controls.target.set(...s.target);
    this.camera.lookAt(this.controls.target);
    this.needs = true;
  }

  /** Lays a smooth curve through the shots: the scroll story travels along it instead of cutting between poses. */
  setPath(shots: Shot[]) {
    this.path = {
      pos: new THREE.CatmullRomCurve3(shots.map((s) => new THREE.Vector3(...s.pos)), false, 'centripetal'),
      target: new THREE.CatmullRomCurve3(shots.map((s) => new THREE.Vector3(...s.target)), false, 'centripetal'),
      length: shots.length - 1,
    };
  }

  /** u runs from 0 to the last shot. The camera eases towards it, so it glides even when the scroll is jerky. */
  setPathPosition(u: number, immediate = false) {
    this.pathGoal = u;
    if (immediate || this.pathNow === null) { this.pathNow = u; this.applyPath(); } else this.needs = true;
  }

  private applyPath() {
    if (!this.path || this.pathNow === null) return;
    const t = Math.min(1, Math.max(0, this.pathNow / this.path.length));
    this.path.pos.getPoint(t, this.camera.position);
    this.path.target.getPoint(t, this.controls.target);
    this.camera.lookAt(this.controls.target);
    this.needs = true;
  }

  flyTo(s: Shot, dur = 1400) {
    this.fly = { t0: performance.now(), dur, p0: this.camera.position.clone(), p1: new THREE.Vector3(...s.pos), t0v: this.controls.target.clone(), t1v: new THREE.Vector3(...s.target) };
    this.needs = true;
  }

  /** Camera framing for one table: close, low, looking through it towards the sea. */
  shotForTable(id: string): Shot {
    const t = TABLES.find((x) => x.id === id)!;
    const dir = new THREE.Vector3(t.p[0] - 34, 0, t.p[2] + 16).normalize();
    return { pos: [t.p[0] + dir.x * 11, t.p[1] + 6.5, t.p[2] + dir.z * 11], target: [t.p[0], t.p[1], t.p[2]] };
  }

  project(p: [number, number, number]) {
    const v = new THREE.Vector3(...p).project(this.camera);
    const r = this.canvas.getBoundingClientRect();
    return { x: ((v.x + 1) / 2) * r.width, y: ((1 - v.y) / 2) * r.height, behind: v.z > 1 };
  }

  private resize() {
    const r = this.canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const key = `${r.width}x${r.height}`;
    if (key === this.size) return;
    this.size = key;
    this.renderer.setSize(r.width, r.height, false);
    this.composer?.setSize(r.width, r.height);
    this.composer?.setPixelRatio(this.renderer.getPixelRatio());
    this.camera.aspect = r.width / r.height;
    // Portrait screens need a wider lens, otherwise the club falls off the sides.
    this.camera.fov = r.width / r.height < 0.9 ? 46 : 30;
    this.camera.updateProjectionMatrix();
    // Resizing clears the canvas: draw in the same frame or it flashes black.
    this.draw();
  }

  private draw() {
    this.needs = false;
    if (this.composer) this.composer.render(); else this.renderer.render(this.scene, this.camera);
    this.onFrame?.();
  }

  /** Keeps it sharp where the phone can take it: sheds resolution only if frames stay slow while moving. */
  private adapt(now: number) {
    if (now - this.lastRender < 200) this.frames.push(now - this.lastRender);
    this.lastRender = now;
    if (this.frames.length < 20) return;
    const avg = this.frames.reduce((a, b) => a + b, 0) / this.frames.length;
    this.frames = [];
    const dpr = this.renderer.getPixelRatio();
    if (avg > 38 && dpr > 1.25) {
      this.renderer.setPixelRatio(Math.max(1.25, dpr - 0.25));
      this.composer?.setPixelRatio(this.renderer.getPixelRatio());
    }
  }

  private loop(now: number) {
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, (now - this.lastLoop) / 1000);
    this.lastLoop = now;
    if (this.pathNow !== null && Math.abs(this.pathGoal - this.pathNow) > 0.0005) {
      this.pathNow += (this.pathGoal - this.pathNow) * (1 - Math.exp(-dt * 3.4));
      this.applyPath();
    }
    if (this.fly) {
      const f = this.fly;
      const t = Math.min(1, (now - f.t0) / f.dur);
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      this.camera.position.lerpVectors(f.p0, f.p1, e);
      this.controls.target.lerpVectors(f.t0v, f.t1v, e);
      this.needs = true;
      if (t === 1) this.fly = null;
    }
    if (this.controls.enabled) this.controls.update(); else if (this.fly) this.camera.lookAt(this.controls.target);
    if (!this.needs) return;
    this.adapt(now);
    this.draw();
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.canvas.removeEventListener('webglcontextlost', this.onContextLost);
    this.canvas.removeEventListener('webglcontextrestored', this.onContextRestored);
    this.controls.dispose();
    this.renderer.dispose();
  }
}

export const hasWebGL = () => {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
};
