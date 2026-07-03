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
import { buildRoomFor, type RoomBuild } from './rooms';

/* ── Tunables ─────────────────────────────────────────────────────────────── */

const BG = 0x060505;
const REGION_SCALE = 12; // world units per map unit on the geography plane
const METRO_SCALE = 116; // world units per map unit at street scale (real geometry)
const ISLAND_ROT = (-28.9 * Math.PI) / 180;
const DPR_CAP = 1.5;

const REST_POS = new THREE.Vector3(320, 400, 450);
const REST_TARGET = new THREE.Vector3(-70, 20, -10);

interface AppAnchor {
  id: string;
  label: string;
  line: string;
  /** Local island-grid coords (x across, z along) — building is forced here. */
  lx: number;
  lz: number;
  h: number;
}

// Anchors dispersed across the island (the map is rotatable — reachability no
// longer depends on one fixed framing).
const APP_ANCHORS: AppAnchor[] = [
  { id: 'dossier', label: 'DOSSIER', line: 'Subject file — profile & history', lx: 20, lz: 40, h: 46 },
  { id: 'projects', label: 'PROJECTS', line: 'Recovered artifacts & live captures', lx: -80, lz: -260, h: 96 },
  { id: 'resume', label: 'RESUME', line: 'Career document (PDF)', lx: 190, lz: 140, h: 74 },
  { id: 'contact', label: 'CONTACT', line: 'Direct channel to the subject', lx: -40, lz: 470, h: 128 },
  { id: 'arcade', label: 'ARCADE', line: 'Recreational modules — playable', lx: -170, lz: 60, h: 40 },
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
  openCapture?: (title: string, url: string) => void;
  openProjectRecord?: (projectId: string) => void;
}

interface RoomEntry {
  shellMat: THREE.MeshLambertMaterial;
  build: RoomBuild | null;
  center: THREE.Vector3;
  camIn: THREE.Vector3;
  camLook: THREE.Vector3;
  screenMesh: THREE.Mesh | null;
  /** Look-around state while inside (drag adjusts az/pol). */
  orbit: { az: number; pol: number; r: number };
  leds: THREE.Mesh[];
}

interface City {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  islandGroup: THREE.Group;
  regionPlane: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  metroPlane: THREE.Mesh;
  buildings: THREE.InstancedMesh;
  buildingBase: THREE.Matrix4[];
  subjectBounds: THREE.Box3;
  anchors: Array<{ spec: AppAnchor; world: THREE.Vector3; tag: HTMLElement }>;
  tagLayer: HTMLElement;
  hooks: CityHooks;
  riseT: number;
  orbit: { az: number; pol: number; r: number };
  orbitTarget: THREE.Vector3;
  packets: Array<{ mesh: THREE.Mesh; pts: THREE.Vector3[]; lens: number[]; total: number; speed: number; phase: number }>;
  shellMat: THREE.MeshLambertMaterial;
  person: THREE.Group;
  rooms: Map<string, RoomEntry>;
  mode: 'overhead' | 'diving' | 'room';
  currentRoom: string | null;
  exitBtn: HTMLElement;
  flights: Array<{ mesh: THREE.Mesh; a: THREE.Vector3; b: THREE.Vector3; total: number; speed: number; phase: number }>;
  subjectEdges: THREE.LineSegments;
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
  // Transparent outside the island slab — the real metro coastline plane
  // beneath must stay visible around Manhattan.
  ctx.clearRect(0, 0, px, px);
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
  ctx.fillStyle = '#060505'; // EXACT scene background — no visible plane edge
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

  // Air routes (trailer grammar) — dashed ink arcs; markers fly them in 3D.
  const airRoutes: Array<Array<[number, number]>> = [
    [[-77.037, 38.907], [-71.059, 42.36]],
    [[-74.006, 40.713], [-73.756, 42.653]],
    [[-75.165, 39.953], [-71.413, 41.824]],
  ];
  ctx.save();
  ctx.setLineDash([2.5, 4.5]);
  ctx.strokeStyle = 'rgba(244,239,230,0.22)';
  ctx.lineWidth = 0.9;
  for (const route of airRoutes) {
    ctx.beginPath();
    route.forEach(([lon, lat], i) => {
      const x = 500 + (lon - PROJ.nyc.lon) * PROJ.pxPerLon;
      const y = 350 - (lat - PROJ.nyc.lat) * PROJ.pxPerLat;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }
  ctx.restore();

  // The corridor as live infrastructure: dashed data route DC → Boston.
  const corridor: Array<[number, number]> = [
    [-77.037, 38.907], [-76.612, 39.29], [-75.165, 39.953], [-74.006, 40.713],
    [-72.928, 41.308], [-71.413, 41.824], [-71.059, 42.36],
  ];
  ctx.save();
  ctx.setLineDash([3.5, 5.5]);
  ctx.strokeStyle = 'rgba(0, 210, 255, 0.4)';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  corridor.forEach(([lon, lat], i) => {
    const x = 500 + (lon - PROJ.nyc.lon) * PROJ.pxPerLon;
    const y = 350 - (lat - PROJ.nyc.lat) * PROJ.pxPerLat;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.restore();

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
  // Fade the plane's borders to transparent so its rectangle never reads.
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'destination-out';
  const edge = 140;
  const fades: Array<[number, number, number, number]> = [
    [0, 0, edge, 0], [c.width, 0, c.width - edge, 0],
  ];
  for (const [x0, y0, x1, y1] of fades) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, c.width, c.height);
  }
  const gv1 = ctx.createLinearGradient(0, 0, 0, edge);
  gv1.addColorStop(0, 'rgba(0,0,0,1)');
  gv1.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gv1;
  ctx.fillRect(0, 0, c.width, edge);
  const gv2 = ctx.createLinearGradient(0, c.height, 0, c.height - edge);
  gv2.addColorStop(0, 'rgba(0,0,0,1)');
  gv2.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gv2;
  ctx.fillRect(0, c.height - edge, c.width, edge);
  ctx.globalCompositeOperation = 'source-over';
  return new THREE.CanvasTexture(c);
}

/** Real metro geography at street scale — borough edges + the Jersey shoreline. */
function buildMetroTexture(): THREE.CanvasTexture {
  const px = 2048;
  const world = 8000;
  const c = document.createElement('canvas');
  c.width = c.height = px;
  const ctx = c.getContext('2d')!;
  const pxPerMap = (px / world) * METRO_SCALE;
  ctx.setTransform(pxPerMap, 0, 0, pxPerMap, px / 2 - 500 * pxPerMap, px / 2 - 350 * pxPerMap);
  ctx.strokeStyle = 'rgba(244,239,230,0.34)';
  ctx.lineWidth = 0.075;
  for (const pth of METRO_COAST) {
    ctx.stroke(new Path2D(pth.d));
  }
  return new THREE.CanvasTexture(c);
}

function buildCity(scene: THREE.Scene): {
  islandGroup: THREE.Group;
  buildings: THREE.InstancedMesh;
  buildingBase: THREE.Matrix4[];
  subjectBounds: THREE.Box3;
  anchorWorlds: Map<string, THREE.Vector3>;
  packets: City['packets'];
  metroPlane: THREE.Mesh;
  subjectEdges: THREE.LineSegments;
  shellMat: THREE.MeshLambertMaterial;
  person: THREE.Group;
  roomShells: Map<string, { shellMat: THREE.MeshLambertMaterial; build: RoomBuild | null; screen: THREE.Mesh | null }>;
  dossierScreen: THREE.Mesh | null;
} {
  // Endless dark base so the textured ground never shows a horizon edge.
  const basePlane = new THREE.Mesh(
    new THREE.PlaneGeometry(40000, 40000),
    new THREE.MeshBasicMaterial({ color: 0x060505 }),
  );
  basePlane.rotation.x = -Math.PI / 2;
  basePlane.position.y = -0.5;
  scene.add(basePlane);

  // Real metro geography under everything: Brooklyn/Queens/Bronx/Staten Island
  // edges and the Jersey shoreline (Natural Earth 10m, projected + scaled so
  // real Manhattan matches the procedural island footprint).
  const metroMat = new THREE.MeshBasicMaterial({ map: buildMetroTexture(), transparent: true });
  metroMat.fog = false;
  const metroPlane = new THREE.Mesh(new THREE.PlaneGeometry(8000, 8000), metroMat);
  metroPlane.rotation.x = -Math.PI / 2;
  metroPlane.position.y = 0.06;
  metroPlane.name = 'xw-metro';
  scene.add(metroPlane);

  const group = new THREE.Group();
  group.rotation.y = ISLAND_ROT; // island leans NE like the real one

  // Ground — inside the group so it rotates with the buildings.
  const groundMat = new THREE.MeshBasicMaterial({ map: buildGroundTexture(), transparent: true });
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
    if (p.anchor) {
      // Every app building gets a standalone fading shell + a room inside —
      // its instance is zeroed permanently.
      m.makeScale(0.0001, 0.0001, 0.0001).setPosition(p.x, 0, p.z);
    } else {
      m.makeScale(p.w, p.h, p.d).setPosition(p.x, 0, p.z);
    }
    mesh.setMatrixAt(i, m);
    base.push(m.clone());
    // Grayscale variance so the mass doesn't read flat
    const v = 0.72 + lcgHash(i) * 0.28;
    mesh.setColorAt(i, col.setRGB(v, v, v * 0.995));
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

  group.add(mesh);

  // Cyan data arteries (the system's traffic) — faint lines + traveling packets.
  const routePts: THREE.Vector3[][] = [
    [new THREE.Vector3(-120, 1.4, -600), new THREE.Vector3(-120, 1.4, 600)],
    [new THREE.Vector3(80, 1.4, -560), new THREE.Vector3(80, 1.4, 580)],
    [
      new THREE.Vector3(-150, 1.4, -620), new THREE.Vector3(-58, 1.4, -210),
      new THREE.Vector3(28, 1.4, 140), new THREE.Vector3(74, 1.4, 620),
    ],
    [new THREE.Vector3(-220, 1.4, 220), new THREE.Vector3(230, 1.4, 220)],
  ];
  const routeMat = new THREE.LineBasicMaterial({ color: 0x00d2ff, transparent: true, opacity: 0.16 });
  const packets: City['packets'] = [];
  const pktGeo = new THREE.PlaneGeometry(7, 7);
  routePts.forEach((pts, ri) => {
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), routeMat));
    const lens: number[] = [0];
    for (let i = 1; i < pts.length; i++) lens.push(lens[i - 1]! + pts[i]!.distanceTo(pts[i - 1]!));
    const total = lens[lens.length - 1]!;
    for (let k = 0; k < 2; k++) {
      const pktMat = new THREE.MeshBasicMaterial({ color: 0x00d2ff, transparent: true, opacity: 0.75 });
      pktMat.fog = false;
      const m = new THREE.Mesh(pktGeo, pktMat);
      m.rotation.x = -Math.PI / 2;
      group.add(m);
      packets.push({ mesh: m, pts, lens, total, speed: 60 + ri * 22 + k * 31, phase: (k * total) / 2 + ri * 137 });
    }
  });

  scene.add(group);
  group.updateMatrixWorld(true);

  // Subject building highlight — cyan edges, pulsed during the lock-on.
  const roomShells = new Map<string, { shellMat: THREE.MeshLambertMaterial; build: RoomBuild | null; screen: THREE.Mesh | null }>();
  for (const p of positions) {
    if (!p.anchor || p.anchor.id === 'dossier') continue;
    const sm = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: false });
    const shell = new THREE.Mesh(new THREE.BoxGeometry(p.w, p.h, p.d), sm);
    shell.position.set(p.x, p.h / 2, p.z);
    group.add(shell);
    const build = buildRoomFor(p.anchor.id, p.w - 2, p.d - 2, 23);
    if (build) {
      build.group.position.set(p.x, 0, p.z);
      group.add(build.group);
    }
    roomShells.set(p.anchor.id, { shellMat: sm, build, screen: build?.screen ?? null });
  }

  let subjectEdges = new THREE.LineSegments();
  let shellMat = new THREE.MeshLambertMaterial();
  let person = new THREE.Group();
  let dossierScreen: THREE.Mesh | null = null;
  for (const p of positions) {
    if (p.anchor?.id !== 'dossier') continue;

    const eg = new THREE.EdgesGeometry(new THREE.BoxGeometry(p.w + 2, p.h + 2, p.d + 2));
    const em = new THREE.LineBasicMaterial({ color: 0x00d2ff, transparent: true, opacity: 0 });
    em.fog = false;
    subjectEdges = new THREE.LineSegments(eg, em);
    subjectEdges.position.set(p.x, p.h / 2, p.z);
    group.add(subjectEdges);

    // The subject's building is a standalone SHELL (its instance is zeroed
    // below) so the camera can fade through the facade into the room.
    shellMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true });
    const shell = new THREE.Mesh(new THREE.BoxGeometry(p.w, p.h, p.d), shellMat);
    shell.position.set(p.x, p.h / 2, p.z);
    group.add(shell);

    // ── The room: SOLID geometry (the white-city language, indoors) ──
    const room = new THREE.Group();
    room.position.set(p.x, 0, p.z);
    const white = new THREE.MeshLambertMaterial({ color: 0xe9e4d8 });
    const grey = new THREE.MeshLambertMaterial({ color: 0x8f8a80 });
    const dark = new THREE.MeshLambertMaterial({ color: 0x27231f });
    const solid = (
      g: THREE.BufferGeometry, m: THREE.Material,
      x: number, y: number, z: number, ry = 0,
    ) => {
      const mesh = new THREE.Mesh(g, m);
      mesh.position.set(x, y, z);
      mesh.rotation.y = ry;
      room.add(mesh);
      return mesh;
    };

    const RW = p.w - 2;   // room width  (~32)
    const RD = p.d - 2;   // room depth  (~18)
    const WALL_H = 13;

    // Floor, rug, walls (no ceiling — the camera enters from above)
    solid(new THREE.BoxGeometry(RW, 0.5, RD), dark, 0, 0.25, 0);
    solid(new THREE.BoxGeometry(11, 0.12, 8), grey, 0, 0.56, 1.5);
    const wallMat = new THREE.MeshLambertMaterial({ color: 0x3a352f });
    solid(new THREE.BoxGeometry(RW, WALL_H, 0.6), wallMat, 0, WALL_H / 2, -RD / 2);
    solid(new THREE.BoxGeometry(RW, WALL_H, 0.6), wallMat, 0, WALL_H / 2, RD / 2);
    solid(new THREE.BoxGeometry(0.6, WALL_H, RD), wallMat, -RW / 2, WALL_H / 2, 0);
    solid(new THREE.BoxGeometry(0.6, WALL_H, RD), wallMat, RW / 2, WALL_H / 2, 0);
    // Window on the west wall — a lighter pane with muntins
    solid(new THREE.BoxGeometry(0.2, 6, 8), new THREE.MeshBasicMaterial({ color: 0x11141a }), -RW / 2 + 0.45, 6.5, 0);
    solid(new THREE.BoxGeometry(0.24, 6, 0.24), grey, -RW / 2 + 0.45, 6.5, 0);
    solid(new THREE.BoxGeometry(0.24, 0.24, 8), grey, -RW / 2 + 0.45, 6.5, 0);

    // Desk (slab + legs), monitor, keyboard, mug
    solid(new THREE.BoxGeometry(13, 0.7, 5.4), white, 0, 4.4, -5.6);
    for (const [lx, lz] of [[-6, -7.6], [6, -7.6], [-6, -3.6], [6, -3.6]] as Array<[number, number]>) {
      solid(new THREE.BoxGeometry(0.6, 4.1, 0.6), grey, lx, 2.05, lz);
    }
    solid(new THREE.BoxGeometry(7.6, 4.8, 0.5), dark, 0, 7.4, -7.2);        // monitor body
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(6.8, 4),
      new THREE.MeshBasicMaterial({ color: 0xd9f4fb }),
    );
    screen.position.set(0, 7.4, -6.9);
    room.add(screen);
    dossierScreen = screen;
    solid(new THREE.BoxGeometry(1, 1.8, 0.5), dark, 0, 5.2, -7.3);           // monitor stand
    const screenGlow = new THREE.PointLight(0xbfe9f5, 26, 34);
    screenGlow.position.set(0, 7.4, -4.4);
    room.add(screenGlow);
    solid(new THREE.BoxGeometry(4.6, 0.25, 1.7), grey, 0, 4.9, -4.4);        // keyboard
    solid(new THREE.CylinderGeometry(0.4, 0.34, 0.9, 10), white, 4.4, 5.2, -4.6); // mug

    // Bookshelf on the east wall — frame, shelves, books
    solid(new THREE.BoxGeometry(0.8, 10.4, 6.6), white, RW / 2 - 1.3, 5.2, 2.4);
    {
      let seedB = 97;
      const rndB = () => { seedB = (seedB * 1103515245 + 12345) & 0x7fffffff; return seedB / 0x7fffffff; };
      for (let shelf = 0; shelf < 4; shelf++) {
        const y = 2 + shelf * 2.4;
        let bz = -0.4;
        while (bz < 5) {
          const bw = 0.35 + rndB() * 0.4;
          const bh = 1.3 + rndB() * 0.7;
          const tone = 0.35 + rndB() * 0.5;
          solid(
            new THREE.BoxGeometry(0.9, bh, bw),
            new THREE.MeshLambertMaterial({ color: new THREE.Color(tone, tone, tone * 0.97) }),
            RW / 2 - 1.3, y + bh / 2, bz,
          );
          bz += bw + 0.12;
        }
      }
    }

    // Couch + floor lamp on the west side
    solid(new THREE.BoxGeometry(4.2, 1.6, 9), white, -RW / 2 + 3.4, 1.3, 1.5);
    solid(new THREE.BoxGeometry(1.2, 3.2, 9), white, -RW / 2 + 1.9, 2.1, 1.5);
    solid(new THREE.BoxGeometry(4.2, 1, 1.2), white, -RW / 2 + 3.4, 1.8, -3.1);
    solid(new THREE.BoxGeometry(4.2, 1, 1.2), white, -RW / 2 + 3.4, 1.8, 6.1);
    solid(new THREE.CylinderGeometry(0.14, 0.14, 7.6, 8), grey, -RW / 2 + 3.2, 3.8, -6.4);
    solid(new THREE.ConeGeometry(1.3, 1.7, 12, 1, true), white, -RW / 2 + 3.2, 8, -6.4);
    const lampGlow = new THREE.PointLight(0xfff3e0, 15, 26);
    lampGlow.position.set(-RW / 2 + 3.6, 7.2, -6.4);
    room.add(lampGlow);

    // Chair — seat, back, post
    solid(new THREE.BoxGeometry(4, 0.6, 4), dark, 0, 2.9, 0.6);
    solid(new THREE.BoxGeometry(4, 4.6, 0.7), dark, 0, 5.3, 2.6);
    solid(new THREE.CylinderGeometry(0.25, 0.25, 2.6, 8), grey, 0, 1.45, 0.6);

    // Lived-in props: second monitor, framed posters, plant, books, bottle
    solid(new THREE.BoxGeometry(4.4, 3.2, 0.4), dark, -5.2, 6.6, -7, 0.35);   // second monitor
    const screen2 = new THREE.Mesh(new THREE.PlaneGeometry(3.9, 2.7), new THREE.MeshBasicMaterial({ color: 0x1d2b31 }));
    screen2.position.set(-5.05, 6.6, -6.75);
    screen2.rotation.y = 0.35;
    room.add(screen2);
    solid(new THREE.BoxGeometry(3.4, 4.6, 0.25), white, -9, 8.2, -RD / 2 + 0.75);   // posters on the far wall
    solid(new THREE.BoxGeometry(3, 4.2, 0.15), dark, -9, 8.2, -RD / 2 + 0.9);
    solid(new THREE.BoxGeometry(4.6, 3.2, 0.25), white, 8.4, 8.6, -RD / 2 + 0.75);
    solid(new THREE.BoxGeometry(4.2, 2.8, 0.15), grey, 8.4, 8.6, -RD / 2 + 0.9);
    solid(new THREE.CylinderGeometry(1, 1.3, 2.2, 10), grey, RW / 2 - 3, 1.35, -RD / 2 + 3); // planter
    solid(new THREE.SphereGeometry(1.9, 10, 8), new THREE.MeshLambertMaterial({ color: 0x55604a }), RW / 2 - 3, 3.9, -RD / 2 + 3);
    solid(new THREE.BoxGeometry(1.6, 1.1, 2.4), grey, -4.9, 5, -5.2, 0.3);    // book stack on desk
    solid(new THREE.BoxGeometry(1.5, 0.5, 2.2), white, -4.85, 5.8, -5.2, 0.5);
    solid(new THREE.CylinderGeometry(0.3, 0.3, 1.4, 8), white, 5.6, 5.4, -6.2); // bottle
    // Headphones on a stand
    solid(new THREE.CylinderGeometry(0.15, 0.15, 2.6, 6), grey, -8.6, 5.9, -5.4);
    solid(new THREE.SphereGeometry(1, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), dark, -8.6, 7, -5.4);

    // ── The person: solid figure, seated, facing the screen ──
    person = new THREE.Group();
    const skin = new THREE.MeshLambertMaterial({ color: 0xd8d2c4 });
    const cloth = new THREE.MeshLambertMaterial({ color: 0x4a453e });
    const part = (g: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, rx = 0) => {
      const mesh = new THREE.Mesh(g, m);
      mesh.position.set(x, y, z);
      mesh.rotation.x = rx;
      person.add(mesh);
      return mesh;
    };
    part(new THREE.BoxGeometry(3.3, 4.2, 1.9), cloth, 0, 5.4, 0.2);            // torso
    part(new THREE.BoxGeometry(3.7, 1, 2.1), cloth, 0, 7.15, 0.2);             // shoulders
    part(new THREE.SphereGeometry(1.35, 18, 14), skin, 0, 8.55, 0);            // head
    part(new THREE.SphereGeometry(1.42, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2.4), dark, 0, 8.75, -0.12); // hair
    part(new THREE.CylinderGeometry(0.5, 0.6, 0.7, 10), skin, 0, 7.25, 0);     // neck
    part(new THREE.BoxGeometry(0.95, 2.2, 0.95), cloth, -2.1, 5.9, 0, 0.25);   // upper arms down…
    part(new THREE.BoxGeometry(0.95, 2.2, 0.95), cloth, 2.1, 5.9, 0, 0.25);
    part(new THREE.BoxGeometry(0.85, 0.85, 2.6), cloth, -2.15, 4.75, -1.7, -0.12); // …elbows bend to the desk
    part(new THREE.BoxGeometry(0.85, 0.85, 2.6), cloth, 2.15, 4.75, -1.7, -0.12);
    part(new THREE.BoxGeometry(0.9, 0.65, 1.5), skin, -2.1, 4.8, -3.2);        // hands on the keyboard
    part(new THREE.BoxGeometry(0.9, 0.65, 1.5), skin, 2.1, 4.8, -3.2);
    part(new THREE.BoxGeometry(3.1, 1.3, 3.4), cloth, 0, 3.55, -0.9);          // thighs forward
    part(new THREE.BoxGeometry(1.2, 2.6, 1.2), cloth, -0.9, 1.6, -2.2);        // shins
    part(new THREE.BoxGeometry(1.2, 2.6, 1.2), cloth, 0.9, 1.6, -2.2);
    part(new THREE.BoxGeometry(1.3, 0.5, 2.1), dark, -0.9, 0.5, -2.7);         // shoes
    part(new THREE.BoxGeometry(1.3, 0.5, 2.1), dark, 0.9, 0.5, -2.7);
    person.position.set(0, 0, 1.2);
    room.add(person);
    group.add(room);
  }

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
  return { islandGroup: group, buildings: mesh, buildingBase: base, subjectBounds, anchorWorlds, packets, metroPlane, subjectEdges, shellMat, person, roomShells, dossierScreen };
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
  plane.classList.add('xw-desktop--city'); // canvas is the picture; no CSS grid
  plane.insertBefore(renderer.domElement, plane.firstChild);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.FogExp2(BG, 0.0006);

  const camera = new THREE.PerspectiveCamera(50, plane.clientWidth / plane.clientHeight, 5, 30000);
  camera.position.copy(REST_POS);
  camera.lookAt(REST_TARGET);

  scene.add(new THREE.HemisphereLight(0xfff8ec, 0x14110e, 1.25));
  const dir = new THREE.DirectionalLight(0xffffff, 0.55);
  dir.position.set(-400, 600, 300);
  scene.add(dir);

  const { islandGroup, buildings, buildingBase, subjectBounds, anchorWorlds, packets, metroPlane, subjectEdges, shellMat, person, roomShells, dossierScreen } = buildCity(scene);

  // Aircraft markers flying the air routes (region scale, ink triangles).
  const flights: City['flights'] = [];
  {
    const routes: Array<[[number, number], [number, number], number]> = [
      [[-77.037, 38.907], [-71.059, 42.36], 170],
      [[-73.756, 42.653], [-74.006, 40.713], 130],
      [[-75.165, 39.953], [-71.413, 41.824], 150],
    ];
    const triGeo = new THREE.ConeGeometry(16, 42, 3);
    triGeo.rotateX(-Math.PI / 2); // lie flat, nose along -z→heading applied later
    for (const [[lonA, latA], [lonB, latB], speed] of routes) {
      const toWorld = (lon: number, lat: number) =>
        new THREE.Vector3(
          (500 + (lon - PROJ.nyc.lon) * PROJ.pxPerLon - 500) * REGION_SCALE,
          46, // above the region surface, or the plane hides its own traffic
          (350 - (lat - PROJ.nyc.lat) * PROJ.pxPerLat - 350) * REGION_SCALE,
        );
      const a = toWorld(lonA, latA);
      const b = toWorld(lonB, latB);
      const mat = new THREE.MeshBasicMaterial({ color: 0xf4efe6, transparent: true, opacity: 0.85 });
      mat.fog = false;
      const m = new THREE.Mesh(triGeo, mat);
      const heading = Math.atan2(b.x - a.x, b.z - a.z);
      m.rotation.y = heading;
      scene.add(m);
      flights.push({ mesh: m, a, b, total: a.distanceTo(b), speed, phase: Math.abs(heading) * 1000 });
    }
  }

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
  // Center so NYC (map 500,350) sits at the origin. Held WELL above the base
  // plane — at cinematic distances their depth values z-fight otherwise.
  regionPlane.position.set(0, 24, 0);
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

  // Exit control — visible while inside a room.
  const exitBtn = document.createElement('button');
  exitBtn.type = 'button';
  exitBtn.className = 'xw-city-exit';
  exitBtn.innerHTML = '<span aria-hidden="true">\u25c2</span> City';
  exitBtn.addEventListener('click', () => exitRoom());
  plane.appendChild(exitBtn);

  const off = REST_POS.clone().sub(REST_TARGET);
  city = {
    renderer, scene, camera, islandGroup, regionPlane, buildings, buildingBase,
    subjectBounds, anchors, tagLayer, hooks, riseT: 1, packets, metroPlane, subjectEdges,
    shellMat, person, flights,
    rooms: new Map<string, RoomEntry>(),
    mode: 'overhead' as const,
    currentRoom: null,
    exitBtn,
    orbitTarget: REST_TARGET.clone(),
    orbit: {
      az: Math.atan2(off.x, off.z),
      pol: Math.acos(off.y / off.length()),
      r: off.length(),
    },
    clock: new THREE.Clock(),
  };

  // Room registry: interior camera + look targets from the REAL transforms.
  {
    islandGroup.updateMatrixWorld(true);
    const q2 = islandGroup.quaternion;
    const fwd2 = new THREE.Vector3(0, 0, 1).applyQuaternion(q2);
    const right2 = new THREE.Vector3(1, 0, 0).applyQuaternion(q2);
    const register = (id: string, sm: THREE.MeshLambertMaterial, build: RoomBuild | null, screenMesh: THREE.Mesh | null) => {
      const world = anchorWorlds.get(id);
      if (!world) return;
      const center = world.clone().setY(0);
      let camIn: THREE.Vector3;
      let camLook: THREE.Vector3;
      if (build?.camLocal) {
        camIn = build.group.localToWorld(build.camLocal.pos.clone());
        camLook = build.group.localToWorld(build.camLocal.look.clone());
      } else {
        camIn = center.clone().setY(10.5)
          .add(fwd2.clone().multiplyScalar(7.2))
          .add(right2.clone().multiplyScalar(9.5));
        camLook = new THREE.Vector3();
        if (screenMesh) screenMesh.getWorldPosition(camLook);
        else camLook.copy(center).setY(6);
      }
      const offR = camIn.clone().sub(camLook);
      const leds: THREE.Mesh[] = [];
      build?.group.traverse((o) => {
        if ((o as THREE.Mesh).isMesh && o.userData.blinkPhase !== undefined) leds.push(o as THREE.Mesh);
      });
      city!.rooms.set(id, {
        shellMat: sm, build, center, camIn, camLook,
        screenMesh: build?.screen ?? screenMesh,
        orbit: {
          az: Math.atan2(offR.x, offR.z),
          pol: Math.acos(THREE.MathUtils.clamp(offR.y / offR.length(), -1, 1)),
          r: offR.length(),
        },
        leds,
      });
    };
    register('dossier', shellMat, null, dossierScreen);
    for (const [id, entry] of roomShells) register(id, entry.shellMat, entry.build, entry.screen);
  }

  // Featured previews onto the projects display wall (real images, real ids).
  void fetch('/api/projects')
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then((projects: Array<{ id: string; image?: string; featured?: boolean }>) => {
      const entry = city?.rooms.get('projects');
      if (!entry?.build) return;
      const featured = projects.filter((pr) => pr.featured && pr.image).slice(0, entry.build.displays.length);
      const loader = new THREE.TextureLoader();
      featured.forEach((pr, i) => {
        const d = entry.build!.displays[i];
        if (!d) return;
        d.projectId = pr.id;
        loader.load(pr.image!, (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          (d.mesh.material as THREE.MeshBasicMaterial).map = tex;
          (d.mesh.material as THREE.MeshBasicMaterial).color.set(0xffffff);
          (d.mesh.material as THREE.MeshBasicMaterial).needsUpdate = true;
        });
      });
    })
    .catch(() => { /* displays stay dark */ });

  // Clickable in-room surfaces (displays, the live cabinet).
  renderer.domElement.addEventListener('click', (e) => {
    if (!city || city.mode !== 'room') return;
    const rect = renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, city.camera);
    const entry = city.rooms.get(city.currentRoom ?? '');
    if (!entry) return;
    if (entry.screenMesh) {
      if (ray.intersectObject(entry.screenMesh, false).length > 0) {
        city.hooks.openApp(city.currentRoom ?? '', boundsScreenRect(new THREE.Box3().setFromObject(entry.screenMesh)));
        return;
      }
    }
    if (!entry.build) return;
    if (city.currentRoom === 'projects') {
      const hits = ray.intersectObjects(entry.build.displays.map((d) => d.mesh), false);
      const first = hits[0];
      if (first) {
        const d = entry.build.displays.find((x) => x.mesh === first.object);
        if (d?.projectId) city.hooks.openProjectRecord?.(d.projectId);
      }
    }
    if (city.currentRoom === 'arcade' && entry.build.cabinet) {
      if (ray.intersectObject(entry.build.cabinet, false).length > 0) {
        city.hooks.openCapture?.('Minesweeper', '/hosted/minesweeper/');
      }
    }
  });

  // The background is rotatable: dragging the canvas orbits the camera.
  bindOrbitDrag(renderer.domElement);

  const onResize = () => {
    if (!city) return;
    const w = plane.clientWidth;
    const h = plane.clientHeight;
    city.renderer.setSize(w, h);
    city.camera.aspect = w / h;
    city.camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', onResize);
  // The mobile map panel resizes without a window resize (fullscreen intro →
  // in-flow panel). Track the container itself.
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => onResize()).observe(plane);
  }

  // If the intro flight is pending, pre-park the camera at its start so the
  // boot fade never glimpses the desktop view (buildings down, geography up).
  if (document.body.classList.contains('xw-introing')) {
    introActive = true;
    camera.position.set(60, 5600, 1500);
    camera.lookAt(0, 0, 0);
    regionPlane.material.opacity = 1;
    applyRise(city, 0);
    islandGroup.visible = false;
    metroPlane.visible = false;
  } else {
    flights.forEach((f) => { f.mesh.visible = false; });
  }

  // Full animation always (project rule): the loop runs unconditionally and
  // pauses only while the tab is hidden.
  renderer.setAnimationLoop(tick);
  document.addEventListener('visibilitychange', () => {
    if (!city) return;
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
  city.islandGroup.visible = true;
  city.metroPlane.visible = true;
  city.flights.forEach((f) => { f.mesh.visible = false; });
  (city.subjectEdges.material as THREE.LineBasicMaterial).opacity = 0;
  city.shellMat.opacity = 1;
  city.shellMat.transparent = false;
  roomTl?.kill();
  city.rooms.forEach((r) => {
    r.shellMat.opacity = 1;
    r.shellMat.transparent = false;
  });
  setMode('overhead');
  if (city.camera.near !== 5) {
    city.camera.near = 5;
    city.camera.updateProjectionMatrix();
  }
  city.orbitTarget.copy(REST_TARGET);
  showTags(); // renders a fresh frame + positions tags (covers static mode)
}

function tick(): void {
  if (!city) return;
  const t = city.clock.getElapsedTime();
  if (!introActive && city.mode === 'room') {
    const entry = city.rooms.get(city.currentRoom ?? '');
    if (entry) {
      // Look-around orbit inside the room (drag to look), plus handheld sway.
      const o = entry.orbit;
      city.camera.position.set(
        entry.camLook.x + o.r * Math.sin(o.pol) * Math.sin(o.az),
        entry.camLook.y + o.r * Math.cos(o.pol),
        entry.camLook.z + o.r * Math.sin(o.pol) * Math.cos(o.az),
      );
      city.camera.position.x += Math.sin(t * 0.4) * 0.22;
      city.camera.position.y += Math.sin(t * 0.31) * 0.15;
      city.camera.lookAt(entry.camLook);
      for (const led of entry.leds) {
        (led.material as THREE.MeshBasicMaterial).opacity =
          0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * 2.4 + (led.userData.blinkPhase as number)));
      }
    }
  } else if (!introActive && city.mode === 'overhead') {
    // Camera orbits a MOVING focus (rest point, or the building being visited),
    // breathing slightly — a system idly watching.
    const az = city.orbit.az + Math.sin(t * 0.07) * 0.045;
    const pol = city.orbit.pol + Math.sin(t * 0.06) * 0.012;
    const r = city.orbit.r;
    const o = city.orbitTarget;
    city.camera.position.set(
      o.x + r * Math.sin(pol) * Math.sin(az),
      o.y + r * Math.cos(pol),
      o.z + r * Math.sin(pol) * Math.cos(az),
    );
    city.camera.lookAt(o);
  }
  // Aircraft glide their air routes (region scale).
  for (const fl of city.flights) {
    const d = ((t * fl.speed + fl.phase) % fl.total) / fl.total;
    fl.mesh.position.lerpVectors(fl.a, fl.b, d);
  }
  // Data packets travel their arteries.
  for (const pk of city.packets) {
    const d = (t * pk.speed + pk.phase) % pk.total;
    let i = 1;
    while (i < pk.lens.length - 1 && pk.lens[i]! < d) i++;
    const segStart = pk.lens[i - 1]!;
    const frac = (d - segStart) / (pk.lens[i]! - segStart);
    pk.mesh.position.lerpVectors(pk.pts[i - 1]!, pk.pts[i]!, frac);
  }
  city.renderer.render(city.scene, city.camera);
  updateTags();
}

/** Drag-to-rotate: azimuth free, polar clamped so the city never flips. */
function bindOrbitDrag(el: HTMLElement): void {
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  el.classList.add('xw-city-canvas--grab');
  el.addEventListener('pointerdown', (e) => {
    if (introActive || !city || city.mode === 'diving') return;
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    el.setPointerCapture(e.pointerId);
    el.classList.add('xw-city-canvas--grabbing');
  });
  el.addEventListener('pointermove', (e) => {
    if (!dragging || !city) return;
    if (city.mode === 'room') {
      const entry = city.rooms.get(city.currentRoom ?? '');
      if (entry) {
        entry.orbit.az -= (e.clientX - lastX) * 0.0038;
        entry.orbit.pol = THREE.MathUtils.clamp(entry.orbit.pol + (e.clientY - lastY) * 0.0024, 0.55, 1.5);
      }
    } else {
      city.orbit.az -= (e.clientX - lastX) * 0.0042;
      city.orbit.pol = THREE.MathUtils.clamp(city.orbit.pol + (e.clientY - lastY) * 0.0026, 0.32, 1.32);
    }
    lastX = e.clientX;
    lastY = e.clientY;
  });
  const stop = () => {
    dragging = false;
    el.classList.remove('xw-city-canvas--grabbing');
  };
  el.addEventListener('pointerup', stop);
  el.addEventListener('pointercancel', stop);
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

let roomTl: gsap.core.Timeline | null = null;

function setMode(mode: 'overhead' | 'diving' | 'room', roomId: string | null = null): void {
  if (!city) return;
  city.mode = mode;
  city.currentRoom = roomId;
  city.exitBtn.classList.toggle('xw-city-exit--on', mode === 'room');
  // Map tags belong to the overhead view — inside they're floating noise.
  city.tagLayer.classList.toggle('xw-city-tags--away', mode !== 'overhead');
}

/** Fly INTO an app's room: over the roof, through the fading facade, settle
 *  on the interior view. Resolves with the in-scene screen's viewport rect. */
export function diveIntoRoom(id: string, onArrive: (screenRect: DOMRect | null) => void): boolean {
  if (!city || introActive) return false;
  const entry = city.rooms.get(id);
  if (!entry) return false;
  roomTl?.kill();
  setMode('diving', id);

  const c = city;
  const start = c.camera.position.clone();
  const startLook = c.orbitTarget.clone();
  const topY = 66;
  const over = entry.center.clone().setY(topY).add(entry.camIn.clone().sub(entry.center).setY(0).multiplyScalar(0.6));
  const path = new THREE.CatmullRomCurve3([start, over, entry.camIn], false, 'centripetal');
  const fl = { t: 0 };
  roomTl = gsap.timeline({
    onComplete: () => {
      setMode('room', id);
      const sm = entry.screenMesh;
      onArrive(sm ? boundsScreenRect(new THREE.Box3().setFromObject(sm)) : null);
    },
  });
  roomTl.to(fl, {
    t: 1,
    duration: 1.4,
    ease: 'power2.inOut',
    onUpdate: () => {
      const pos = path.getPoint(fl.t);
      c.camera.position.copy(pos);
      const look = startLook.clone().lerp(entry.camLook, THREE.MathUtils.smoothstep(fl.t, 0.25, 0.9));
      c.camera.lookAt(look);
      const dist = pos.distanceTo(entry.center.clone().setY(pos.y * 0.4));
      const fade = THREE.MathUtils.clamp((dist - 22) / 90, 0, 1);
      if (fade < 1) entry.shellMat.transparent = true;
      entry.shellMat.opacity = fade;
      const near = pos.y < 60 ? 0.8 : 5;
      if (c.camera.near !== near) {
        c.camera.near = near;
        c.camera.updateProjectionMatrix();
      }
    },
  });
  return true;
}

/** Dock behavior: dive into the app's room AND hand back the screen rect so
 *  the caller opens the window. Chains out of another room first. */
export function dockDive(id: string, onArrive: (screenRect: DOMRect | null) => void): boolean {
  if (!city || introActive) return false;
  if (city.mode === 'room' && city.currentRoom === id) {
    const entry = city.rooms.get(id);
    const sm = entry?.screenMesh;
    onArrive(sm ? boundsScreenRect(new THREE.Box3().setFromObject(sm)) : null);
    return true;
  }
  if (city.mode === 'room' || city.mode === 'diving') {
    exitRoom(true);
    gsap.delayedCall(0.6, () => {
      if (!diveIntoRoom(id, onArrive)) onArrive(null);
    });
    return true;
  }
  return diveIntoRoom(id, onArrive);
}

/** Leave the current room: ascend out, facade heals, overhead orbit resumes. */
export function exitRoom(fast = false): void {
  if (!city) return;
  const c = city;
  const entry = c.rooms.get(c.currentRoom ?? '');
  roomTl?.kill();
  if (!entry || c.mode === 'overhead') {
    setMode('overhead');
    return;
  }
  setMode('diving', null);
  const from = c.camera.position.clone();
  const fl = { t: 0 };
  roomTl = gsap.timeline({
    onComplete: () => {
      entry.shellMat.opacity = 1;
      entry.shellMat.transparent = false;
      setMode('overhead');
      // Hand the orbit back where the camera actually is.
      const off2 = REST_POS.clone().sub(REST_TARGET);
      c.orbit.az = Math.atan2(off2.x, off2.z);
      c.orbit.pol = Math.acos(off2.y / off2.length());
      c.orbit.r = off2.length();
      c.orbitTarget.copy(REST_TARGET);
    },
  });
  roomTl.to(fl, {
    t: 1,
    duration: fast ? 0.55 : 1.0,
    ease: 'power2.inOut',
    onUpdate: () => {
      c.camera.position.lerpVectors(from, REST_POS, fl.t);
      const look = entry.camLook.clone().lerp(REST_TARGET, THREE.MathUtils.smoothstep(fl.t, 0.15, 0.8));
      c.camera.lookAt(look);
      const dist = c.camera.position.distanceTo(entry.center.clone().setY(c.camera.position.y * 0.4));
      const fade = THREE.MathUtils.clamp((dist - 22) / 90, 0, 1);
      entry.shellMat.opacity = fade;
      if (fade >= 1) entry.shellMat.transparent = false;
      const near = c.camera.position.y < 60 ? 0.8 : 5;
      if (c.camera.near !== near) {
        c.camera.near = near;
        c.camera.updateProjectionMatrix();
      }
    },
  });
}

/** Travel the orbit focus TO an anchor's building (interiors phase 1). */
function diveToward(world: THREE.Vector3): void {
  if (!city) return;
  // Keep the current bearing so the camera slides over rather than whipping around.
  let az = Math.atan2(city.camera.position.x - world.x, city.camera.position.z - world.z);
  az += Math.round((city.orbit.az - az) / (Math.PI * 2)) * Math.PI * 2;
  gsap.to(city.orbit, { az, pol: 1.0, r: 230, duration: 0.8, ease: 'power2.inOut' });
  gsap.to(city.orbitTarget, {
    x: world.x,
    y: Math.min(world.y * 0.5, 50),
    z: world.z,
    duration: 0.8,
    ease: 'power2.inOut',
  });
}

/** Dock/nav hook: swing the camera to an app's building without opening it. */
export function diveTowardApp(id: string): void {
  if (!city || introActive) return;
  const a = city.anchors.find((x) => x.spec.id === id);
  if (a) diveToward(a.world);
}

function openFromTag(spec: AppAnchor, tag: HTMLElement): void {
  if (!city) return;
  // Tags VISIT — the dive only; windows open from the dock or from clicking
  // surfaces inside the room (open policy per design session).
  if (diveIntoRoom(spec.id, () => undefined)) {
    return;
  }
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

function boundsScreenRect(b: THREE.Box3): DOMRect | null {
  if (!city) return null;
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
    <span class="xw-zi-crossline xw-zi-crossline--h" id="xw-zi-cross-h" aria-hidden="true"></span>
    <span class="xw-zi-crossline xw-zi-crossline--v" id="xw-zi-cross-v" aria-hidden="true"></span>
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
    <span class="xw-zi-brand" aria-hidden="true"><i>xiao</i>OS</span>
    <div class="xw-zi-type" id="xw-zi-type" aria-hidden="true">
      <span class="xw-zi-type-l1" id="xw-zi-type-l1"></span>
      <span class="xw-zi-type-l2" id="xw-zi-type-l2"></span>
    </div>
    <div class="xw-zi-flash" id="xw-zi-flash" aria-hidden="true"></div>
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
  const typeCard = overlay.querySelector<HTMLElement>('#xw-zi-type')!;
  const typeL1 = overlay.querySelector<HTMLElement>('#xw-zi-type-l1')!;
  const typeL2 = overlay.querySelector<HTMLElement>('#xw-zi-type-l2')!;

  gsap.set('.xw-zi-bkt, #xw-zi-lockrect, #xw-zi-connector, #xw-zi-card', { autoAlpha: 0 });
  gsap.set(hbox, { autoAlpha: 0 });
  gsap.set(typeCard, { autoAlpha: 0 });

  const setStatus = (s: string) => { status.textContent = s; };

  /* Kinetic type narration (MK12 grammar): huge two-line cards riding the dive. */
  const typeIn = (l1: string, l2: string) => {
    typeL1.textContent = l1;
    typeL2.textContent = l2;
    gsap.fromTo(typeCard, { autoAlpha: 0, x: 60 }, { autoAlpha: 1, x: 0, duration: 0.28, ease: 'power3.out' });
  };
  const typeOut = () => {
    gsap.to(typeCard, { autoAlpha: 0, x: -80, duration: 0.24, ease: 'power3.in' });
  };

  /* White inversion flash — the capture beat. */
  const flashEl = overlay.querySelector<HTMLElement>('#xw-zi-flash')!;
  const flash = () => {
    gsap.fromTo(flashEl, { opacity: 0 }, { opacity: 0.9, duration: 0.05, yoyo: true, repeat: 1 });
  };



  // Camera path: start SOUTH of the target looking north (map reads north-up),
  // drift gently left on the way down — then keep going: through the facade,
  // into the room, to the person at the screen. The dive never settles.
  const q = c.islandGroup.quaternion;
  const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(q); // room "behind the person"
  const bCenter = c.subjectBounds.getCenter(new THREE.Vector3());
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(q);
  const entry = bCenter.clone().setY(c.subjectBounds.max.y + 40).add(fwd.clone().multiplyScalar(22));
  // Diagonal corner view INSIDE the walls: desk, person, and couch in frame.
  const inside = bCenter.clone().setY(10.5)
    .add(fwd.clone().multiplyScalar(7.8))
    .add(right.clone().multiplyScalar(10.5));
  const lookRoof = bCenter.clone().setY(c.subjectBounds.max.y);
  const lookPerson = bCenter.clone().setY(6.2).sub(fwd.clone().multiplyScalar(2));
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(60, 5600, 1500),
    new THREE.Vector3(-420, 3100, 1500),
    new THREE.Vector3(-360, 1300, 1000),
    new THREE.Vector3(60, 560, 660),
    entry,
    inside,
  ], false, 'centripetal');
  const lookFrom = new THREE.Vector3(0, 0, 0);
  const flight = { t: 0 };

  let shellFlashed = false;
  const setCam = () => {
    const pos = path.getPoint(flight.t);
    c.camera.position.copy(pos);
    // Piecewise look target: geography → the subject's roof → the person.
    const t = flight.t;
    const target = new THREE.Vector3();
    if (t < 0.6) target.copy(lookFrom).lerp(lookRoof, t / 0.6);
    else if (t < 0.85) target.copy(lookRoof).lerp(lookPerson, (t - 0.6) / 0.25);
    else target.copy(lookPerson);
    c.camera.lookAt(target);
    // Facade fades as the camera closes; a single blink as we cross it.
    const dist = pos.distanceTo(bCenter);
    const fade = THREE.MathUtils.clamp((dist - 26) / 120, 0, 1);
    if (fade < 1) c.shellMat.transparent = true;
    c.shellMat.opacity = fade;
    if (!shellFlashed && fade < 0.45) {
      shellFlashed = true;
      flash();
    }
    // Subject edges glow on approach, hand off to the interior at the end.
    const em = c.subjectEdges.material as THREE.LineBasicMaterial;
    em.opacity = THREE.MathUtils.clamp((900 - dist) / 500, 0, 1) * THREE.MathUtils.clamp((dist - 30) / 40, 0, 1) * 0.9;
    // Interior needs a tighter near plane than the cinematic sky does.
    const near = pos.y < 140 ? 0.8 : 5;
    if (c.camera.near !== near) {
      c.camera.near = near;
      c.camera.updateProjectionMatrix();
    }
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
    // Scale gate: street-scale layers don't exist at region altitude (they'd
    // render as fog-black streaks over the unfogged geography).
    const cityScale = pos.y < 2600;
    c.islandGroup.visible = cityScale;
    c.metroPlane.visible = cityScale;
    c.flights.forEach((f) => { f.mesh.visible = !cityScale; });
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

  // Targeting system: viewport-spanning crosshair snaps between candidates,
  // bracket box at the intersection, then flips to LOCK on the target.
  const crossH = overlay.querySelector<HTMLElement>('#xw-zi-cross-h')!;
  const crossV = overlay.querySelector<HTMLElement>('#xw-zi-cross-v')!;
  const placeTarget = (screen: { x: number; y: number }, size: number, label: string, locked = false) => {
    overlay.classList.toggle('xw-zi-target-lock', locked);
    gsap.set(crossH, { autoAlpha: 1, top: screen.y });
    gsap.set(crossV, { autoAlpha: 1, left: screen.x });
    gsap.set(hbox, {
      autoAlpha: 1,
      left: screen.x - size / 2,
      top: screen.y - size / 2,
      width: size,
      height: size,
    });
    chip.textContent = locked ? `${label} — TARGET LOCK` : `${label} — SCANNING`;
    chip.style.left = `${screen.x + size / 2 + 12}px`;
    chip.style.top = `${screen.y - size / 2 - 4}px`;
    gsap.set(chip, { opacity: 1 });
  };
  const hideBox = () => {
    gsap.set([hbox, crossH, crossV], { autoAlpha: 0 });
    gsap.set(chip, { opacity: 0 });
    overlay.classList.remove('xw-zi-target-lock');
  };
  const glitch = () => {
    gsap.fromTo('.xw-city-canvas', { x: gsap.utils.random(-4, 4, 1) }, { x: 0, duration: 0.07 });
  };

  // Tiny true-coordinate labels — instrument texture on the geography.
  const microLabels: HTMLElement[] = [];
  const metrosForMicro: Array<[number, number]> = [
    [-71.059, 42.36], [-77.037, 38.907], [-75.165, 39.953], [-74.006, 40.713],
  ];
  for (const [lon, lat] of metrosForMicro) {
    const world = mapToWorld(500 + (lon - PROJ.nyc.lon) * PROJ.pxPerLon, 350 - (lat - PROJ.nyc.lat) * PROJ.pxPerLat);
    const scr = project(world);
    const el = document.createElement('span');
    el.className = 'xw-zi-micro';
    el.textContent = `${lat.toFixed(2)}N ${Math.abs(lon).toFixed(2)}W`;
    el.style.left = `${scr.x + 14}px`;
    el.style.top = `${scr.y + 10}px`;
    overlay.appendChild(el);
    microLabels.push(el);
  }
  gsap.set(microLabels, { autoAlpha: 0 });

  const candidates: Array<[number, number, string]> = [
    [-71.059, 42.36, 'BOSTON METRO'],
    [-77.037, 38.907, 'WASHINGTON METRO'],
    [-75.165, 39.953, 'PHILADELPHIA METRO'],
  ];

  const tl = gsap.timeline();
  tl.add(() => setStatus('Acquiring — northeast corridor'), 0)
    .to(microLabels, { autoAlpha: 0.85, duration: 0.3, stagger: 0.06 }, 0.35)
    .to(overlay, { '--xw-zi-veil': 0, duration: 0.01 }, 0);

  candidates.forEach(([lon, lat, label]) => {
    tl.add(() => {
      const world = mapToWorld(500 + (lon - PROJ.nyc.lon) * PROJ.pxPerLon, 350 - (lat - PROJ.nyc.lat) * PROJ.pxPerLat);
      placeTarget(project(world), 92, label);
      glitch();
    }).to({}, { duration: 0.14 });
  });
  tl.add(() => {
    placeTarget(project(new THREE.Vector3(0, 3, 0)), 120, 'NEW YORK METRO', true);
    flash();
  })
    .to({}, { duration: 0.3 })
    .add(() => {
      hideBox();
      setStatus('Target — New York metro');
    })
    // The one continuous dive.
    .to(microLabels, { autoAlpha: 0, duration: 0.25 }, '<')
    .to(flight, { t: 1, duration: 4.0, ease: 'power2.inOut', onUpdate: setCam }, '<')
    .add(() => typeIn('NEW YORK,', 'NY.'), '<+0.2')
    .add(() => typeOut(), '<+0.85')
    .add(() => typeIn('8,584,629', 'PEOPLE.'), '<+0.35')
    .add(() => typeOut(), '<+0.85')
    .add(() => typeIn('ONE', 'SUBJECT.'), '<+0.35')
    .add(() => typeOut(), '<+0.75')
    .add(() => setStatus('Grid — Manhattan'), '<40%')
    .add(() => setStatus('Entering — subject residence'), '<78%')
    .add(glitch, '<10%')
    .add(() => {
      lockOn();
    });

  /* Lock-on finale: an entity HITBOX draws around the person at the screen —
     game-style target labeling — then the subject's information card fires. */
  const lockOn = () => {
    if (finished) return;
    const raw = boundsScreenRect(new THREE.Box3().setFromObject(c.person));
    if (!raw) { finish(false); return; }
    setStatus('Subject identified');
    // The box HUGS the figure (small pad); cap only pathological sizes.
    const pad = 10;
    const w = Math.min(raw.width + pad * 2, window.innerWidth * 0.8);
    const h = Math.min(raw.height + pad * 2, window.innerHeight * 0.8);
    const pr = new DOMRect(raw.left + raw.width / 2 - w / 2, raw.top + raw.height / 2 - h / 2, w, h);
    hbox.classList.add('xw-zi-hbox--entity');
    hbox.innerHTML = '<span class="xw-zi-hbox-head" id="xw-zi-hbox-head">SUBJECT — SCANNING…</span>';
    gsap.set(hbox, {
      autoAlpha: 1,
      left: pr.left,
      top: pr.top,
      width: pr.width,
      height: pr.height,
    });
    gsap.from(hbox, { scale: 1.35, opacity: 0, duration: 0.22, ease: 'power3.out' });
    glitch();

    const ltl = gsap.timeline();
    ltl
      .to({}, { duration: 0.5 })
      .add(() => {
        if (finished) { ltl.kill(); return; }
        overlay.classList.add('xw-zi-lock--captured');
        const head = overlay.querySelector<HTMLElement>('#xw-zi-hbox-head');
        if (head) head.textContent = 'XIAO, DAVID — IDENTIFIED';
        gsap.set(card, {
          left: Math.max(8, Math.min(pr.right + 30, window.innerWidth - 320)),
          top: Math.max(64, Math.min(pr.top, window.innerHeight - 180)),
        });
      })
      .fromTo(card, { autoAlpha: 0, x: -10 }, { autoAlpha: 1, x: 0, duration: 0.22 })
      .add(() => setStatus('Subject located — opening file'))
      .to({}, { duration: 0.85 })
      .add(() => cardToWindow());
  };

  const pullBackToRest = () => {
    const from = c.camera.position.clone();
    const pull = { k: 0 };
    gsap.to(pull, {
      k: 1,
      duration: 0.9,
      ease: 'power2.inOut',
      onUpdate: () => {
        c.camera.position.lerpVectors(from, REST_POS, pull.k);
        const lt = new THREE.Vector3().lerpVectors(lookPerson, REST_TARGET, pull.k);
        c.camera.lookAt(lt);
        const dist = c.camera.position.distanceTo(bCenter);
        const fade = THREE.MathUtils.clamp((dist - 26) / 120, 0, 1);
        c.shellMat.opacity = fade;
        if (fade >= 1) c.shellMat.transparent = false;
        const near = c.camera.position.y < 140 ? 0.8 : 5;
        if (c.camera.near !== near) {
          c.camera.near = near;
          c.camera.updateProjectionMatrix();
        }
      },
      onComplete: () => {
        introActive = false; // hand the camera to the desktop orbit
      },
    });
  };

  const cardToWindow = () => {
    if (finished) return;
    finished = true;
    document.removeEventListener('keydown', onKey);
    // The hidden window still has layout — measure it WITHOUT revealing yet;
    // the Dossier must not appear until the card lands on it.
    const winEl = document.querySelector<HTMLElement>('.xw-window[data-app="dossier"]');
    const target = winEl?.getBoundingClientRect();
    const edgeMat = c.subjectEdges.material as THREE.LineBasicMaterial;
    const mtl = gsap.timeline({ onComplete: () => overlay.remove() });
    mtl.to('.xw-zi-readout, #xw-zi-status, #xw-zi-chip, .xw-zi-skip, .xw-zi-sweep, .xw-zi-bkt, #xw-zi-lockrect, #xw-zi-connector', {
      opacity: 0, duration: 0.18,
    });
    if (!target || target.width === 0) {
      mtl.add(() => {
        reveal();
        pullBackToRest();
      }, '<+0.1').to(overlay, { opacity: 0, duration: 0.3 }, '<');
      return;
    }
    mtl
      .to('.xw-zi-card-photo, .xw-zi-card-body', { opacity: 0, duration: 0.22 }, '<')
      .to(card, {
        left: target.left, top: target.top, width: target.width, height: target.height,
        duration: 0.55, ease: 'power3.inOut',
      }, '<+0.05')
      .add(() => {
        gsap.to(edgeMat, { opacity: 0, duration: 0.4 });
        reveal(); // the window appears exactly where the card landed
        pullBackToRest(); // the camera glides out of the room behind it
      })
      .to(overlay, { opacity: 0, duration: 0.35 });
  };

  return true;
}
