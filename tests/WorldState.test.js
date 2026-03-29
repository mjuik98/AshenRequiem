import assert from 'node:assert/strict';
import { test, summary } from './helpers/testRunner.js';
import { createPlayWorld as createWorld } from '../src/domain/play/state/createPlayWorld.js';

console.log('\n[WorldState]');

test('createWorld()는 리롤/봉인 런 상태 기본값을 포함한다', () => {
  const world = createWorld();
  assert.equal(world.progression.runRerollsRemaining, 0, 'runRerollsRemaining 기본값이 0이 아님');
  assert.equal(world.progression.runBanishesRemaining, 0, 'runBanishesRemaining 기본값이 0이 아님');
  assert.deepEqual(world.progression.banishedUpgradeIds, [], 'banishedUpgradeIds 기본값이 빈 배열이 아님');
  assert.equal(world.progression.levelUpActionMode, 'select', 'levelUpActionMode 기본값이 select가 아님');
});

test('createWorld()는 런타임 이벤트 큐 SSOT를 모두 초기화한다', () => {
  const world = createWorld();
  assert.ok(Array.isArray(world.queues.events.weaponEvolved), 'weaponEvolved 큐가 초기화되지 않음');
  assert.ok(Array.isArray(world.queues.events.bossSpawned), 'bossSpawned 큐가 초기화되지 않음');
});

test('createWorld()는 ownership 기반 substate만 제공한다', () => {
  const world = createWorld();

  assert.equal(world.entities.player, null, 'entities.player 기본값이 없음');
  assert.equal(Array.isArray(world.entities.enemies), true, 'entities.enemies가 배열이 아님');
  assert.equal(world.run.playMode, 'playing', 'run.playMode 기본값이 없음');
  assert.equal(world.progression.levelUpActionMode, 'select', 'progression.levelUpActionMode 기본값이 없음');

  world.run.killCount = 12;
  assert.equal(world.run.killCount, 12, 'run stats 변경이 ownership slice에 반영되지 않음');

  world.run.playMode = 'paused';
  assert.equal(world.run.playMode, 'paused', 'top-level alias 변경이 run slice에 반영되지 않음');

  world.entities.enemies.push({ id: 'enemy-1' });
  assert.equal(world.entities.enemies.length, 1, 'entities slice가 유지되지 않음');

  world.progression.pendingUpgrade = { id: 'up_test' };
  assert.deepEqual(world.progression.pendingUpgrade, { id: 'up_test' }, 'progression slice가 유지되지 않음');
  assert.equal('playMode' in world, false, 'top-level playMode alias가 제거되지 않음');
  assert.equal('player' in world, false, 'top-level player alias가 제거되지 않음');
});

test('createWorld()는 encounter state와 run guidance 기본값을 포함한다', () => {
  const world = createWorld();

  assert.deepEqual(
    world.run.encounterState,
    {
      currentBeat: null,
      nextBeat: null,
      nextBeatStartsIn: null,
      nextBossAt: null,
      nextBossStartsIn: null,
    },
    'encounterState 기본값이 없음',
  );
  assert.deepEqual(
    world.run.guidance,
    { primaryObjective: null, stageDirective: null, recommendedBuild: null },
    'run guidance 기본값이 없음',
  );
});

summary();
