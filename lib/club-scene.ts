import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import tablesData from './tables.json';
import { buildSurroundings } from './club-surroundings';
import type { ZoneId } from './data';

export type Mood = 'night' | 'sunset';
export type Shot = { pos: [number, number, number]; target: [number, number, number] };
export type TableInfo = { id: string; zone: ZoneId; p: [number, number, number] };
export const TABLES = tablesData as TableInfo[];

export const SHOTS: Record<'overview' | 'arch' | 'sea' | ZoneId, Shot> = {
  overview: { pos: [-46, 40, 44], target: [2, 0, -2] },
  sea: { pos: [-30, 17, 25], target: [60, 0, 2] },
  arch: { pos: [-14, 7, 13], target: [-6, 3, -13] },
  back: { pos: [-14, 8.5, 11], target: [-3, 2, -11] },
  riva: { pos: [-13, 13, 21], target: [4, 1.5, 6] },
  glitzbar: { pos: [-5, 11, 3], target: [-16, 1, -10] },
  'prato-back': { pos: [1, 9, -7], target: [14, 0, -18] },
  seaview: { pos: [-4, 9, 16], target: [12, 0, 6] },
};

const LED = [new THREE.Color('#5a5cf7'), new THREE.Color('#d41fd0'), new THREE.Color('#ff8a2a')];
const ledAt = (t: number) => (t < 0.55 ? LED[0].clone().lerp(LED[1], t / 0.55) : LED[1].clone().lerp(LED[2], (t - 0.55) / 0.45));

const isPhone = () => innerWidth < 860;
const MIN_DPR = () => (isPhone() ? 1.5 : 1);

// Colours bottom to top, plus the glow around where the sun went down, out to sea behind the island.
const SKY: Record<Mood, { horizon: string; mid: string; top: string; glow: string; glowPower: number }> = {
  sunset: { horizon: '#e9843f', mid: '#cf5f32', top: '#6d3f46', glow: '#ffa24d', glowPower: 0.75 },
  night: { horizon: '#232659', mid: '#10143a', top: '#050822', glow: '#3a2f6e', glowPower: 0.35 },
};

/** A real dome, so the horizon stays on the horizon when the camera tilts. */
function buildSky() {
  const uniforms = {
    horizon: { value: new THREE.Color() }, mid: { value: new THREE.Color() }, top: { value: new THREE.Color() },
    glow: { value: new THREE.Color() }, glowPower: { value: 0 }, sun: { value: new THREE.Vector3(0.82, 0.02, -0.57).normalize() },
  };
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(1000, 32, 16),
    new THREE.ShaderMaterial({
      uniforms, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
      vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `
        uniform vec3 horizon, mid, top, glow, sun; uniform float glowPower; varying vec3 vDir;
        void main(){
          vec3 d = normalize(vDir); float h = max(d.y, 0.0);
          vec3 c = mix(horizon, mid, smoothstep(0.0, 0.16, h));
          c = mix(c, top, smoothstep(0.14, 0.62, h));
          float g = pow(max(dot(d, sun), 0.0), 7.0);
          c = mix(c, glow, g * glowPower);
          gl_FragColor = vec4(c, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    }),
  );
  dome.renderOrder = -2; dome.frustumCulled = false;

  let seed = 97; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const pos: number[] = []; const col: number[] = [];
  for (let i = 0; i < 1100; i++) {
    const y = 0.05 + Math.pow(rnd(), 0.8) * 0.95; const a = rnd() * Math.PI * 2; const r = Math.sqrt(1 - y * y);
    pos.push(Math.cos(a) * r * 950, y * 950, Math.sin(a) * r * 950);
    const b = 0.35 + Math.pow(rnd(), 3) * 1.4; col.push(b, b, b * (0.92 + rnd() * 0.12));
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const stars = new THREE.Points(geo, new THREE.PointsMaterial({ size: 2, sizeAttenuation: false, vertexColors: true, transparent: true, depthWrite: false, depthTest: false, fog: false }));
  stars.renderOrder = -1; stars.frustumCulled = false;

  const group = new THREE.Group(); group.add(dome, stars);
  return {
    group, stars,
    set(mood: Mood) {
      const k = SKY[mood];
      uniforms.horizon.value.set(k.horizon); uniforms.mid.value.set(k.mid); uniforms.top.value.set(k.top); uniforms.glow.value.set(k.glow); uniforms.glowPower.value = k.glowPower;
      stars.visible = mood === 'night';
    },
  };
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
    this.camera = new THREE.PerspectiveCamera(30, 1, 4, 2600);
    this.controls = new OrbitControls(this.camera, canvas);
    Object.assign(this.controls, { enableDamping: true, dampingFactor: 0.08, minDistance: 14, maxDistance: 80, maxPolarAngle: 1.42, enabled: !!opts.interactive, zoomToCursor: true });
    this.controls.addEventListener('change', () => { this.needs = true; });
    this.interactive = !!opts.interactive;
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
    this.scene.add(hemi, sun, ...floor, ...strips, this.sky.group);

    if (!low) {
      this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
      // Bloom bypasses canvas antialiasing, so the render target does its own.
      this.composer = new EffectComposer(this.renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 2 }));
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
  private sky = buildSky();
  private surroundings: ReturnType<typeof buildSurroundings> | null = null;
  private panInput = { x: 0, z: 0 };
  private interactive = false;

  async load(url = `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/models/${isPhone() ? 'glitz-mobile' : 'glitz'}.glb`) {
    const loader = new GLTFLoader();
    MeshoptDecoder.useWorkers?.(2);
    loader.setMeshoptDecoder(MeshoptDecoder);
    const gltf = await loader.loadAsync(url);
    // Each heavy step gets its own frame, so scrolling never stalls while the club is being prepared.
    const breathe = () => new Promise((r) => setTimeout(r, 30));
    await breathe();
    this.scene.add(gltf.scene);
    gltf.scene.updateMatrixWorld(true);
    const down = new THREE.Raycaster(); const dir = new THREE.Vector3(0, -1, 0);
    const topAt = (x: number, z: number) => { down.set(new THREE.Vector3(x, 8, z), dir); return down.intersectObject(gltf.scene, true)[0]?.point.y ?? 1; };
    this.surroundings = buildSurroundings(isPhone(), TABLES, topAt);
    await breathe();
    this.seaMats.add(this.surroundings.seaMaterial);
    this.surroundings.setMood(this.mood);
    this.scene.add(this.surroundings.group);

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
    // Nothing but the camera and the sky moves: skip walking a thousand matrices every frame
    this.scene.updateMatrixWorld(true);
    this.scene.matrixWorldAutoUpdate = false;
    // Shaders and geometry go to the GPU now, off screen, not on the frame the section scrolls into view.
    await this.renderer.compileAsync(this.scene, this.camera);
    await breathe();
    this.draw();
    this.ready = true;
  }

  setMood(mood: Mood) {
    this.mood = mood;
    this.sky.set(mood);
    const night = mood === 'night';
    this.scene.fog = new THREE.Fog(night ? '#12153a' : '#d97e4a', night ? 170 : 220, night ? 820 : 1150);
    this.renderer.toneMappingExposure = night ? 1.1 : 0.95;
    const { hemi, sun, floor, strips } = this.lights;
    hemi.color.set(night ? '#a9b2ee' : '#f6e8ee'); hemi.groundColor.set(night ? '#14142c' : '#5a4a68'); hemi.intensity = night ? 1.25 : 1.5;
    sun.color.set(night ? '#a9b4ff' : '#ffc08f'); sun.intensity = night ? 0.35 : 1.5;
    this.paintSea();
    this.surroundings?.setMood(mood);
    floor.forEach((l) => { l.intensity = night ? 26 : 5; });
    strips.forEach((l) => { l.intensity = night ? 14 : 4; });
    this.needs = true;
  }

  private paintSea() {
    this.seaMats.forEach((m) => {
      m.metalness = 0; m.roughness = 0.75; m.fog = false; m.needsUpdate = true;
      m.color.set(this.mood === 'night' ? '#070a26' : '#1c5a7a');
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
        ud.lit.emissive?.set(isSel ? '#ffb765' : '#d41fd0');
        ud.lit.emissiveIntensity = isSel ? 0.5 : 0.14;
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

  /** Arrow keys and on-screen arrows: x is right, z is forward on the ground, as seen from the camera. */
  setPanInput(x: number, z: number) { this.panInput = { x, z }; this.fly = null; }

  /** Holding space turns left drag into panning. */
  setDragPan(on: boolean) { this.controls.mouseButtons.LEFT = on ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE; }

  /** Panning stays around the club: the target can't leave this box, however you drag or zoom. */
  private clampTarget() {
    const t = this.controls.target;
    const x = THREE.MathUtils.clamp(t.x, -20, 15);
    const y = THREE.MathUtils.clamp(t.y, 0, 5);
    const z = THREE.MathUtils.clamp(t.z, -22, 34);
    if (x !== t.x || y !== t.y || z !== t.z) {
      this.camera.position.x += x - t.x; this.camera.position.y += y - t.y; this.camera.position.z += z - t.z;
      t.set(x, y, z);
    }
  }

  private applyPanInput(dt: number) {
    const { x, z } = this.panInput;
    if (!x && !z) return;
    const forward = new THREE.Vector3().subVectors(this.controls.target, this.camera.position);
    const speed = forward.length() * 0.55 * dt;
    forward.y = 0; forward.normalize();
    const right = new THREE.Vector3(-forward.z, 0, forward.x);
    const move = right.multiplyScalar(x * speed).addScaledVector(forward, z * speed);
    this.camera.position.add(move);
    this.controls.target.add(move);
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
    this.sky.group.position.copy(this.camera.position);
    this.sky.group.updateMatrixWorld(true);
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
    if (avg > 26 && dpr > MIN_DPR()) {
      this.renderer.setPixelRatio(Math.max(MIN_DPR(), dpr - 0.25));
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
    if (this.interactive) {
      this.applyPanInput(dt);
      this.controls.update();
      if (!this.fly) this.clampTarget();
    } else if (this.fly) this.camera.lookAt(this.controls.target);
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
