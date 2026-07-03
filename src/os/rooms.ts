/**
 * App room interiors (interiors phase 2 — docs/interiors-plan.md).
 *
 * Each App's building contains a procedural, SOLID-geometry room in the city's
 * material language. Rooms share a construction kit; each returns its "screen"
 * surface — the in-scene display the app's window grows out of (decision:
 * dock-then-detach) — plus any interactive surfaces (project displays, the
 * live arcade cabinet).
 *
 * Everything is deterministic and asset-free except the project display
 * textures, which are the projects' real preview images (fetched from
 * /api/projects — true content, not decoration).
 */

import * as THREE from 'three';

export interface RoomBuild {
  group: THREE.Group;
  /** The surface the app window is born from. */
  screen: THREE.Mesh;
  /** Clickable display meshes → project ids (projects room only). */
  displays: Array<{ mesh: THREE.Mesh; projectId: string }>;
  /** The one functional arcade cabinet's screen (arcade room only). */
  cabinet: THREE.Mesh | null;
  /** Preferred interior camera, room-local coords. */
  camLocal: { pos: THREE.Vector3; look: THREE.Vector3 };
}

const white = () => new THREE.MeshLambertMaterial({ color: 0xe9e4d8 });
const grey = () => new THREE.MeshLambertMaterial({ color: 0x8f8a80 });
const dark = () => new THREE.MeshLambertMaterial({ color: 0x27231f });
const wall = () => new THREE.MeshLambertMaterial({ color: 0x3a352f });
const glow = (color = 0xd9f4fb) => new THREE.MeshBasicMaterial({ color });

function lcg(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function shellRoom(group: THREE.Group, w: number, d: number, wallH = 13): void {
  const add = (g: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number) => {
    const mesh = new THREE.Mesh(g, m);
    mesh.position.set(x, y, z);
    group.add(mesh);
  };
  add(new THREE.BoxGeometry(w, 0.5, d), dark(), 0, 0.25, 0);
  add(new THREE.BoxGeometry(w, wallH, 0.6), wall(), 0, wallH / 2, -d / 2);
  add(new THREE.BoxGeometry(w, wallH, 0.6), wall(), 0, wallH / 2, d / 2);
  add(new THREE.BoxGeometry(0.6, wallH, d), wall(), -w / 2, wallH / 2, 0);
  add(new THREE.BoxGeometry(0.6, wallH, d), wall(), w / 2, wallH / 2, 0);
}

function mesh(
  group: THREE.Group, g: THREE.BufferGeometry, m: THREE.Material,
  x: number, y: number, z: number, ry = 0,
): THREE.Mesh {
  const ms = new THREE.Mesh(g, m);
  ms.position.set(x, y, z);
  ms.rotation.y = ry;
  group.add(ms);
  return ms;
}

/* ── PROJECTS: server room with an interactive display wall ──────────────── */

export function buildProjectsRoom(w: number, d: number, projectCount: number): RoomBuild {
  const group = new THREE.Group();
  shellRoom(group, w, d);
  const rnd = lcg(2077);

  // Rack columns along the WEST wall — sightline to the display wall stays
  // clear. One unit per real project, blinking status LEDs on their faces.
  const rackMat = dark();
  const unitMat = grey();
  let placed = 0;
  const rackX = -w / 2 + 2.2;
  for (let r = 0; r < 2 && placed < projectCount; r++) {
    const zC = -4.2 + r * 8.4;
    mesh(group, new THREE.BoxGeometry(2.4, 8.8, 6.8), rackMat, rackX, 4.4, zC);
    const per = Math.ceil(projectCount / 2);
    for (let i = 0; i < per && placed < projectCount; i++, placed++) {
      const z = zC - 2.9 + (i % 6) * 1.1;
      const y = 1.6 + Math.floor(i / 6) * 2.1 + rnd() * 0.8;
      mesh(group, new THREE.BoxGeometry(0.15, 0.3, 0.8), unitMat, rackX + 1.28, y, z);
      const led = mesh(
        group,
        new THREE.BoxGeometry(0.1, 0.24, 0.24),
        new THREE.MeshBasicMaterial({ color: 0x00d2ff, transparent: true, opacity: 0.4 + rnd() * 0.6 }),
        rackX + 1.28, y + 0.55, z,
      );
      led.userData.blinkPhase = rnd() * Math.PI * 2;
    }
  }

  // Display wall: 2×2 grid of featured screens — fits the interior frustum.
  const displays: RoomBuild['displays'] = [];
  const wallZ = d / 2 - 1.2;
  const sw = 6.6;
  const sh = 3.9;
  for (let i = 0; i < 4; i++) {
    const x = (i % 2 === 0 ? -1 : 1) * (sw / 2 + 0.9);
    const y = i < 2 ? 8.6 : 4.1;
    mesh(group, new THREE.BoxGeometry(sw + 0.6, sh + 0.7, 0.4), dark(), x, y, wallZ);
    const disp = mesh(group, new THREE.PlaneGeometry(sw, sh), glow(0x1a2126), x, y, wallZ - 0.35, Math.PI);
    displays.push({ mesh: disp, projectId: '' });
  }
  // Main console (the window's birthplace) off to the east side of the wall.
  mesh(group, new THREE.BoxGeometry(6, 0.6, 3.4), white(), w / 2 - 4.6, 3.4, wallZ - 3.4);
  mesh(group, new THREE.BoxGeometry(4.6, 3.2, 0.45), dark(), w / 2 - 4.6, 5.6, wallZ - 4.4);
  const screen = mesh(group, new THREE.PlaneGeometry(4.1, 2.7), glow(), w / 2 - 4.6, 5.6, wallZ - 4.12, Math.PI);

  const cool = new THREE.PointLight(0xbfe9f5, 34, 44);
  cool.position.set(0, 9.5, 2);
  group.add(cool);
  const fill = new THREE.PointLight(0xfff3e0, 14, 30);
  fill.position.set(-6, 8, -3);
  group.add(fill);

  return {
    group, screen, displays, cabinet: null,
    // Straight-on view of the display wall from the clear back half.
    camLocal: { pos: new THREE.Vector3(1.5, 7.6, -d / 2 + 2.6), look: new THREE.Vector3(0, 6.2, d / 2 - 1.4) },
  };
}

/* ── RESUME: records office — cabinets + a light table ───────────────────── */

export function buildResumeRoom(w: number, d: number): RoomBuild {
  const group = new THREE.Group();
  shellRoom(group, w, d);
  const rnd = lcg(1961);

  // Filing cabinets along the back wall
  for (let x = -w / 2 + 3; x < w / 2 - 2.5; x += 4.4) {
    mesh(group, new THREE.BoxGeometry(3.6, 9, 3), grey(), x, 4.5, -d / 2 + 2.1);
    for (let dr = 0; dr < 4; dr++) {
      mesh(group, new THREE.BoxGeometry(3.1, 1.7, 0.2), dark(), x, 1.6 + dr * 2.15, -d / 2 + 3.65);
      mesh(group, new THREE.BoxGeometry(1.1, 0.2, 0.25), white(), x, 1.95 + dr * 2.15, -d / 2 + 3.75);
    }
    // One drawer left open, papers inside
    if (rnd() > 0.5) {
      mesh(group, new THREE.BoxGeometry(3, 1.5, 2.4), dark(), x, 5.9, -d / 2 + 4.6);
      mesh(group, new THREE.BoxGeometry(2.6, 0.5, 1.9), white(), x, 6.6, -d / 2 + 4.6);
    }
  }

  // The light table — a glowing document surface (the window's birthplace)
  mesh(group, new THREE.BoxGeometry(11, 0.8, 6.5), white(), 0, 3.6, 2);
  for (const [lx, lz] of [[-4.8, 0.6], [4.8, 0.6], [-4.8, 3.4], [4.8, 3.4]] as Array<[number, number]>) {
    mesh(group, new THREE.BoxGeometry(0.6, 3.2, 0.6), grey(), lx, 1.6, lz + 1);
  }
  const screen = mesh(group, new THREE.PlaneGeometry(4.4, 5.6), glow(0xf2ede2), 0, 4.02, 2);
  screen.rotation.x = -Math.PI / 2;
  // Loose paper stacks
  mesh(group, new THREE.BoxGeometry(2.6, 0.3, 3.4), white(), -3.9, 4.15, 2.6, 0.2);
  mesh(group, new THREE.BoxGeometry(2.6, 0.5, 3.4), white(), 4, 4.25, 1.4, -0.35);

  const warm = new THREE.PointLight(0xfff3e0, 28, 38);
  warm.position.set(0, 9, 2);
  group.add(warm);

  return {
    group, screen, displays: [], cabinet: null,
    camLocal: { pos: new THREE.Vector3(7, 9, 7.5), look: new THREE.Vector3(0, 4.2, 1.2) },
  };
}

/* ── CONTACT: comms console — radio desk + waveform monitor ──────────────── */

export function buildContactRoom(w: number, d: number): RoomBuild {
  const group = new THREE.Group();
  shellRoom(group, w, d);

  // Console bench across the back
  mesh(group, new THREE.BoxGeometry(w - 8, 0.7, 4.6), white(), 0, 3.9, -d / 2 + 3.4);
  mesh(group, new THREE.BoxGeometry(w - 8, 3.6, 0.6), grey(), 0, 1.9, -d / 2 + 3.2);
  // Rack of comms gear
  for (let i = 0; i < 4; i++) {
    mesh(group, new THREE.BoxGeometry(3.4, 0.8, 2.4), dark(), -w / 2 + 5 + i * 0.02, 4.8 + i * 1, -d / 2 + 3.2);
  }
  // Waveform monitor — the window's birthplace
  mesh(group, new THREE.BoxGeometry(7.4, 4.6, 0.5), dark(), 1.5, 7.2, -d / 2 + 2.4);
  const screen = mesh(group, new THREE.PlaneGeometry(6.8, 4), glow(0x142024), 1.5, 7.2, -d / 2 + 2.68);
  // A waveform line on the screen (thin glowing strip)
  mesh(group, new THREE.BoxGeometry(6, 0.12, 0.02), glow(0x00d2ff), 1.5, 7.2, -d / 2 + 2.7);
  // Mast conduit rising through the room (it IS the antenna building)
  mesh(group, new THREE.CylinderGeometry(0.8, 0.8, 12.8, 10), grey(), w / 2 - 3.4, 6.4, 0);
  mesh(group, new THREE.BoxGeometry(4, 0.6, 4), dark(), w / 2 - 3.4, 0.55, 0);
  // Operator chair
  mesh(group, new THREE.BoxGeometry(3.6, 0.6, 3.6), dark(), 0.6, 2.9, -d / 2 + 7.4);
  mesh(group, new THREE.BoxGeometry(3.6, 4, 0.7), dark(), 0.6, 5, -d / 2 + 9.1);

  const cool = new THREE.PointLight(0xbfe9f5, 26, 36);
  cool.position.set(1.5, 8, -d / 2 + 6);
  group.add(cool);
  const warm2 = new THREE.PointLight(0xfff3e0, 12, 26);
  warm2.position.set(-4, 8.5, 4);
  group.add(warm2);

  return {
    group, screen, displays: [], cabinet: null,
    camLocal: { pos: new THREE.Vector3(6, 8.5, 5), look: new THREE.Vector3(1.5, 6.4, -d / 2 + 2.6) },
  };
}

/* ── ARCADE: several cabinets, ONE alive ─────────────────────────────────── */

export function buildArcadeRoom(w: number, d: number): RoomBuild {
  const group = new THREE.Group();
  shellRoom(group, w, d);
  const rnd = lcg(8080);

  let cabinet: THREE.Mesh | null = null;
  let screen: THREE.Mesh | null = null;
  const positions: Array<[number, number, number, boolean]> = [
    // x, z, yRot, functional?
    [-w / 2 + 4.4, -d / 2 + 3.4, 0.35, false],
    [-w / 2 + 9.4, -d / 2 + 2.9, 0.1, true], // THE one that works
    [-w / 2 + 14.4, -d / 2 + 3.5, -0.2, false],
    [w / 2 - 5, -d / 2 + 4, -0.5, false],
    [w / 2 - 4.2, 3, -1.35, false],
  ];
  for (const [x, z, ry, live] of positions) {
    const cab = new THREE.Group();
    cab.position.set(x, 0, z);
    cab.rotation.y = ry;
    const body = new THREE.Mesh(new THREE.BoxGeometry(3.4, 8.6, 3), live ? dark() : grey());
    body.position.y = 4.3;
    cab.add(body);
    const marquee = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.2, 0.6), live ? white() : dark());
    marquee.position.set(0, 8.4, 1.4);
    cab.add(marquee);
    const scr = new THREE.Mesh(
      new THREE.PlaneGeometry(2.6, 2),
      live ? glow(0xd9f4fb) : new THREE.MeshBasicMaterial({ color: 0x14110e }),
    );
    scr.position.set(0, 6.1, 1.53);
    scr.rotation.x = -0.12;
    cab.add(scr);
    const deck = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.5, 1.6), live ? white() : grey());
    deck.position.set(0, 4.6, 1.9);
    cab.add(deck);
    group.add(cab);
    if (live) {
      cabinet = scr;
      screen = scr;
      const cabGlow = new THREE.PointLight(0xbfe9f5, 12, 16);
      cabGlow.position.set(x, 6.5, z + 3);
      group.add(cabGlow);
    }
  }
  // Stools + a floor sign
  mesh(group, new THREE.CylinderGeometry(1, 1, 0.4, 10), white(), -w / 2 + 9.4, 2.4, -d / 2 + 6.6);
  mesh(group, new THREE.CylinderGeometry(0.2, 0.3, 2.2, 8), grey(), -w / 2 + 9.4, 1.1, -d / 2 + 6.6);
  for (let i = 0; i < 3; i++) {
    mesh(group, new THREE.BoxGeometry(1.6, 0.25, 1.6), dark(), 2 + rnd() * 4, 0.55 + i * 0.25, 4 + rnd() * 2);
  }

  const dim = new THREE.PointLight(0xfff3e0, 18, 36);
  dim.position.set(0, 10, 3);
  group.add(dim);

  return {
    group, screen: screen ?? new THREE.Mesh(), displays: [], cabinet,
    camLocal: { pos: new THREE.Vector3(0.5, 7.6, 6.5), look: new THREE.Vector3(-w / 2 + 9.4, 5.6, -d / 2 + 2.4) },
  };
}

export function buildRoomFor(id: string, w: number, d: number, projectCount: number): RoomBuild | null {
  if (id === 'projects') return buildProjectsRoom(w, d, projectCount);
  if (id === 'resume') return buildResumeRoom(w, d);
  if (id === 'contact') return buildContactRoom(w, d);
  if (id === 'arcade') return buildArcadeRoom(w, d);
  return null;
}
