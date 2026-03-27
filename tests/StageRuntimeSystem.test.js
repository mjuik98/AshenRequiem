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

test('stage runtime system은 projectile_barrage gimmick을 발동해 플레이어를 겨냥한 적 투사체를 생성한다', async () => {
  const { StageRuntimeSystem } = await import('../src/systems/stage/StageRuntimeSystem.js');

  const world = {
    entities: {
      player: { x: 40, y: 20, isAlive: true },
    },
    queues: {
      spawnQueue: [],
      events: { stageEventTriggered: [] },
    },
    run: {
      elapsedTime: 150,
      playMode: 'playing',
      stage: {
        id: 'moon_crypt',
        gimmicks: [{
          id: 'grave_barrage',
          type: 'projectile_barrage',
          startAt: 120,
          count: 5,
          ringRadius: 140,
          projectileSpeed: 180,
          damage: 9,
          announceText: 'Grave Barrage',
        }],
      },
      stageRuntime: null,
    },
  };

  StageRuntimeSystem.update({ world });

  assert.equal(world.queues.spawnQueue.length, 5, 'projectile_barrage gimmick이 투사체 수를 맞추지 못함');
  assert.equal(world.queues.spawnQueue.every((entry) => entry.type === 'projectile'), true, 'projectile_barrage gimmick이 projectile spawn만 생성해야 함');
  assert.equal(world.queues.events.stageEventTriggered.length, 1, 'projectile_barrage gimmick이 stage event를 남기지 않음');
});

test('stage runtime system은 hazard_ring gimmick으로 이펙트와 투사체를 함께 생성한다', async () => {
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
      elapsedTime: 210,
      playMode: 'playing',
      stage: {
        id: 'ember_hollow',
        gimmicks: [{
          id: 'ember_ring',
          type: 'hazard_ring',
          startAt: 180,
          count: 4,
          ringRadius: 100,
          projectileSpeed: 200,
          damage: 11,
          announceText: 'Ember Ring',
        }],
      },
      stageRuntime: null,
    },
  };

  StageRuntimeSystem.update({ world });

  assert.equal(world.queues.spawnQueue.filter((entry) => entry.type === 'projectile').length, 4, 'hazard_ring이 projectile spawn을 생성하지 않음');
  assert.equal(world.queues.spawnQueue.filter((entry) => entry.type === 'effect').length, 4, 'hazard_ring이 warning effect를 생성하지 않음');
  assert.equal(world.queues.events.stageEventTriggered.length, 1, 'hazard_ring gimmick이 stage event를 남기지 않음');
});

test('stage runtime system은 cross_barrage gimmick으로 십자 탄막을 생성한다', async () => {
  const { StageRuntimeSystem } = await import('../src/systems/stage/StageRuntimeSystem.js');

  const world = {
    entities: {
      player: { x: 10, y: -10, isAlive: true },
    },
    queues: {
      spawnQueue: [],
      events: { stageEventTriggered: [] },
    },
    run: {
      elapsedTime: 255,
      playMode: 'playing',
      stage: {
        id: 'frost_harbor',
        gimmicks: [{
          id: 'harbor_crossfire',
          type: 'cross_barrage',
          startAt: 240,
          ringRadius: 120,
          projectileSpeed: 210,
          damage: 12,
          announceText: 'Harbor Crossfire',
        }],
      },
      stageRuntime: null,
    },
  };

  StageRuntimeSystem.update({ world });

  assert.equal(world.queues.spawnQueue.filter((entry) => entry.type === 'projectile').length, 4, 'cross_barrage가 십자 투사체 4개를 생성하지 않음');
  assert.equal(world.queues.spawnQueue.filter((entry) => entry.type === 'effect').length, 4, 'cross_barrage가 warning effect를 생성하지 않음');
  assert.equal(world.queues.events.stageEventTriggered.length, 1, 'cross_barrage gimmick이 stage event를 남기지 않음');
});

summary();
