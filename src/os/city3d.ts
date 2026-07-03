/**
 * The City — one three.js scene that is BOTH the Zoom-In cinematic and the
 * persistent Desktop backdrop (ADR 0002). The intro is a single continuous
 * banking camera flight (MK12 grammar: no cuts): night-lights geography →
 * dive as the white block-mass city resolves and rises → lock brackets on the
 * subject block → profiler card → card expands into the Dossier window → the
 * camera settles into the Desktop drift. App locations live in the scene as
 * Pins + Tags; clicking one opens a data panel that expands into the Window.
 *
 * Procedural + deterministic (seeded LCG, no assets). Lazy chunk — imported
 * dynamically only on fine-pointer desktops. Callers must handle `mountCity`
 * returning false (no WebGL) and fall back to the 2D path.
 */

import * as THREE from 'three';
import { gsap } from 'gsap';
import { REGION_STATES, METRO_COAST, PROJ } from './mapdata';

/* ── Tunables ─────────────────────────────────────────────────────────────── */

const BG = 0x060505;
const REGION_SCALE = 12; // world units per map unit on the geography plane
const ISLAND_ROT = (-28.9 * Math.PI) / 180;
const DPR_CAP = 1.5;

const REST_POS = new THREE.Vector3(300, 265, 400);
const REST_TARGET = new THREE.Vector3(-70, 24, -10);

interface AppAnchor {
  id: string;
  label: string;
  line: string;
  /** Local island-grid coords (x across, z along) — building is forced here. */
  lx: number;
  lz: number;
  h: number;
}

// Anchors sit along the island's east/downtown run so their tags project into
// the free right third of the rest view — NOT behind the default Dossier window.
const APP_ANCHORS: AppAnchor[] = [
  { id: 'dossier', label: 'DOSSIER', line: 'Subject file — profile & history', lx: 20, lz: 40, h: 46 },
  { id: 'projects', label: 'PROJECTS', line: 'Recovered artifacts & live captures', lx: 190, lz: 120, h: 96 },
  { id: 'resume', label: 'RESUME', line: 'Career document (PDF)', lx: 200, lz: 210, h: 74 },
  { id: 'contact', label: 'CONTACT', line: 'Direct channel to the subject', lx: 160, lz: -60, h: 128 },
  { id: 'arcade', label: 'ARCADE', line: 'Recreational modules — playable', lx: 218, lz: 30, h: 40 },
];

function lcg(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

/* ── Module singleton ─────────────────────────────────────────────────────── */

interface CityHooks {
  openApp: (id: string, originRect: DOMRect | null) => void;
}

interface City {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  islandGroup: THREE.Group;
  regionPlane: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  buildings: THREE.InstancedMesh;
  buildingBase: THREE.Matrix4[];
  subjectBounds: THREE.Box3;
  anchors: Array<{ spec: AppAnchor; world: THREE.Vector3; tag: HTMLElement }>;
  tagLayer: HTMLElement;
  hooks: CityHooks;
  riseT: number;
  drift: boolean;
  clock: THREE.Clock;
}

let city: City | null = null;

export function cityMounted(): boolean {
  return city !== null;
}

/* ── Procedural build ─────────────────────────────────────────────────────── */

/** Island half-width at a given z (tapered ends). */
const halfW = (z: number) => 238 * Math.sqrt(Math.max(0, 1 - Math.pow(Math.abs(z) / 690, 2.2)));
const inPark = (x: number, z: number) => x > -64 && x < 64 && z > -352 && z < -114;

function buildGroundTexture(): THREE.CanvasTexture {
  const px = 1024;
  const world = 1600; // texture covers ±800 world units
  const c = document.createElement('canvas');
  c.width = c.height = px;
  const ctx = c.getContext('2d')!;
  const k = px / world;
  ctx.fillStyle = '#050504';
  ctx.fillRect(0, 0, px, px);
  ctx.translate(px / 2, px / 2);
  ctx.scale(k, k);
  // Drawn UNROTATED — the ground mesh lives inside the rotated island group,
  // so streets, buildings, and tag anchors share one rotation source of truth.

  // Island slab
  ctx.fillStyle = '#0c0b0a';
  ctx.beginPath();
  for (let z = -690; z <= 690; z += 20) {
    const w = halfW(z);
    if (z === -690) ctx.moveTo(-w, z);
    else ctx.lineTo(-w, z);
  }
  for (let z = 690; z >= -690; z -= 20) ctx.lineTo(halfW(z), z);
  ctx.closePath();
  ctx.fill();

  // Streets
  ctx.strokeStyle = 'rgba(244,239,230,0.16)';
  ctx.lineWidth = 1.6;
  for (let z = -620; z <= 620; z += 26) {
    const w = halfW(z);
    ctx.beginPath();
    ctx.moveTo(-w, z);
    ctx.lineTo(w, z);
    ctx.stroke();
  }
  for (let x = -200; x <= 200; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, -620);
    ctx.lineTo(x, 620);
    ctx.stroke();
  }
  // Broadway
  ctx.strokeStyle = 'rgba(244,239,230,0.3)';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-150, -620);
  ctx.lineTo(-58, -210);
  ctx.lineTo(28, 140);
  ctx.lineTo(74, 620);
  ctx.stroke();
  // Park
  ctx.strokeStyle = 'rgba(244,239,230,0.28)';
  ctx.lineWidth = 1.6;
  ctx.strokeRect(-64, -352, 128, 238);

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}

function buildRegionTexture(): THREE.CanvasTexture {
  // Map viewBox (1000×700) → canvas. Real baked geography + night lights.
  const c = document.createElement('canvas');
  c.width = 2048;
  c.height = 1434;
  const ctx = c.getContext('2d')!;
  const k = 2048 / 1000;
  ctx.fillStyle = '#050504';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.scale(k, k);

  ctx.fillStyle = 'rgba(244,239,230,0.05)';
  ctx.strokeStyle = 'rgba(244,239,230,0.3)';
  ctx.lineWidth = 0.7;
  for (const p of REGION_STATES) {
    const path = new Path2D(p.d);
    ctx.fill(path);
    ctx.stroke(path);
  }
  ctx.strokeStyle = 'rgba(244,239,230,0.55)';
  for (const p of METRO_COAST) {
    ctx.stroke(new Path2D(p.d));
  }

  // Night lights
  const rnd = lcg(20260703);
  const metros: Array<[number, number, number, number]> = [
    [-74.006, 40.713, 34, 11], [-71.059, 42.36, 16, 7], [-75.165, 39.953, 16, 7],
    [-77.037, 38.907, 15, 7], [-76.612, 39.29, 9, 4.5], [-71.413, 41.824, 7, 3.5],
    [-72.685, 41.764, 6, 3], [-72.928, 41.308, 6, 3], [-73.756, 42.653, 6, 3],
  ];
  for (const [lon, lat, n, spread] of metros) {
    const mx = 500 + (lon - PROJ.nyc.lon) * PROJ.pxPerLon;
    const my = 350 - (lat - PROJ.nyc.lat) * PROJ.pxPerLat;
    const halo = ctx.createRadialGradient(mx, my, 0, mx, my, spread * 2.1);
    halo.addColorStop(0, 'rgba(244,239,230,0.5)');
    halo.addColorStop(1, 'rgba(244,239,230,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(mx - spread * 2.1, my - spread * 2.1, spread * 4.2, spread * 4.2);
    ctx.fillStyle = 'rgba(255,252,244,0.85)';
    for (let i = 0; i < n; i++) {
      const dx = (rnd() + rnd() - 1) * spread;
      const dy = (rnd() + rnd() - 1) * spread * 0.8;
      ctx.fillRect(mx + dx, my + dy, 1.1, 1.1);
    }
  }
  return new THREE.CanvasTexture(c);
}

function buildCity(scene: THREE.Scene): {
  islandGroup: THREE.Group;
  buildings: THREE.InstancedMesh;
  buildingBase: THREE.Matrix4[];
  subjectBounds: THREE.Box3;
  anchorWorlds: Map<string, THREE.Vector3>;
} {
  // Endless dark base so the textured ground never shows a horizon edge.
  const basePlane = new THREE.Mesh(
    new THREE.PlaneGeometry(40000, 40000),
    new THREE.MeshBasicMaterial({ color: 0x060505 }),
  );
  basePlane.rotation.x = -Math.PI / 2;
  basePlane.position.y = -0.5;
  scene.add(basePlane);

  const group = new THREE.Group();
  group.rotation.y = -ISLAND_ROT; // rotate island on the XZ plane

  // Ground — inside the group so it rotates with the buildings.
  const groundMat = new THREE.MeshBasicMaterial({ map: buildGroundTexture() });
  groundMat.fog = false; // must stay visible from cinematic altitude
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1600), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0.2;
  group.add(ground);

  // Buildings — instanced white boxes on the street grid
  const rnd = lcg(4711);
  const positions: Array<{ x: number; z: number; w: number; d: number; h: number; anchor?: AppAnchor }> = [];
  for (let z = -620; z < 620; z += 26) {
    for (let x = -220; x < 220; x += 40) {
      const cx = x + 20;
      const cz = z + 13;
      if (Math.abs(cx) > halfW(cz) - 16) continue;
      if (inPark(cx, cz)) continue;
      if (rnd() < 0.12) continue; // vacant lots — texture streets show through
      // Height: taller in "midtown" (z ≈ -150) and "downtown" (z ≈ 480) bands
      const midtown = Math.exp(-Math.pow((cz + 150) / 130, 2));
      const downtown = Math.exp(-Math.pow((cz - 470) / 110, 2));
      const base = 5 + rnd() * 14;
      const h = base + (midtown * 90 + downtown * 70) * (0.35 + rnd() * 0.65);
      positions.push({ x: cx, z: cz, w: 30 + rnd() * 4, d: 17 + rnd() * 3, h });
    }
  }
  // Force an anchor building per app at its slot (snap to nearest generated cell).
  const anchorWorlds = new Map<string, THREE.Vector3>();
  for (const spec of APP_ANCHORS) {
    let best = positions[0]!;
    let bestD = Infinity;
    for (const p of positions) {
      const d = (p.x - spec.lx) ** 2 + (p.z - spec.lz) ** 2;
      if (d < bestD) { bestD = d; best = p; }
    }
    best.h = spec.h;
    best.anchor = spec;
  }

  const geo = new THREE.BoxGeometry(1, 1, 1);
  geo.translate(0, 0.5, 0); // grow upward from ground
  const mat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const mesh = new THREE.InstancedMesh(geo, mat, positions.length);
  const m = new THREE.Matrix4();
  const col = new THREE.Color();
  const base: THREE.Matrix4[] = [];
  let subjectBounds = new THREE.Box3();

  positions.forEach((p, i) => {
    m.makeScale(p.w, p.h, p.d).setPosition(p.x, 0, p.z);
    mesh.setMatrixAt(i, m);
    base.push(m.clone());
    // Grayscale variance so the mass doesn't read flat
    const v = 0.72 + lcgHash(i) * 0.28;
    mesh.setColorAt(i, col.setRGB(v, v, v * 0.995));
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

  group.add(mesh);
  scene.add(group);
  group.updateMatrixWorld(true);

  // Anchor points + subject bounds via the group's REAL transform — no
  // hand-rolled rotation math to drift out of sync with the render.
  for (const p of positions) {
    if (!p.anchor) continue;
    anchorWorlds.set(
      p.anchor.id,
      new THREE.Vector3(p.x, p.h + 2, p.z).applyMatrix4(group.matrixWorld),
    );
    if (p.anchor.id === 'dossier') {
      subjectBounds = new THREE.Box3(
        new THREE.Vector3(p.x - p.w / 2, 0, p.z - p.d / 2),
        new THREE.Vector3(p.x + p.w / 2, p.h, p.z + p.d / 2),
      ).applyMatrix4(group.matrixWorld);
    }
  }
  return { islandGroup: group, buildings: mesh, buildingBase: base, subjectBounds, anchorWorlds };
}

function lcgHash(i: number): number {
  const s = ((i + 7) * 1103515245 + 12345) & 0x7fffffff;
  return s / 0x7fffffff;
}

/* ── Mounting ─────────────────────────────────────────────────────────────── */

export function mountCity(plane: HTMLElement, hooks: CityHooks): boolean {
  if (city) return true;
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true });
  } catch {
    return false;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, DPR_CAP));
  renderer.setSize(plane.clientWidth, plane.clientHeight);
  renderer.domElement.className = 'xw-city-canvas';
  // Replace only the SVG wallpaper — windows may already live in the plane.
  plane.querySelector('.xw-desktop-wallpaper')?.remove();
  plane.insertBefore(renderer.domElement, plane.firstChild);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.FogExp2(BG, 0.0006);

  const camera = new THREE.PerspectiveCamera(50, plane.clientWidth / plane.clientHeight, 1, 30000);
  camera.position.copy(REST_POS);
  camera.lookAt(REST_TARGET);

  scene.add(new THREE.HemisphereLight(0xfff8ec, 0x14110e, 1.25));
  const dir = new THREE.DirectionalLight(0xffffff, 0.55);
  dir.position.set(-400, 600, 300);
  scene.add(dir);

  const { islandGroup, buildings, buildingBase, subjectBounds, anchorWorlds } = buildCity(scene);

  // Geography plane (night-lights region) — visible at altitude, fades on dive.
  const regionMat = new THREE.MeshBasicMaterial({
    map: buildRegionTexture(),
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  regionMat.fog = false; // viewed from 5600 up — scene fog would black it out
  const regionPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(1000 * REGION_SCALE, 700 * REGION_SCALE),
    regionMat,
  );
  regionPlane.rotation.x = -Math.PI / 2;
  // Center so NYC (map 500,350) sits at the origin.
  regionPlane.position.set(0, 3, 0);
  scene.add(regionPlane);

  // Tag layer (DOM, above canvas, below windows — windows carry inline z-index)
  const tagLayer = document.createElement('div');
  tagLayer.className = 'xw-city-tags';
  plane.insertBefore(tagLayer, renderer.domElement.nextSibling);

  const anchors = APP_ANCHORS.map((spec) => {
    const world = anchorWorlds.get(spec.id) ?? new THREE.Vector3();
    const tag = document.createElement('button');
    tag.type = 'button';
    tag.className = 'xw-city-tag';
    tag.innerHTML = `<span class="xw-city-tag-label">${spec.label}</span><span class="xw-city-tag-stem" aria-hidden="true"></span><span class="xw-city-tag-pin" aria-hidden="true"></span>`;
    tag.addEventListener('click', () => openFromTag(spec, tag));
    tagLayer.appendChild(tag);
    return { spec, world, tag };
  });

  city = {
    renderer, scene, camera, islandGroup, regionPlane, buildings, buildingBase,
    subjectBounds, anchors, tagLayer, hooks, riseT: 1, drift: true, clock: new THREE.Clock(),
  };

  const onResize = () => {
    if (!city) return;
    const w = plane.clientWidth;
    const h = plane.clientHeight;
    city.renderer.setSize(w, h);
    city.camera.aspect = w / h;
    city.camera.updateProjectionMatrix();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // No frame loop in static mode — repaint and reposition tags manually.
      city.renderer.render(city.scene, city.camera);
      updateTags();
    }
  };
  window.addEventListener('resize', onResize);

  // If the intro flight is pending, pre-park the camera at its start so the
  // boot fade never glimpses the desktop view (buildings down, geography up).
  if (document.body.classList.contains('xw-introing')) {
    introActive = true;
    camera.position.set(40, 5600, 60);
    camera.lookAt(0, 0, 0);
    regionPlane.material.opacity = 1;
    applyRise(city, 0);
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    city.drift = false;
    renderer.render(scene, camera);
    updateTags();
  } else {
    renderer.setAnimationLoop(tick);
  }
  document.addEventListener('visibilitychange', () => {
    if (!city || reduced) return;
    if (document.hidden) city.renderer.setAnimationLoop(null);
    else city.renderer.setAnimationLoop(tick);
  });

  return true;
}

/* ── Frame loop ───────────────────────────────────────────────────────────── */

let introActive = false;

/** Building-rise wave: 0 = flat ground, 1 = full skyline. */
function applyRise(c: City, r: number): void {
  if (r === c.riseT) return;
  c.riseT = r;
  const m = new THREE.Matrix4();
  const s = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const p = new THREE.Vector3();
  c.buildingBase.forEach((bm, i) => {
    bm.decompose(p, q, s);
    const wave = THREE.MathUtils.clamp(r * 1.6 - lcgHash(i * 3) * 0.6, 0, 1);
    m.makeScale(s.x, Math.max(0.01, s.y * wave), s.z).setPosition(p.x, 0, p.z);
    c.buildings.setMatrixAt(i, m);
  });
  c.buildings.instanceMatrix.needsUpdate = true;
}

/** Snap the scene straight to its desktop state (intro skipped or absent). */
export function settleDesktop(): void {
  if (!city) return;
  introActive = false;
  city.camera.position.copy(REST_POS);
  city.camera.lookAt(REST_TARGET);
  city.regionPlane.material.opacity = 0;
  applyRise(city, 1);
  showTags(); // renders a fresh frame + positions tags (covers static mode)
}

function tick(): void {
  if (!city) return;
  const t = city.clock.getElapsedTime();
  if (city.drift && !introActive) {
    // Slow desktop drift — a system idly watching.
    const a = Math.sin(t * 0.1) * 0.05;
    city.camera.position.x = REST_POS.x + Math.sin(t * 0.07) * 14;
    city.camera.position.z = REST_POS.z + Math.cos(t * 0.05) * 10;
    city.camera.position.y = REST_POS.y + Math.sin(t * 0.06) * 5;
    city.camera.lookAt(REST_TARGET.x + a * 40, REST_TARGET.y, REST_TARGET.z);
  }
  city.renderer.render(city.scene, city.camera);
  updateTags();
}

function project(world: THREE.Vector3): { x: number; y: number; behind: boolean } {
  const c = city!;
  const v = world.clone().project(c.camera);
  const el = c.renderer.domElement;
  return {
    x: ((v.x + 1) / 2) * el.clientWidth,
    y: ((1 - v.y) / 2) * el.clientHeight,
    behind: v.z > 1,
  };
}

let tagsShown = false;

export function showTags(): void {
  tagsShown = true;
  if (!city) return;
  city.tagLayer.classList.add('xw-city-tags--on');
  // Static mode (reduced motion) has no frame loop — render and position the
  // tags explicitly, or they'd appear stacked and untransformed at origin.
  city.renderer.render(city.scene, city.camera);
  updateTags();
}

function updateTags(): void {
  if (!city || !tagsShown) return;
  for (const a of city.anchors) {
    const p = project(a.world);
    a.tag.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px)`;
    a.tag.style.visibility = p.behind ? 'hidden' : 'visible';
  }
}

/* ── Tag → panel → window ─────────────────────────────────────────────────── */

function openFromTag(spec: AppAnchor, tag: HTMLElement): void {
  if (!city) return;
  const r = tag.getBoundingClientRect();
  const panel = document.createElement('div');
  panel.className = 'xw-city-panel';
  panel.innerHTML = `<span class="xw-city-panel-title">${spec.label}</span><span class="xw-city-panel-line">${spec.line}</span>`;
  panel.style.left = `${r.left + r.width + 10}px`;
  panel.style.top = `${Math.max(60, r.top - 8)}px`;
  document.body.appendChild(panel);
  gsap.fromTo(panel, { opacity: 0, scaleY: 0.4 }, { opacity: 1, scaleY: 1, duration: 0.14, transformOrigin: 'top left' });
  window.setTimeout(() => {
    const rect = panel.getBoundingClientRect();
    city?.hooks.openApp(spec.id, rect);
    gsap.to(panel, { opacity: 0, duration: 0.2, delay: 0.1, onComplete: () => panel.remove() });
  }, 300);
}

/* ── Intro flight ─────────────────────────────────────────────────────────── */

const mapToWorld = (mx: number, my: number) => new THREE.Vector3((mx - 500) * REGION_SCALE, 3, (my - 350) * REGION_SCALE);

function subjectScreenRect(): DOMRect | null {
  if (!city) return null;
  const b = city.subjectBounds;
  const pts = [
    new THREE.Vector3(b.min.x, b.min.y, b.min.z), new THREE.Vector3(b.max.x, b.min.y, b.min.z),
    new THREE.Vector3(b.min.x, b.max.y, b.min.z), new THREE.Vector3(b.max.x, b.max.y, b.min.z),
    new THREE.Vector3(b.min.x, b.min.y, b.max.z), new THREE.Vector3(b.max.x, b.min.y, b.max.z),
    new THREE.Vector3(b.min.x, b.max.y, b.max.z), new THREE.Vector3(b.max.x, b.max.y, b.max.z),
  ].map((v) => project(v));
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return new DOMRect(x, y, Math.max(...xs) - x, Math.max(...ys) - y);
}

/**
 * Play the intro flight in `overlay` (a transparent HUD layer above the canvas).
 * Returns false when the city isn't mounted (caller falls back to 2D).
 */
export function playIntro(overlay: HTMLElement, onReveal: () => void): boolean {
  if (!city) return false;
  const c = city;
  introActive = true;

  overlay.innerHTML = `
    <div class="xw-zi-sweep" aria-hidden="true"></div>
    <div class="xw-zi-chip" id="xw-zi-chip" aria-hidden="true"></div>
    <div class="xw-zi-hbox" id="xw-zi-hbox" aria-hidden="true"></div>
    <span class="xw-zi-bkt xw-zi-bkt--tl"></span>
    <span class="xw-zi-bkt xw-zi-bkt--tr"></span>
    <span class="xw-zi-bkt xw-zi-bkt--bl"></span>
    <span class="xw-zi-bkt xw-zi-bkt--br"></span>
    <span class="xw-zi-lockrect" id="xw-zi-lockrect"></span>
    <span class="xw-zi-connector" id="xw-zi-connector"></span>
    <div class="xw-zi-card" id="xw-zi-card">
      <img class="xw-zi-card-photo" src="/static/images/Profile_Picture.jpg" alt="" />
      <div class="xw-zi-card-body">
        <span class="xw-zi-card-name">XIAO, DAVID</span>
        <span class="xw-zi-card-line">WEB DEVELOPER — SECCO SQUARED</span>
        <span class="xw-zi-card-line">NEW YORK, NY</span>
        <span class="xw-zi-card-foot">ACCESSING FILE…</span>
      </div>
    </div>
    <div class="xw-zi-readout" aria-hidden="true"><span id="xw-zi-coords"></span><span id="xw-zi-alt"></span></div>
    <div class="xw-zi-status" id="xw-zi-status" role="status" aria-live="polite"></div>
    <button type="button" class="xw-zi-skip" id="xw-zi-skip">Bypass ▸</button>`;

  const chip = overlay.querySelector<HTMLElement>('#xw-zi-chip')!;
  const hbox = overlay.querySelector<HTMLElement>('#xw-zi-hbox')!;
  const status = overlay.querySelector<HTMLElement>('#xw-zi-status')!;
  const coords = overlay.querySelector<HTMLElement>('#xw-zi-coords')!;
  const altEl = overlay.querySelector<HTMLElement>('#xw-zi-alt')!;
  const card = overlay.querySelector<HTMLElement>('#xw-zi-card')!;
  const skipBtn = overlay.querySelector<HTMLButtonElement>('#xw-zi-skip')!;

  gsap.set('.xw-zi-bkt, #xw-zi-lockrect, #xw-zi-connector, #xw-zi-card', { autoAlpha: 0 });
  gsap.set(hbox, { autoAlpha: 0 });

  const setStatus = (s: string) => { status.textContent = s; };

  // Camera path: high nadir over the region → banking dive → the rest pose.
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(40, 5600, 60),
    new THREE.Vector3(420, 2600, 900),
    new THREE.Vector3(760, 900, 1150),
    REST_POS.clone(),
  ], false, 'centripetal');
  const lookFrom = new THREE.Vector3(0, 0, 0);
  const flight = { t: 0 };

  const setCam = () => {
    const pos = path.getPoint(flight.t);
    c.camera.position.copy(pos);
    const target = lookFrom.clone().lerp(REST_TARGET, flight.t);
    c.camera.lookAt(target);
    // True-ish readouts derived from the camera: position over the geography.
    const mx = 500 + target.x / REGION_SCALE;
    const my = 350 + target.z / REGION_SCALE;
    const lat = PROJ.nyc.lat - (my - 350) / PROJ.pxPerLat;
    const lon = PROJ.nyc.lon + (mx - 500) / PROJ.pxPerLon;
    coords.textContent = `${lat.toFixed(4)}° N  ${Math.abs(lon).toFixed(4)}° W`;
    const km = (pos.y / 5600) * 240;
    altEl.textContent = km >= 1 ? `ALT ${km >= 10 ? Math.round(km) : km.toFixed(1)} KM` : `ALT ${Math.round(km * 1000)} M`;
    // Region fades on descent; buildings rise 2200→800 so the two overlap.
    c.regionPlane.material.opacity = THREE.MathUtils.clamp((pos.y - 700) / 2200, 0, 1);
    setRise(THREE.MathUtils.clamp((2200 - pos.y) / 1400, 0, 1));
  };

  const setRise = (r: number) => applyRise(c, r);

  // Start state
  flight.t = 0;
  setRise(0);
  setCam();

  let finished = false;
  let revealed = false;
  const reveal = () => {
    if (revealed) return;
    revealed = true;
    onReveal();
    showTags();
  };
  const finish = (fast: boolean) => {
    if (finished) return;
    finished = true;
    tl.kill();
    document.removeEventListener('keydown', onKey);
    // Snap the scene to its desktop state.
    flight.t = 1;
    setCam();
    setRise(1);
    c.regionPlane.material.opacity = 0;
    introActive = false;
    reveal();
    gsap.to(overlay, { opacity: 0, duration: fast ? 0.15 : 0.3, onComplete: () => overlay.remove() });
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') finish(true);
  };
  document.addEventListener('keydown', onKey);
  skipBtn.addEventListener('click', () => finish(true));

  const placeBox = (screen: { x: number; y: number }, size: number, label: string) => {
    gsap.set(hbox, {
      autoAlpha: 1,
      left: screen.x - size / 2,
      top: screen.y - size / 2,
      width: size,
      height: size,
    });
    chip.textContent = label;
    chip.style.left = `${screen.x - size / 2}px`;
    chip.style.top = `${screen.y - size / 2 - 30}px`;
    gsap.set(chip, { opacity: 1 });
  };
  const hideBox = () => {
    gsap.set(hbox, { autoAlpha: 0 });
    gsap.set(chip, { opacity: 0 });
  };
  const glitch = () => {
    gsap.fromTo('.xw-city-canvas', { x: gsap.utils.random(-4, 4, 1) }, { x: 0, duration: 0.07 });
  };

  const candidates: Array<[number, number, string]> = [
    [-71.059, 42.36, 'BOSTON METRO'],
    [-77.037, 38.907, 'WASHINGTON METRO'],
    [-75.165, 39.953, 'PHILADELPHIA METRO'],
  ];

  const tl = gsap.timeline();
  tl.add(() => setStatus('Acquiring — northeast corridor'), 0)
    .to(overlay, { '--xw-zi-veil': 0, duration: 0.01 }, 0);

  candidates.forEach(([lon, lat, label]) => {
    tl.add(() => {
      const world = mapToWorld(500 + (lon - PROJ.nyc.lon) * PROJ.pxPerLon, 350 - (lat - PROJ.nyc.lat) * PROJ.pxPerLat);
      placeBox(project(world), 120, label);
      glitch();
    }).to({}, { duration: 0.14 });
  });
  tl.add(() => {
    placeBox(project(new THREE.Vector3(0, 3, 0)), 150, 'NEW YORK METRO');
  })
    .to({}, { duration: 0.3 })
    .add(() => {
      hideBox();
      setStatus('Target — New York metro');
    })
    // The one continuous dive.
    .to(flight, { t: 1, duration: 3.4, ease: 'power2.inOut', onUpdate: setCam })
    .add(() => setStatus('Grid — Manhattan'), '<45%')
    .add(glitch, '<10%')
    .add(glitch, '<55%')
    .add(() => {
      setStatus('Block resolved');
      lockOn();
    });

  /* Lock-on finale (screen-space, same grammar as the 2D path). */
  const bracketFrame = (r: DOMRect, spread: number) => {
    const x0 = r.left - spread;
    const y0 = r.top - spread;
    const x1 = r.right + spread;
    const y1 = r.bottom + spread;
    gsap.set('.xw-zi-bkt--tl', { left: x0 - 18, top: y0 - 18 });
    gsap.set('.xw-zi-bkt--tr', { left: x1, top: y0 - 18 });
    gsap.set('.xw-zi-bkt--bl', { left: x0 - 18, top: y1 });
    gsap.set('.xw-zi-bkt--br', { left: x1, top: y1 });
  };

  const lockOn = () => {
    if (finished) return;
    const anchor = subjectScreenRect();
    if (!anchor) { finish(false); return; }
    setStatus('Subject located');
    const ltl = gsap.timeline();
    [200, 80, 26, 6].forEach((spread, i) => {
      ltl.add(() => {
        bracketFrame(anchor, spread);
        if (i === 0) gsap.set('.xw-zi-bkt', { autoAlpha: 1 });
        glitch();
      }).to({}, { duration: 0.09 });
    });
    ltl
      .add(() => {
        overlay.classList.add('xw-zi-lock--captured');
        gsap.set('#xw-zi-lockrect', {
          autoAlpha: 1,
          left: anchor.left - 6, top: anchor.top - 6,
          width: anchor.width + 12, height: anchor.height + 12,
        });
      })
      .to({}, { duration: 0.12 })
      .add(() => {
        gsap.set('#xw-zi-connector', {
          autoAlpha: 1,
          left: anchor.right + 6, top: anchor.top + anchor.height / 2, width: 0,
        });
      })
      .to('#xw-zi-connector', { width: 36, duration: 0.12 })
      .add(() => {
        gsap.set(card, { left: anchor.right + 42, top: Math.max(16, anchor.top - 24) });
      })
      .fromTo(card, { autoAlpha: 0, x: -10 }, { autoAlpha: 1, x: 0, duration: 0.2 })
      .add(() => setStatus('Subject located — opening file'))
      .to({}, { duration: 0.6 })
      .add(() => cardToWindow());
  };

  const cardToWindow = () => {
    if (finished) return;
    finished = true;
    document.removeEventListener('keydown', onKey);
    introActive = false;
    reveal();
    const winEl = document.querySelector<HTMLElement>('.xw-window[data-app="dossier"]');
    const target = winEl?.getBoundingClientRect();
    const mtl = gsap.timeline({ onComplete: () => overlay.remove() });
    mtl.to('.xw-zi-readout, #xw-zi-status, #xw-zi-chip, .xw-zi-skip, .xw-zi-sweep, .xw-zi-bkt, #xw-zi-lockrect, #xw-zi-connector', {
      opacity: 0, duration: 0.18,
    });
    if (!target) {
      mtl.to(overlay, { opacity: 0, duration: 0.3 }, '<+0.1');
      return;
    }
    mtl
      .to('.xw-zi-card-photo, .xw-zi-card-body', { opacity: 0, duration: 0.22 }, '<')
      .to(card, {
        left: target.left, top: target.top, width: target.width, height: target.height,
        duration: 0.5, ease: 'power3.inOut',
      }, '<+0.05')
      .to(overlay, { opacity: 0, duration: 0.22 });
  };

  return true;
}
