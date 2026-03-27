import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';

console.log('\n[StageRuntimeSystem]');

const { test, summary } = createRunner('StageRuntimeSystem');

test('stage runtime system은 enemy_ring gimmick을 발동해 spawnQueue와 이벤트를 채운다', async () => {
  const { StageRuntimeSystem } = await import('../src/systems/stage/StageRuntimeSystem.js');

  const world = {
    entities: {
      player: { x: 10, y: 20, isAlive: true },
    },
    queues: {
      spawnQueue: [],
      events: { stageEventTriggered: [] },
    },
    run: {
      elapsedTime: 90,
      playMode: 'playing',
      stage: {
        id: 'moon_crypt',
        gimmicks: [{
          id: 'grave_call',
          type: 'enemy_ring',
          startAt: 75,
          interval: 45,
          enemyId: 'elite_skeleton',
          count: 3,
          ringRadius: 180,
          announceText: 'Grave Call',
        }],
      },
      stageRuntime: null,
    },
  };

  StageRuntimeSystem.update({ world });

  assert.equal(world.run.stageRuntime.gimmicks.grave_call.triggerCount, 1, 'stage runtime이 gimmick trigger count를 기록하지 않음');
  assert.equal(world.queues.spawnQueue.length, 3, 'enemy_ring gimmick이 spawnQueue를 채우지 않음');
  assert.equal(world.queues.events.stageEventTriggered.length, 1, 'stage gimmick 이벤트가 발행되지 않음');
});

test('stage runtime system은 pickup_cluster gimmick을 발동해 골드 픽업을 생성한다', async () => {
  const { StageRuntimeSystem } = await import('../src/systems/stage/StageRuntimeSystem.js');

  const world = {
    entities: {
      player: { x: 0, y: 0, isAlive: true },
    },
    queues: {
      spawnQueue: [],
      events: { stageEventTriggered: [] },
    },
    run: {
      elapsedTime: 120,
      playMode: 'playing',
      stage: {
        id: 'ember_hollow',
        gimmicks: [{
          id: 'ember_cache',
          type: 'pickup_cluster',
          startAt: 100,
          interval: 60,
          count: 4,
          radius: 90,
          currencyValue: 5,
          announceText: 'Ember Cache',
        }],
      },
      stageRuntime: null,
    },
  };

  StageRuntimeSystem.update({ world });

  assert.equal(world.queues.spawnQueue.length, 4, 'pickup_cluster gimmick이 픽업 생성 수를 맞추지 못함');
  assert.equal(
    world.queues.spawnQueue.every((entry) => entry.type === 'pickup' && entry.config.pickupType === 'gold'),
    true,
    'pickup_cluster gimmick이 gold pickup을 생성하지 않음',
  );
});

summary();
