import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';

console.log('\n[BossPhaseEventAdapter]');

const { test, summary } = createRunner('BossPhaseEventAdapter');

const { registerBossPhaseHandler } = await import('../src/adapters/play/events/bossPhaseEventAdapter.js');

test('boss phase handler는 behavior 전환과 summon phase action을 적용한다', () => {
  const handlers = new Map();
  const registry = {
    register(eventType, handler) {
      handlers.set(eventType, handler);
    },
  };
  const effects = [];
  registerBossPhaseHandler({
    effectPool: {
      acquire(config) {
        return { ...config, type: 'effect' };
      },
    },
  }, registry);

  const handler = handlers.get('bossPhaseChanged');
  const enemy = {
    id: 'enemy-1',
    x: 30,
    y: 40,
    radius: 20,
    color: '#fff',
    enemyDataId: 'boss_broodmother',
    behaviorId: 'chase',
    behaviorState: { phase: 'idle' },
  };
  const world = {
    entities: { effects },
    queues: { spawnQueue: [] },
  };

  handler({
    enemy,
    announceText: 'phase shift',
    phaseIndex: 0,
    hpThreshold: 0.7,
    newBehaviorId: 'swarm',
    phaseAction: { type: 'summon', enemyId: 'mini_slime', count: 3, ringRadius: 60 },
  }, world);

  assert.equal(enemy.behaviorId, 'swarm', 'phase handler가 behaviorId를 전환하지 않음');
  assert.equal(enemy.behaviorState, null, 'phase handler가 behavior state를 초기화하지 않음');
  assert.equal(effects.length, 1, 'phase announce effect가 생성되지 않음');
  assert.equal(world.queues.spawnQueue.length, 3, 'summon phase action이 spawnQueue를 채우지 않음');
  assert.equal(world.queues.spawnQueue[0].type, 'enemy');
});

test('boss phase handler는 reposition phase action으로 플레이어 주변 재배치와 버스트를 수행한다', () => {
  const handlers = new Map();
  const registry = {
    register(eventType, handler) {
      handlers.set(eventType, handler);
    },
  };
  registerBossPhaseHandler({
    effectPool: {
      acquire(config) {
        return { ...config, type: 'effect' };
      },
    },
  }, registry);

  const handler = handlers.get('bossPhaseChanged');
  const enemy = {
    id: 'enemy-2',
    x: 0,
    y: 0,
    radius: 24,
    color: '#fff',
    enemyDataId: 'boss_seraph',
    behaviorId: 'keepDistance',
  };
  const world = {
    entities: {
      player: { x: 100, y: 100 },
      effects: [],
    },
    queues: { spawnQueue: [] },
  };

  handler({
    enemy,
    announceText: 'skyfall',
    phaseIndex: 1,
    hpThreshold: 0.3,
    newBehaviorId: 'circle_dash',
    phaseAction: { type: 'reposition', distance: 120, angleOffset: 0, burstColor: '#ffeeaa' },
  }, world);

  assert.equal(enemy.x, 220, 'reposition action이 enemy.x를 플레이어 기준으로 재배치하지 않음');
  assert.equal(enemy.y, 100, 'reposition action이 enemy.y를 플레이어 기준으로 재배치하지 않음');
  assert.equal(world.queues.spawnQueue.some((entry) => entry.type === 'effect'), true, 'reposition action이 burst effect를 남기지 않음');
});

test('boss phase handler는 heal_pulse phase action으로 체력을 회복하고 효과를 남긴다', () => {
  const handlers = new Map();
  const registry = {
    register(eventType, handler) {
      handlers.set(eventType, handler);
    },
  };
  registerBossPhaseHandler({
    effectPool: {
      acquire(config) {
        return { ...config, type: 'effect' };
      },
    },
  }, registry);

  const handler = handlers.get('bossPhaseChanged');
  const enemy = {
    id: 'enemy-3',
    x: 20,
    y: 30,
    radius: 20,
    color: '#fff',
    hp: 40,
    maxHp: 100,
    enemyDataId: 'boss_warden',
    behaviorId: 'charge',
  };
  const world = {
    entities: { effects: [] },
    queues: { spawnQueue: [] },
  };

  handler({
    enemy,
    announceText: 'recover',
    phaseIndex: 1,
    hpThreshold: 0.25,
    newBehaviorId: 'dash',
    phaseAction: { type: 'heal_pulse', healRatio: 0.2, color: '#aaffcc' },
  }, world);

  assert.equal(enemy.hp, 60, 'heal_pulse action이 maxHp 비율만큼 회복하지 않음');
  assert.equal(world.queues.spawnQueue.some((entry) => entry.type === 'effect'), true, 'heal_pulse action이 회복 이펙트를 남기지 않음');
});

test('boss phase handler는 projectile_arc phase action으로 플레이어 방향 부채꼴 탄막을 생성한다', () => {
  const handlers = new Map();
  const registry = {
    register(eventType, handler) {
      handlers.set(eventType, handler);
    },
  };
  registerBossPhaseHandler({
    effectPool: {
      acquire(config) {
        return { ...config, type: 'effect' };
      },
    },
  }, registry);

  const handler = handlers.get('bossPhaseChanged');
  const enemy = {
    id: 'enemy-4',
    x: 20,
    y: 30,
    radius: 20,
    color: '#fff',
    enemyDataId: 'boss_seraph',
    behaviorId: 'keepDistance',
    projectileConfig: { speed: 180, damage: 10, radius: 8, color: '#ffeeaa', pierce: 1 },
  };
  const world = {
    entities: { player: { x: 120, y: 30 }, effects: [] },
    queues: { spawnQueue: [] },
  };

  handler({
    enemy,
    announceText: 'fan barrage',
    phaseIndex: 1,
    hpThreshold: 0.25,
    newBehaviorId: 'circle_dash',
    phaseAction: { type: 'projectile_arc', count: 5, spreadAngle: 0.8, color: '#ffeeaa' },
  }, world);

  assert.equal(world.queues.spawnQueue.filter((entry) => entry.type === 'projectile').length, 5, 'projectile_arc action이 부채꼴 투사체를 생성하지 않음');
});

test('boss phase handler는 projectile_nova phase action으로 원형 투사체를 생성한다', () => {
  const handlers = new Map();
  const registry = {
    register(eventType, handler) {
      handlers.set(eventType, handler);
    },
  };
  registerBossPhaseHandler({
    effectPool: {
      acquire(config) {
        return { ...config, type: 'effect' };
      },
    },
  }, registry);

  const handler = handlers.get('bossPhaseChanged');
  const enemy = {
    id: 'enemy-5',
    x: 20,
    y: 30,
    radius: 22,
    color: '#fff',
    enemyDataId: 'boss_abyss_eye',
    behaviorId: 'swarm',
    projectileConfig: { speed: 200, damage: 11, radius: 8, color: '#7ce7ff', pierce: 1 },
  };
  const world = {
    entities: { effects: [] },
    queues: { spawnQueue: [] },
  };

  handler({
    enemy,
    announceText: 'nova',
    phaseIndex: 1,
    hpThreshold: 0.2,
    newBehaviorId: 'circle',
    phaseAction: { type: 'projectile_nova', count: 6, color: '#7ce7ff' },
  }, world);

  assert.equal(world.queues.spawnQueue.filter((entry) => entry.type === 'projectile').length, 6, 'projectile_nova action이 원형 투사체를 생성하지 않음');
});

test('boss phase handler는 stage_echo phase action으로 현재 스테이지의 signature gimmick을 보스전에 합류시킨다', () => {
  const handlers = new Map();
  const registry = {
    register(eventType, handler) {
      handlers.set(eventType, handler);
    },
  };
  registerBossPhaseHandler({
    effectPool: {
      acquire(config) {
        return { ...config, type: 'effect' };
      },
    },
  }, registry);

  const handler = handlers.get('bossPhaseChanged');
  const enemy = {
    id: 'enemy-6',
    x: 20,
    y: 30,
    radius: 22,
    color: '#fff',
    enemyDataId: 'boss_seraph',
    behaviorId: 'circle_dash',
  };
  const world = {
    entities: {
      player: { x: 120, y: 80 },
      effects: [],
    },
    queues: {
      spawnQueue: [],
      events: { stageEventTriggered: [] },
    },
    run: {
      stageId: 'ash_plains',
      stage: {
        id: 'ash_plains',
        name: 'Ash Plains',
        bossEcho: {
          id: 'ashen_lantern_echo',
          type: 'pickup_cluster',
          target: 'boss',
          count: 2,
          radius: 70,
          pickupType: 'ward',
          duration: 3,
          color: '#b9f6ca',
          telegraphText: '수호 등불이 보스전에도 스며듭니다.',
        },
      },
    },
  };

  handler({
    enemy,
    announceText: 'echo',
    phaseIndex: 1,
    hpThreshold: 0.25,
    newBehaviorId: 'keepDistance',
    phaseAction: { type: 'stage_echo' },
  }, world);

  assert.equal(
    world.queues.spawnQueue.filter((entry) => entry.type === 'pickup' && entry.config.pickupType === 'ward').length,
    2,
    'stage_echo가 현재 스테이지 boss echo를 ward pickup으로 발동하지 않음',
  );
  assert.equal(world.queues.events.stageEventTriggered.length, 1, 'stage_echo가 telegraph event를 남기지 않음');
  assert.match(world.queues.events.stageEventTriggered[0]?.telegraphText ?? '', /보스전|수호 등불/, 'stage_echo telegraph text가 보존되지 않음');
});

summary();
