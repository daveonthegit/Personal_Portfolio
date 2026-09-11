import * as THREE from 'three';

interface ScreenTarget {
  room: string;
  mesh: THREE.Mesh;
  button: HTMLButtonElement;
  activate: () => void;
  ready: () => boolean;
  anchor: THREE.Vector3;
}

/** Quiet, keyboard-operable labels attached to the real clickable surfaces. */
export class ScreenHints {
  private targets: ScreenTarget[] = [];
  private layer = document.createElement('div');
  private point = new THREE.Vector3();
  private normal = new THREE.Vector3();
  private towardCamera = new THREE.Vector3();
  private ray = new THREE.Raycaster();

  constructor(private host: HTMLElement) {
    this.layer.className = 'xw-screen-hints';
    host.appendChild(this.layer);
  }

  add(room: string, mesh: THREE.Mesh, label: string, accessibleLabel: string, activate: () => void, ready = () => true): void {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'xw-screen-hint';
    button.hidden = true;
    button.setAttribute('aria-label', accessibleLabel);
    button.append(document.createTextNode(label + ' '));
    const arrow = document.createElement('span');
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '↗';
    button.appendChild(arrow);
    button.addEventListener('click', () => { if (!button.hidden && ready()) activate(); });
    this.layer.appendChild(button);
    mesh.geometry.computeBoundingBox();
    const bounds = mesh.geometry.boundingBox!;
    const anchor = bounds.getCenter(new THREE.Vector3());
    anchor.y = bounds.min.y + (bounds.max.y - bounds.min.y) * 0.16;
    this.targets.push({ room, mesh, button, activate, ready, anchor });
  }

  update(camera: THREE.Camera, room: string | null): void {
    const width = room ? this.host.clientWidth : 0;
    const height = room ? this.host.clientHeight : 0;
    for (const target of this.targets) {
      let visible = target.room === room && target.ready();
      if (visible) {
        this.point.copy(target.anchor).applyMatrix4(target.mesh.matrixWorld);
        this.normal.set(0, 0, 1).transformDirection(target.mesh.matrixWorld);
        this.towardCamera.copy(camera.position).sub(this.point);
        visible = this.normal.dot(this.towardCamera) > 0;
        this.point.project(camera);
        const x = (this.point.x + 1) * width / 2;
        const y = (1 - this.point.y) * height / 2;
        // Keep the whole cue in the canvas, never clamped away from its screen.
        visible &&= this.point.z >= -1 && this.point.z <= 1 && x > 70 && x < width - 70 && y > 24 && y < height - 24;
        if (visible) target.button.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      }
      if (target.button.hidden === visible) target.button.hidden = !visible;
    }
  }

  activateAt(camera: THREE.Camera, room: string, pointer: THREE.Vector2): void {
    const available = this.targets.filter(target => target.room === room && target.ready());
    this.ray.setFromCamera(pointer, camera);
    const hit = this.ray.intersectObjects(available.map(target => target.mesh), false)[0];
    if (hit) available.find(target => target.mesh === hit.object)?.activate();
  }
}
