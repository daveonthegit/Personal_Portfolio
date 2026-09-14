// Asset-free geometry regression checks. Temporary bundles never enter static/.
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const dir = await mkdtemp(join(tmpdir(), 'portfolio-models-'));
try {
  const outfile = join(dir, 'models.mjs');
  await build({ stdin: { contents: `export * from './src/os/architecture'; export * from './src/os/modelKit'; export * from './src/os/rooms'; export * from './src/os/roomDetail'; export { Group, Vector3, Box3, Raycaster } from 'three';`, resolveDir: process.cwd() }, bundle: true, platform: 'node', format: 'esm', outfile });
  const { ModelKit, Group, Vector3, Box3, Raycaster, addBuilding, buildSkyline, SKYLINE_SLICE_MS, SKYLINE_SLICE_MAX, buildUrbanDetail, buildRoomFor, addRoomDetail, RACK } = await import(pathToFileURL(outfile));
  const LOT = i => ({ x: (i % 15) * 40, z: Math.floor(i / 15) * 26, w: 32, d: 19, h: 15 + i % 95 });
  function inspect(group, maxDraws) {
    let draws = 0, vertices = 0;
    group.traverse(object => {
      if (!object.isMesh) return;
      draws++;
      const positions = object.geometry.getAttribute('position');
      assert.ok(positions?.count > 0);
      for (const value of positions.array) assert.ok(Number.isFinite(value), 'finite vertices');
      vertices += positions.count;
      object.geometry.computeBoundingBox();
      assert.ok(!object.geometry.boundingBox.isEmpty());
    });
    assert.ok(draws > 0 && draws <= maxDraws, `draw budget: ${draws}/${maxDraws}`);
    return { draws, vertices };
  }
  const urban = inspect(buildUrbanDetail(), 6);
  // Budgets sit just above the measured values so a real regression trips them.
  assert.ok(urban.vertices > 12000 && urban.vertices < 24000, `park / bridge geometry: ${urban.vertices}`);
  const skyline = new Group(), kit = new ModelKit();
  for (let i = 0; i < 450; i++) addBuilding(kit, LOT(i), i);
  kit.finish(skyline);
  const city = inspect(skyline, 6);
  assert.ok(city.vertices > 400000 && city.vertices < 700000, `skyline geometry: ${city.vertices}`);
  // Batching is only proven by how much geometry each draw actually carries.
  assert.ok(city.vertices / city.draws > 50000, `skyline vertices per draw: ${city.vertices / city.draws}`);

  // Sliced construction. An index-counting proxy makes each slice's actual lot
  // consumption observable, and an injected clock exercises the elapsed-time
  // budget and the hard per-slice cap separately.
  const lots = Array.from({ length: 450 }, (_, i) => ({ lot: LOT(i), index: i }));
  function drain(now) {
    let reads = 0;
    const watched = new Proxy(lots, {
      get(list, key) {
        if (typeof key === 'string' && /^\d+$/.test(key)) reads++;
        return list[key];
      },
    });
    const target = new Group();
    const queue = [];
    const consumed = [];
    const proxyPerSlice = [];
    buildSkyline(target, watched, slice => queue.push(slice), now);
    reads = 0; // the synchronous massing pass is not part of any slice
    const massing = target.getObjectByName('skyline-massing');
    assert.ok(massing, 'a massing proxy stands in from the very first frame');
    assert.ok(inspect(massing, 1).vertices > 0, 'the proxy is a complete one-draw skyline');
    let previous = 0;
    while (queue.length) {
      queue.shift()();
      consumed.push(reads - previous);
      previous = reads;
      proxyPerSlice.push(Boolean(target.getObjectByName('skyline-massing')));
    }
    return { target, consumed, proxyPerSlice };
  }
  // A clock that never advances: the hard cap is the only thing yielding.
  const capped = drain(() => 0);
  assert.equal(capped.consumed.reduce((a, b) => a + b, 0), lots.length, 'every lot is built exactly once');
  assert.ok(Math.max(...capped.consumed) === SKYLINE_SLICE_MAX, `slices fill to the cap: ${Math.max(...capped.consumed)}`);
  assert.equal(capped.proxyPerSlice.at(-1), false, 'the proxy is retired once the detail lands');
  assert.ok(capped.proxyPerSlice.slice(0, -1).every(Boolean), 'the proxy covers every intermediate frame');
  // A clock that burns a full budget per reading: each slice must cut out early.
  let t = 0;
  const budgeted = drain(() => (t += SKYLINE_SLICE_MS));
  assert.equal(budgeted.consumed.reduce((a, b) => a + b, 0), lots.length, 'every lot is built exactly once');
  assert.ok(Math.max(...budgeted.consumed) <= 1, `the elapsed-time budget cuts a slice short: ${Math.max(...budgeted.consumed)}`);
  assert.ok(SKYLINE_SLICE_MS <= 8 && SKYLINE_SLICE_MAX <= 32, 'slice bounds stay inside a frame');
  assert.deepEqual(inspect(capped.target, 6), city, 'sliced build matches the single-task build');
  assert.deepEqual(inspect(budgeted.target, 6), city, 'slice boundaries do not change the model');
  buildSkyline(new Group(), [], () => assert.fail('empty skyline schedules no work'));

  for (const id of ['projects', 'resume', 'contact', 'arcade']) {
    for (const [w, d] of [[28, 15], [32, 18]]) {
      const room = buildRoomFor(id, w, d, 23);
      assert.ok(room);
      inspect(room.group, 180);
      assert.ok(room.screen.parent, `${id}: handoff screen remains mounted`);
      room.group.updateMatrixWorld(true);
      const screenPos = room.screen.getWorldPosition(new Vector3());
      const screenNormal = new Vector3(0, 0, 1).transformDirection(room.screen.matrixWorld);
      assert.ok(screenNormal.dot(room.camLocal.pos.clone().sub(screenPos)) > 0, `${id}: screen faces arrival camera`);
      assert.ok(room.camLocal.pos.toArray().every(Number.isFinite));
      assert.equal(room.displays.length, id === 'projects' ? 4 : 0);
      assert.equal(Boolean(room.cabinet), id === 'arcade');
      if (id === 'arcade') assert.equal(room.cabinet, room.screen);
    }
  }
  assert.equal(buildRoomFor('unknown', 32, 18, 23), null);

  // Regression: the rack must show BOTH the per-project units/LEDs and the
  // shared rack trim from the arrival camera, at the project counts that ship.
  // Rays sample each unit's whole front face, not just its centre, so trim that
  // clips only an edge is caught too.
  for (const projectCount of [4, 23]) {
    const room = buildRoomFor('projects', 30, 16, projectCount);
    room.group.updateMatrixWorld(true);
    const units = [], detail = [], all = [];
    room.group.traverse(object => {
      if (!object.isMesh) return;
      all.push(object);
      if (object.userData.projectUnit) units.push(object);
      if (object.name === 'architectural-detail') detail.push(object);
    });
    assert.equal(units.length, projectCount * 2, `${projectCount}: one unit and one LED per project`);
    assert.ok(detail.length > 0);
    const ray = new Raycaster();
    const firstHit = target => {
      const from = room.camLocal.pos;
      ray.set(from, target.clone().sub(from).normalize());
      return ray.intersectObjects(all, false)[0]?.object ?? null;
    };
    for (const unit of units) {
      const size = new Box3().setFromObject(unit).getSize(new Vector3());
      const at = unit.getWorldPosition(new Vector3());
      for (const fy of [-0.35, 0, 0.35]) {
        for (const fz of [-0.42, -0.21, 0, 0.21, 0.42]) {
          const target = at.clone().add(new Vector3(size.x / 2 - 1e-3, size.y * fy, size.z * fz));
          assert.equal(firstHit(target), unit, `${projectCount}: nothing stands in front of a project unit or LED face`);
        }
      }
    }
    // The same sweep must also strike rack trim, or the "richer rack" is sealed
    // inside the opaque rack box and renders nothing.
    const rackX = -30 / 2 + 2.2;
    let trimHits = 0;
    for (const zC of RACK.columns) {
      for (let y = 1; y < 8.5; y += 0.35) {
        for (const dz of [-2, 0, 2]) {
          if (detail.includes(firstHit(new Vector3(rackX + 1.45, y, zC + dz)))) trimHits++;
        }
      }
    }
    assert.ok(trimHits > 20, `${projectCount}: rack trim is visible from the aisle: ${trimHits} hits`);
  }

  // Rooms without a lid get no ceiling-hung fixtures.
  for (const kind of ['projects', 'dossier']) {
    const lit = new Group(), open = new Group();
    addRoomDetail(lit, 30, 16, kind);
    addRoomDetail(open, 30, 16, kind, { ceiling: false });
    const top = group => { const box = new Box3().setFromObject(group); return box.max.y; };
    assert.ok(top(lit) > 12.4, `${kind}: ceiling fixtures hang from the lid`);
    assert.ok(top(open) < 12.4, `${kind}: open-top room has nothing hanging at ceiling height`);
  }
  console.log('PASS model geometry, batching budgets, room handoffs', { city, urban });
} finally {
  await rm(dir, { recursive: true, force: true });
}
