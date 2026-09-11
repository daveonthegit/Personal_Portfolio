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
  await build({ stdin: { contents: `export * from './src/os/architecture'; export * from './src/os/modelKit'; export * from './src/os/rooms'; export { Group, Vector3 } from 'three';`, resolveDir: process.cwd() }, bundle: true, platform: 'node', format: 'esm', outfile });
  const { ModelKit, Group, Vector3, addBuilding, buildUrbanDetail, buildRoomFor } = await import(pathToFileURL(outfile));
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
  assert.ok(urban.vertices < 65000, 'bounded park / bridge geometry');
  const skyline = new Group(), kit = new ModelKit();
  for (let i = 0; i < 450; i++) addBuilding(kit, { x: (i % 15) * 40, z: Math.floor(i / 15) * 26, w: 32, d: 19, h: 15 + i % 95 }, i);
  kit.finish(skyline);
  const city = inspect(skyline, 6);
  assert.ok(city.vertices < 1600000, 'bounded skyline geometry');
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
  console.log('PASS model geometry, batching budgets, room handoffs', { city, urban });
} finally {
  await rm(dir, { recursive: true, force: true });
}
