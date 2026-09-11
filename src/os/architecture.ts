import * as THREE from 'three';
import { FINISH as F, ModelKit } from './modelKit';

export interface BuildingLot { x: number; z: number; w: number; d: number; h: number; landmark?: 'empire' | 'chrysler' | 'trade' }

/** Lots per slice. Sized so no slice approaches a dropped frame on mid hardware. */
export const SKYLINE_SLICE = 48;

/**
 * Build the skyline in bounded slices instead of one blocking task at mount.
 * `schedule` decides when the next slice runs (rAF in the browser, immediate in
 * tests); the merged batches only reach `target` once the last slice lands, so
 * the skyline still costs one draw per finish.
 */
export function buildSkyline(
  target: THREE.Group,
  lots: Array<{ lot: BuildingLot; index: number }>,
  schedule: (slice: () => void) => void,
): void {
  const kit = new ModelKit();
  let cursor = 0;
  const slice = (): void => {
    const end = Math.min(cursor + SKYLINE_SLICE, lots.length);
    for (; cursor < end; cursor++) {
      const entry = lots[cursor]!;
      addBuilding(kit, entry.lot, entry.index);
    }
    kit.compact();
    if (cursor < lots.length) schedule(slice);
    else kit.finish(target);
  };
  if (lots.length === 0) return;
  schedule(slice);
}

/** A miniature, not a GIS model: 1916-style setbacks, lofts and curtain walls. */
export function addBuilding(kit: ModelKit, p: BuildingLot, index: number): void {
  const { x, z, w, d, h } = p;
  const tower = h > 48;
  const deco = tower && index % 3 !== 0;
  const podium = tower ? h * 0.24 : h;
  kit.box(w, podium, d, x, podium / 2, z, F.stone);
  kit.box(w + 0.8, 0.8, d + 0.8, x, 0.8, z, F.metal);
  let roofW = w, roofD = d;
  if (tower) {
    const tiers = deco ? 3 : 1;
    for (let tier = 0; tier < tiers; tier++) {
      roofW = w * (0.8 - tier * 0.16);
      roofD = d * (0.84 - tier * 0.14);
      const tierH = (h - podium) / tiers;
      const bottom = podium + tier * tierH;
      kit.box(roofW, tierH, roofD, x, bottom + tierH / 2, z, deco ? F.stone : F.metal);
      kit.box(roofW + 0.6, 0.7, roofD + 0.6, x, bottom + tierH, z, F.trim);
      // Recessed horizontal glazing, interrupted by real vertical piers.
      for (let y = bottom + 2.2; y < bottom + tierH - 1; y += 4.2) {
        for (const side of [-1, 1]) {
          kit.add(new THREE.PlaneGeometry(roofW - 1, 1.2), F.recess, x, y, z + side * (roofD / 2 + 0.05), new THREE.Euler(0, side < 0 ? Math.PI : 0, 0));
          kit.add(new THREE.PlaneGeometry(roofD - 1, 1.2), F.recess, x + side * (roofW / 2 + 0.05), y, z, new THREE.Euler(0, side * Math.PI / 2, 0));
        }
      }
      for (let dx = -roofW / 2 + 1; dx < roofW / 2; dx += 4) {
        for (const side of [-1, 1]) kit.box(0.45, tierH, 0.18, x + dx, bottom + tierH / 2, z + side * (roofD / 2 + 0.12), F.trim);
      }
    }
  }
  // Loft windows are separated bays, rather than a single striped cube.
  for (let y = 3.5; y < podium - 1; y += 4) {
    for (let dx = -w / 2 + 2.8; dx < w / 2 - 1; dx += 4.8) {
      for (const side of [-1, 1]) kit.add(new THREE.PlaneGeometry(2.2, 1.8), F.recess, x + dx, y, z + side * (d / 2 + 0.05), new THREE.Euler(0, side < 0 ? Math.PI : 0, 0));
    }
    for (let dz = -d / 2 + 2.8; dz < d / 2 - 1; dz += 4.8) {
      for (const side of [-1, 1]) kit.add(new THREE.PlaneGeometry(2.2, 1.8), F.recess, x + side * (w / 2 + 0.05), y, z + dz, new THREE.Euler(0, side * Math.PI / 2, 0));
    }
  }
  // Parapets leave an inset roof, with elevator bulkhead and mechanical plant.
  for (const side of [-1, 1]) {
    kit.box(roofW, 1.2, 0.45, x, h + 0.6, z + side * (roofD / 2 - 0.2), F.trim);
    kit.box(0.45, 1.2, roofD, x + side * (roofW / 2 - 0.2), h + 0.6, z, F.trim);
  }
  kit.box(roofW * 0.28, 2.8, roofD * 0.35, x - roofW * 0.2, h + 1.4, z, F.metal);
  if (!tower && index % 3 === 0) {
    const tx = x + w * 0.22, tz = z + d * 0.12;
    for (const dx of [-1.5, 1.5]) for (const dz of [-1.5, 1.5]) kit.box(0.3, 3, 0.3, tx + dx, h + 1.5, tz + dz, F.metal);
    kit.cylinder(2.3, 4, tx, h + 5, tz, F.metal);
    kit.cylinder(2.6, 1.6, tx, h + 7.8, tz, F.trim, 0);
    for (const y of [h + 3.4, h + 6.4]) kit.cylinder(2.4, 0.18, tx, y, tz, F.dark);
  } else if (!p.landmark && deco && index % 5 === 0) {
    kit.box(roofW * 0.48, 5, roofD * 0.48, x, h + 2.5, z, F.trim);
    kit.cylinder(0.65, 13, x, h + 10, z, F.metal, 0.15);
  }
  // Recognizable silhouette studies, intentionally not exact landmark replicas.
  if (p.landmark === 'empire') {
    kit.box(roofW * 0.7, 8, roofD * 0.7, x, h + 4, z, F.trim);
    kit.box(roofW * 0.42, 7, roofD * 0.42, x, h + 11.5, z, F.stone);
    kit.cylinder(1.1, 24, x, h + 27, z, F.trim, 0.18);
  } else if (p.landmark === 'chrysler') {
    for (let i = 0; i < 5; i++) kit.cylinder(roofD * (0.6 - i * 0.09), 4, x, h + 2 + i * 3.3, z, F.trim, roofD * (0.48 - i * 0.09));
    kit.cylinder(0.65, 19, x, h + 24, z, F.trim, 0.02);
  } else if (p.landmark === 'trade') {
    kit.cylinder(roofD * 0.6, 16, x, h + 8, z, F.metal, roofD * 0.25);
    kit.cylinder(0.55, 29, x, h + 30, z, F.trim, 0.1);
  }
}

/** Park, piers and two suspension crossings share the island's coordinate frame. */
export function buildUrbanDetail(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'urban-detail';
  const kit = new ModelKit();
  kit.box(124, 0.3, 234, 0, 0.45, -233, F.foliage);
  // Reservoir, promenade and transverse paths.
  kit.box(66, 0.15, 61, 0, 0.65, -291, F.recess);
  for (const x of [-51, 51]) kit.box(3, 0.2, 228, x, 0.75, -233, F.stone);
  for (const z of [-337, -256, -194, -127]) kit.box(112, 0.2, 2.5, 0, 0.75, z, F.stone);
  for (let z = -338; z < -123; z += 14) {
    for (const x of [-43, -31, 32, 43]) {
      if (z < -259 && Math.abs(x) < 35) continue;
      kit.cylinder(0.5, 2.6, x, 1.8, z, F.metal);
      kit.add(new THREE.IcosahedronGeometry(3.2, 0), F.foliage, x, 4.7, z);
    }
  }
  for (let z = -470; z < 520; z += 90) {
    const edge = 238 * Math.sqrt(Math.max(0, 1 - Math.pow(Math.abs(z) / 690, 2.2)));
    kit.box(32, 1.5, 10, -edge - 12, 0.8, z, F.metal);
    kit.box(24, 2.6, 6, -edge - 14, 2.8, z, F.stone);
  }
  for (const [z, length] of [[365, 330], [465, 290]] as const) {
    const start = 238 * Math.sqrt(1 - Math.pow(z / 690, 2.2)) - 10;
    const end = start + length;
    kit.box(length, 2, 12, (start + end) / 2, 9, z, F.metal);
    kit.box(length, 0.3, 1.4, (start + end) / 2, 10.2, z, F.trim);
    for (const t of [0.27, 0.73]) {
      const x = start + length * t;
      for (const side of [-1, 1]) kit.box(5, 42, 3, x, 21, z + side * 7, F.stone);
      kit.box(7, 4, 17, x, 39, z, F.trim);
      kit.box(7, 2, 17, x, 27, z, F.stone);
    }
    const cableY = (t: number) => {
      if (t < 0.27) return 11 + 30 * t / 0.27;
      if (t > 0.73) return 11 + 30 * (1 - t) / 0.27;
      return 15 + 26 * ((t - 0.5) / 0.23) ** 2;
    };
    for (const side of [-1, 1]) {
      for (let i = 0; i < 40; i++) {
        const t = i / 40, next = (i + 1) / 40;
        const a = new THREE.Vector3(start + length * t, cableY(t), z + side * 7);
        const b = new THREE.Vector3(start + length * next, cableY(next), z + side * 7);
        kit.beam(a, b, 0.3, F.trim);
        if (i % 2 === 0) kit.beam(new THREE.Vector3(a.x, 10, a.z), a, 0.13, F.metal);
      }
    }
  }
  kit.finish(group);
  return group;
}
