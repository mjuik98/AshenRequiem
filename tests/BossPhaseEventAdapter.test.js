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

summary();
