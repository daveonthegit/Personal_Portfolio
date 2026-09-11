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
  const { ModelKit, Group, Vector3, Box3, Raycaster, addBuilding, buildSkyline, SKYLINE_SLICE, buildUrbanDetail, buildRoomFor, addRoomDetail } = await import(pathToFileURL(outfile));
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

  // Sliced construction: bounded work per slice, identical merged result, and
  // nothing reaches the scene graph until the last slice lands.
  const sliced = new Group();
  const lots = Array.from({ length: 450 }, (_, i) => ({ lot: LOT(i), index: i }));
  const queue = [];
  let attachedEarly = false;
  buildSkyline(sliced, lots, slice => queue.push(slice));
  let slices = 0;
  while (queue.length) {
    const next = queue.shift();
    const before = lots.length;
    next();
    slices++;
    if (queue.length && sliced.children.length > 0) attachedEarly = true;
    assert.ok(before === lots.length);
  }
  assert.equal(attachedEarly, false, 'sliced skyline attaches once, after the final slice');
  assert.equal(slices, Math.ceil(lots.length / SKYLINE_SLICE), 'every slice stays bounded');
  assert.ok(SKYLINE_SLICE <= 64, `slice size stays small: ${SKYLINE_SLICE}`);
  const slicedStats = inspect(sliced, 6);
  assert.deepEqual(slicedStats, city, 'sliced build matches the single-task build');
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

  // Regression: shared rack detail must not bury the per-project units/LEDs.
  {
    const room = buildRoomFor('projects', 30, 16, 4);
    room.group.updateMatrixWorld(true);
    const units = [];
    room.group.traverse(object => { if (object.userData.projectUnit) units.push(object); });
    assert.equal(units.length, 8, 'four projects contribute a unit and an LED each');
    const detail = [];
    room.group.traverse(object => { if (object.name === 'architectural-detail') detail.push(object); });
    assert.ok(detail.length > 0);
    const ray = new Raycaster();
    for (const unit of units) {
      const target = unit.getWorldPosition(new Vector3());
      const from = room.camLocal.pos;
      ray.set(from, target.clone().sub(from).normalize());
      const own = ray.intersectObject(unit, false)[0];
      assert.ok(own, 'unit is reachable from the arrival camera');
      const blocked = ray.intersectObjects(detail, false)[0];
      assert.ok(!blocked || blocked.distance > own.distance, 'rack detail stays behind the project units');
    }
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
