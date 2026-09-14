import * as THREE from 'three';
import { FINISH as F, ModelKit } from './modelKit';

/**
 * Single source of truth for the projects rack face. `buildProjectsRoom` places
 * the per-project units from these numbers and the shared trim below keeps out
 * of the bays they claim, so one edit moves both.
 */
export const RACK = {
  /** Front plane of a rack column, relative to its centre. */
  face: 1.2,
  /** How far proud of that plane a project unit and its LED are mounted. */
  proud: 0.08,
  /** Rack column centres along the west wall. */
  columns: [-4.2, 4.2],
  bays: 6,
  bayFirst: -2.9,
  bayPitch: 1.1,
  rowBase: 1.6,
  rowPitch: 2.1,
  rowJitter: 0.8,
  unit: { w: 0.15, h: 0.3, d: 0.8 },
  led: { w: 0.1, h: 0.24, d: 0.24, rise: 0.55 },
} as const;

/** Bay slot for the i-th project on one rack column, relative to its centre. */
export function rackUnitSlot(i: number): { dz: number; row: number } {
  return { dz: RACK.bayFirst + (i % RACK.bays) * RACK.bayPitch, row: Math.floor(i / RACK.bays) };
}

/** Depth the bays span on a column, so end posts can clear them. */
export function rackBaySpan(): { min: number; max: number } {
  const half = RACK.unit.d / 2;
  return { min: RACK.bayFirst - half, max: RACK.bayFirst + (RACK.bays - 1) * RACK.bayPitch + half };
}

/**
 * Vertical band of each rack face that the per-project units and their status
 * LEDs claim. Shared rack trim stays out of it, so neither buries the other.
 */
export function rackUnitBand(projectCount: number): { min: number; max: number } {
  const perRack = Math.ceil(Math.max(projectCount, 0) / 2);
  const rows = Math.max(1, Math.ceil(perRack / RACK.bays));
  const top = RACK.rowBase + (rows - 1) * RACK.rowPitch + RACK.rowJitter + RACK.led.rise + RACK.led.h / 2;
  return { min: RACK.rowBase - RACK.unit.h / 2 - 0.2, max: top + 0.13 };
}

export interface RoomDetailOptions {
  /** Rooms built without a lid get no raceways or suspended luminaires. */
  ceiling?: boolean;
  /** Projects rooms reserve rack face bays for this many real projects. */
  projectCount?: number;
}

/** Physical detail only: no fake telemetry and no extra animated lights. */
export function addRoomDetail(group: THREE.Group, w: number, d: number, kind: string, options: RoomDetailOptions = {}): void {
  const { ceiling = true, projectCount = 0 } = options;
  const kit = new ModelKit();
  const back = -d / 2 + 0.4;
  // Seams, skirting and structural ribs define room scale in close-up.
  for (let x = -w / 2 + 2; x < w / 2; x += 2) kit.box(0.025, 0.025, d - 0.8, x, 0.52, 0, F.metal);
  for (let z = -d / 2 + 2; z < d / 2; z += 2) kit.box(w - 0.8, 0.025, 0.025, 0, 0.52, z, F.metal);
  for (const side of [-1, 1]) {
    kit.box(w - 0.6, 0.32, 0.12, 0, 0.7, side * (d / 2 - 0.35), F.metal);
    kit.box(0.12, 0.32, d - 0.6, side * (w / 2 - 0.35), 0.7, 0, F.metal);
    for (let z = -d / 2 + 2; z < d / 2 - 1; z += 4) kit.box(0.22, 11.8, 0.24, side * (w / 2 - 0.4), 6.4, z, F.metal);
    // Ceiling raceways and suspended luminaires need a lid to hang from.
    if (ceiling) {
      kit.box(w - 1, 0.25, 0.35, 0, 12.4, side * (d / 2 - 1), F.metal);
      kit.box(5.6, 0.18, 0.7, side * w * 0.24, 12.1, 0, F.trim);
    }
    // Wall grille.
    for (let y = 9.4; y < 11; y += 0.24) kit.box(0.16, 0.08, 2.4, side * (w / 2 - 0.44), y, 0, F.dark);
  }
  if (kind === 'projects') {
    const rx = -w / 2 + 2.2;
    // Rack trim sits proud of RACK.face so it actually reads, and keeps out of
    // the bays the per-project units and their status LEDs claim: clear of the
    // reserved band in y, and clear of the bay span in z for the end posts.
    const band = rackUnitBand(projectCount);
    const bays = rackBaySpan();
    const postDz = Math.max(-bays.min, bays.max) + 0.12 + 0.05;
    for (const z of RACK.columns) {
      for (const dz of [-postDz, postDz]) kit.box(0.25, 8.4, 0.24, rx + RACK.face + 0.15, 4.6, z + dz, F.trim);
      for (let y = 1; y < 8.5; y += 0.7) {
        if (y + 0.25 > band.min && y - 0.25 < band.max) continue;
        kit.box(0.16, 0.5, 5.8, rx + RACK.face + 0.1, y, z, F.recess);
        for (let dz = -2.5; dz < 2.6; dz += 0.42) kit.box(0.18, 0.28, 0.12, rx + RACK.face + 0.2, y, z + dz, F.dark);
        kit.box(0.25, 0.12, 0.65, rx + RACK.face + 0.3, y, z + 2.1, F.trim);
      }
      // Cable bundles run down the rack ends, clear of the project unit bays.
      for (let i = 0; i < 4; i++) {
        const zz = z + bays.max + 0.12 + i * 0.1;
        kit.beam(new THREE.Vector3(rx + 1.8, 8.8, zz), new THREE.Vector3(rx + 1.8, 0.9, zz), 0.06, F.metal);
      }
    }
    kit.box(2, 0.25, d - 1, rx, 0.7, 0, F.metal);
    const cx = w / 2 - 4.6, cz = d / 2 - 4.6;
    for (const dx of [-2.4, 2.4]) kit.box(0.3, 2.9, 2.7, cx + dx, 1.9, cz, F.metal);
    keyboard(kit, cx, 3.76, cz - 0.3);
  } else if (kind === 'resume') {
    for (let x = -w / 2 + 3; x < w / 2 - 2.5; x += 4.4) {
      for (let drawer = 0; drawer < 4; drawer++) {
        const y = 1.6 + drawer * 2.15;
        kit.box(0.9, 0.38, 0.08, x, y - 0.3, back + 3.4, F.trim);
        kit.box(0.65, 0.15, 0.09, x, y - 0.3, back + 3.45, F.metal);
      }
    }
    // Paper edges, binder clips and a task lamp beside the light table.
    for (let i = 0; i < 7; i++) kit.box(2.5, 0.018, 3.3, -3.9, 4.02 + i * 0.045, 2.6, i % 2 ? F.metal : F.trim, 0.2);
    kit.box(0.5, 0.18, 0.28, -3.7, 4.38, 1.2, F.dark);
    kit.cylinder(0.7, 0.15, 4.2, 4.08, 4, F.dark);
    kit.beam(new THREE.Vector3(4.2, 4.2, 4), new THREE.Vector3(4.2, 7, 3), 0.1);
    kit.beam(new THREE.Vector3(4.2, 7, 3), new THREE.Vector3(2.8, 7.6, 2.6), 0.1);
    kit.box(2, 0.25, 0.7, 2.8, 7.5, 2.6, F.trim);
  } else if (kind === 'contact') {
    for (let i = 0; i < 4; i++) {
      const y = 4.8 + i;
      const x = -w / 2 + 5 + i * 0.02;
      kit.box(1.4, 0.38, 0.06, x - 0.6, y, back + 4.03, F.metal);
      for (const dx of [0.5, 1.1]) {
        kit.add(new THREE.CylinderGeometry(0.16, 0.16, 0.18, 12), F.trim, x + dx, y, back + 4.14, new THREE.Euler(Math.PI / 2, 0, 0));
      }
    }
    keyboard(kit, 1.5, 4.32, back + 4.1);
    kit.box(1.1, 0.25, 1.3, 6, 4.4, back + 4.1, F.dark);
    kit.beam(new THREE.Vector3(6, 4.5, back + 4.1), new THREE.Vector3(5.6, 6.1, back + 3.8), 0.08);
    kit.cylinder(0.2, 0.6, 5.6, 6.3, back + 3.8, F.dark);
    // Chair pedestal and five-spoke base.
    kit.cylinder(0.18, 2.3, 0.6, 1.6, back + 7, F.metal);
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5;
      kit.beam(new THREE.Vector3(0.6, 0.8, back + 7), new THREE.Vector3(0.6 + Math.cos(a) * 1.7, 0.7, back + 7 + Math.sin(a) * 1.7), 0.12);
    }
  } else if (kind === 'arcade') {
    // Wall acoustic battens, bench and a service cabinet, leaving the aisle open.
    for (let x = -w / 2 + 1; x < w / 2 - 1; x += 0.8) kit.box(0.22, 4.5, 0.2, x, 9.7, back, F.metal);
    kit.box(7, 0.4, 2, 4, 2.5, d / 2 - 1.7, F.trim);
    for (const x of [1, 7]) kit.box(0.3, 1.8, 1.6, x, 1.4, d / 2 - 1.7, F.metal);
  } else if (kind === 'dossier') {
    keyboard(kit, 0, 5.06, -4.4);
    // The existing bookshelf now has actual horizontal shelf boards.
    for (let y = 1.8; y < 10; y += 2.4) kit.box(1.6, 0.16, 6.6, w / 2 - 1.5, y, 2.4, F.trim);
    for (let z = -2; z < 6; z += 2.4) kit.box(3.1, 0.45, 2.1, -w / 2 + 3.5, 2.3, z, F.stone);
    kit.box(1.8, 0.1, 2.4, 3.1, 4.8, -4.5, F.dark);
    kit.add(new THREE.SphereGeometry(0.36, 10, 6), F.metal, 3.1, 5, -4.5);
    kit.beam(new THREE.Vector3(0, 4.5, -7.4), new THREE.Vector3(0, 0.8, -7.4), 0.07, F.dark);
    kit.box(2.7, 3.8, 3.3, 8.2, 2.4, -5.5, F.dark);
    for (let y = 1.2; y < 3.8; y += 0.35) kit.box(2, 0.08, 0.06, 8.2, y, -3.82, F.metal);
  }
  kit.finish(group);
}

function keyboard(kit: ModelKit, x: number, y: number, z: number): void {
  kit.box(3.3, 0.13, 1.2, x, y, z, F.dark);
  for (let row = 0; row < 4; row++) for (let key = 0; key < 11; key++) {
    kit.box(0.21, 0.06, 0.18, x - 1.4 + key * 0.28, y + 0.1, z - 0.4 + row * 0.25, F.stone);
  }
}

export function detailCabinet(group: THREE.Group): void {
  const kit = new ModelKit();
  // Side cheeks, recessed bezel, coin door, speaker slots and tactile controls.
  for (const side of [-1, 1]) {
    kit.box(0.18, 7.8, 3.1, side * 1.78, 4.3, 0, F.metal);
    kit.box(0.18, 0.7, 1.8, side * 1.78, 4.8, 1.86, F.dark);
  }
  kit.box(3.1, 0.2, 0.2, 0, 7.3, 1.6, F.metal);
  kit.box(3.1, 0.2, 0.2, 0, 4.98, 1.6, F.metal);
  kit.box(1.4, 1.7, 0.12, 0, 2.5, 1.56, F.recess);
  kit.box(0.45, 0.15, 0.14, 0, 2.9, 1.64, F.trim);
  for (let x = -1.1; x < 1.2; x += 0.27) kit.box(0.12, 0.3, 0.1, x, 7.6, 1.75, F.dark);
  kit.cylinder(0.27, 0.12, -0.8, 4.94, 2, F.dark);
  kit.cylinder(0.08, 0.48, -0.8, 5.2, 2, F.metal);
  kit.add(new THREE.SphereGeometry(0.22, 10, 8), F.dark, -0.8, 5.45, 2);
  for (let i = 0; i < 4; i++) kit.cylinder(0.17, 0.12, 0.3 + (i % 2) * 0.45, 4.94, 1.8 + Math.floor(i / 2) * 0.45, F.trim);
  kit.finish(group);
}
