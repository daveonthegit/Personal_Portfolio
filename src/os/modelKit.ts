import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/** Static architectural parts, merged by finish rather than one draw per prop. */
export class ModelKit {
  private parts = new Map<number, THREE.BufferGeometry[]>();

  add(geometry: THREE.BufferGeometry, color: number, x: number, y: number, z: number, rotation = new THREE.Euler()): void {
    // Polyhedra are non-indexed; normalize before mixing them with boxes/tubes.
    if (!geometry.index) geometry.setIndex(Array.from({ length: geometry.getAttribute('position').count }, (_, i) => i));
    geometry.applyMatrix4(new THREE.Matrix4().compose(
      new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(rotation), new THREE.Vector3(1, 1, 1),
    ));
    const parts = this.parts.get(color) ?? [];
    parts.push(geometry);
    this.parts.set(color, parts);
  }

  box(w: number, h: number, d: number, x: number, y: number, z: number, color: number = FINISH.stone, ry = 0): void {
    this.add(new THREE.BoxGeometry(w, h, d), color, x, y, z, new THREE.Euler(0, ry, 0));
  }

  cylinder(r: number, h: number, x: number, y: number, z: number, color: number = FINISH.metal, top = r): void {
    this.add(new THREE.CylinderGeometry(top, r, h, 12), color, x, y, z);
  }

  beam(a: THREE.Vector3, b: THREE.Vector3, radius: number, color: number = FINISH.metal): void {
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const rotation = new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize(),
    ));
    this.add(new THREE.CylinderGeometry(radius, radius, a.distanceTo(b), 6), color, mid.x, mid.y, mid.z, rotation);
  }

  /** Fold the parts accumulated so far into one geometry per finish. Lets a
   *  long build amortize its merge cost across slices without adding draws. */
  compact(): void {
    for (const [color, parts] of this.parts) {
      if (parts.length < 2) continue;
      const merged = mergeGeometries(parts);
      if (!merged) throw new Error('Incompatible architectural geometry');
      parts.forEach(part => part.dispose());
      this.parts.set(color, [merged]);
    }
  }

  finish(group: THREE.Group): void {
    for (const [color, parts] of this.parts) {
      const geometry = parts.length === 1 ? parts[0]! : mergeGeometries(parts);
      if (parts.length > 1) parts.forEach(part => part.dispose());
      if (!geometry) throw new Error('Incompatible architectural geometry');
      const mesh = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({ color }));
      mesh.name = 'architectural-detail';
      group.add(mesh);
    }
    this.parts.clear();
  }
}

export const FINISH = {
  stone: 0xbcb7ac, trim: 0xe9e4d8, metal: 0x77766f,
  dark: 0x27231f, recess: 0x41413e, foliage: 0x555b50,
} as const;
