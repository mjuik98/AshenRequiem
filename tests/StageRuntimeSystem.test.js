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

test('stage runtime system은 pickup_cluster gimmick의 ward/heal payload를 유지한다', async () => {
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
      elapsedTime: 80,
      playMode: 'playing',
      stage: {
        id: 'ash_plains',
        gimmicks: [{
          id: 'ashen_lantern',
          type: 'pickup_cluster',
          startAt: 60,
          count: 2,
          radius: 80,
          pickupType: 'ward',
          duration: 3,
          healValue: 12,
          announceText: 'Ashen Lantern',
        }],
      },
      stageRuntime: null,
    },
  };

  StageRuntimeSystem.update({ world });

  assert.equal(world.queues.spawnQueue.length, 2, 'ward pickup_cluster가 픽업 수를 맞추지 못함');
  assert.equal(
    world.queues.spawnQueue.every((entry) => entry.type === 'pickup' && entry.config.pickupType === 'ward'),
    true,
    'ward pickup_cluster가 ward pickup을 생성하지 않음',
  );
  assert.equal(world.queues.spawnQueue.every((entry) => entry.config.duration === 3), true, 'ward pickup duration이 유지되지 않음');
  assert.equal(world.queues.spawnQueue.every((entry) => entry.config.healValue === 12), true, 'pickup_cluster 추가 payload가 보존되지 않음');
  assert.equal(world.queues.events.stageEventTriggered[0]?.telegraphTone, 'info', 'ward pickup_cluster는 info telegraph tone을 사용해야 함');
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
          projectileVisualId: 'magic_bolt',
          impactEffectType: 'magic_bolt_impact',
          impactEffectVisualId: 'magic_bolt_impact',
          announceText: 'Grave Barrage',
        }],
      },
      stageRuntime: null,
    },
  };

  StageRuntimeSystem.update({ world });

  assert.equal(world.queues.spawnQueue.length, 5, 'projectile_barrage gimmick이 투사체 수를 맞추지 못함');
  assert.equal(world.queues.spawnQueue.every((entry) => entry.type === 'projectile'), true, 'projectile_barrage gimmick이 projectile spawn만 생성해야 함');
  assert.equal(world.queues.spawnQueue.every((entry) => entry.config.projectileVisualId === 'magic_bolt'), true, 'projectile_barrage가 projectileVisualId를 유지하지 않음');
  assert.equal(world.queues.spawnQueue.every((entry) => entry.config.impactEffectVisualId === 'magic_bolt_impact'), true, 'projectile_barrage가 impactEffectVisualId를 유지하지 않음');
  assert.equal(world.queues.events.stageEventTriggered.length, 1, 'projectile_barrage gimmick이 stage event를 남기지 않음');
  assert.equal(world.queues.events.stageEventTriggered[0].dangerLevel, 'high', 'projectile_barrage danger level이 기록되지 않음');
  assert.match(world.queues.events.stageEventTriggered[0].telegraphText, /incoming|탄막|warning/i, 'projectile_barrage telegraph text가 없음');
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
          projectileVisualId: 'fire_bolt',
          impactEffectType: 'fire_bolt_impact',
          impactEffectVisualId: 'fire_bolt_impact',
          effectVisualId: 'fire_bolt_impact',
          announceText: 'Ember Ring',
        }],
      },
      stageRuntime: null,
    },
  };

  StageRuntimeSystem.update({ world });

  assert.equal(world.queues.spawnQueue.filter((entry) => entry.type === 'projectile').length, 4, 'hazard_ring이 projectile spawn을 생성하지 않음');
  assert.equal(world.queues.spawnQueue.filter((entry) => entry.type === 'effect').length, 4, 'hazard_ring이 warning effect를 생성하지 않음');
  assert.equal(world.queues.spawnQueue.filter((entry) => entry.type === 'projectile').every((entry) => entry.config.projectileVisualId === 'fire_bolt'), true, 'hazard_ring projectileVisualId가 유지되지 않음');
  assert.equal(world.queues.spawnQueue.filter((entry) => entry.type === 'effect').every((entry) => entry.config.effectVisualId === 'fire_bolt_impact'), true, 'hazard_ring effectVisualId가 유지되지 않음');
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
          projectileVisualId: 'ice_bolt',
          impactEffectType: 'ice_bolt_impact',
          impactEffectVisualId: 'ice_bolt_impact',
          effectVisualId: 'ice_bolt_impact',
          announceText: 'Harbor Crossfire',
        }],
      },
      stageRuntime: null,
    },
  };

  StageRuntimeSystem.update({ world });

  assert.equal(world.queues.spawnQueue.filter((entry) => entry.type === 'projectile').length, 4, 'cross_barrage가 십자 투사체 4개를 생성하지 않음');
  assert.equal(world.queues.spawnQueue.filter((entry) => entry.type === 'effect').length, 4, 'cross_barrage가 warning effect를 생성하지 않음');
  assert.equal(world.queues.spawnQueue.filter((entry) => entry.type === 'projectile').every((entry) => entry.config.projectileVisualId === 'ice_bolt'), true, 'cross_barrage projectileVisualId가 유지되지 않음');
  assert.equal(world.queues.spawnQueue.filter((entry) => entry.type === 'effect').every((entry) => entry.config.effectVisualId === 'ice_bolt_impact'), true, 'cross_barrage effectVisualId가 유지되지 않음');
  assert.equal(world.queues.events.stageEventTriggered.length, 1, 'cross_barrage gimmick이 stage event를 남기지 않음');
  assert.equal(world.queues.events.stageEventTriggered[0].telegraphTone, 'danger', 'cross_barrage telegraph tone이 danger가 아님');
});

test('stage runtime system은 encounter cadence multiplier를 반영해 gimmick trigger 간격을 줄인다', async () => {
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
      elapsedTime: 100,
      playMode: 'playing',
      encounterState: { currentBeat: { id: 'surge', gimmickIntervalMult: 0.5 } },
      stage: {
        id: 'ember_hollow',
        gimmicks: [{
          id: 'ember_ring',
          type: 'hazard_ring',
          startAt: 90,
          interval: 40,
          count: 2,
          ringRadius: 80,
        }],
      },
      stageRuntime: null,
    },
  };

  StageRuntimeSystem.update({ world });

  assert.equal(world.run.stageRuntime.gimmicks.ember_ring.triggerCount, 1, '첫 cadence trigger가 기록되지 않음');
  assert.equal(world.run.stageRuntime.gimmicks.ember_ring.nextTriggerAt, 110, 'encounter cadence multiplier가 interval에 반영되지 않음');
});

summary();
