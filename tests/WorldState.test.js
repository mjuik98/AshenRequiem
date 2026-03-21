import assert from 'node:assert/strict';
import { test, summary } from './helpers/testRunner.js';
import { createWorld } from '../src/state/createWorld.js';

console.log('\n[WorldState]');

test('createWorld()는 리롤/봉인 런 상태 기본값을 포함한다', () => {
  const world = createWorld();
  assert.equal(world.runRerollsRemaining, 0, 'runRerollsRemaining 기본값이 0이 아님');
  assert.equal(world.runBanishesRemaining, 0, 'runBanishesRemaining 기본값이 0이 아님');
  assert.deepEqual(world.banishedUpgradeIds, [], 'banishedUpgradeIds 기본값이 빈 배열이 아님');
  assert.equal(world.levelUpActionMode, 'select', 'levelUpActionMode 기본값이 select가 아님');
});

test('createWorld()는 런타임 이벤트 큐 SSOT를 모두 초기화한다', () => {
  const world = createWorld();
  assert.ok(Array.isArray(world.events.weaponEvolved), 'weaponEvolved 큐가 초기화되지 않음');
  assert.ok(Array.isArray(world.events.bossSpawned), 'bossSpawned 큐가 초기화되지 않음');
});

summary();
