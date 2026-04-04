import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { createPlayWorld as createWorld } from '../src/domain/play/state/createPlayWorld.js';
import { WorldTickSystem } from '../src/systems/core/WorldTickSystem.js';

console.log('\n[WorldTickSystem]');

const { test, summary } = createRunner('WorldTickSystem');

test('WorldTickSystem은 프레임 시작 시 이벤트 큐를 비우고 시간/카메라 메타를 갱신한다', () => {
  const world = createWorld();
  world.queues.events.hits.push({ id: 'hit_1' });
  world.queues.events.currencyEarned.push({ amount: 25 });
  world.progression.pendingEventQueue = [
    { type: 'weaponAcquired', payload: { weaponId: 'magic_bolt' } },
    { type: 'accessoryAcquired', payload: { accessoryId: 'iron_heart' } },
  ];
  world.run.elapsedTime = 10;

  WorldTickSystem.update({ world, dt: 0.25 });

  assert.equal(world.queues.events.hits.length, 0, 'hits 이벤트 큐가 초기화되지 않음');
  assert.equal(world.queues.events.currencyEarned.length, 0, 'currencyEarned 이벤트 큐가 초기화되지 않음');
  assert.deepEqual(world.queues.events.weaponAcquired, [], 'run-start 이벤트 주입은 전용 시스템이 담당해야 함');
  assert.deepEqual(world.queues.events.accessoryAcquired, [], 'run-start 이벤트 주입은 전용 시스템이 담당해야 함');
  assert.notEqual(world.progression.pendingEventQueue, null, 'WorldTickSystem이 pending event queue를 소비하면 안 됨');
  assert.equal(world.runtime.deltaTime, 0.25, 'deltaTime이 갱신되지 않음');
  assert.equal(world.run.elapsedTime, 10.25, 'elapsedTime이 누적되지 않음');
  assert.equal(world.presentation.camera.width > 0, true, 'camera width가 갱신되지 않음');
  assert.equal(world.presentation.camera.height > 0, true, 'camera height가 갱신되지 않음');
});

test('WorldTickSystem은 injected runtime viewport를 camera metadata SSOT로 사용한다', () => {
  const world = createWorld();
  world.runtime.viewport = { width: 960, height: 540, dpr: 1.5 };

  WorldTickSystem.update({ world, dt: 0.016 });

  assert.equal(world.presentation.camera.width, 960, 'camera width가 injected viewport를 반영하지 않음');
  assert.equal(world.presentation.camera.height, 540, 'camera height가 injected viewport를 반영하지 않음');
});

summary();
