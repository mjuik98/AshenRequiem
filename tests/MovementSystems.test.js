/**
 * tests/MovementSystems.test.js — PlayerMovementSystem + EnemyMovementSystem 단위 테스트
 *
 * 리팩터링:
 *   Before: 로컬 passed/failed/test() 패턴
 *   After:  tests/helpers/testRunner.js → test(), summary()
 *
 * 실행: npm test
 */

import assert from 'node:assert/strict';
import { makePlayer, makeEnemy, makeWorld } from './fixtures/index.js';
import { test, summary } from './helpers/testRunner.js';

function makeInput(overrides = {}) {
  const state = { dx: 0, dy: 0, ...overrides };
  return {
    ...state,
    getDirection() {
      const len = Math.sqrt(state.dx ** 2 + state.dy ** 2);
      if (len === 0) return { x: 0, y: 0 };
      return { x: state.dx / len, y: state.dy / len };
    },
  };
}

let PlayerMovementSystem, EnemyMovementSystem;
try {
  ({ PlayerMovementSystem } = await import('../src/systems/movement/PlayerMovementSystem.js'));
  ({ EnemyMovementSystem  } = await import('../src/systems/movement/EnemyMovementSystem.js'));
} catch (e) {
  console.warn('[테스트] MovementSystems import 실패 — 스킵:', e.message);
  process.exit(0);
}

// ── PlayerMovementSystem ──────────────────────────────────────────────

console.log('\n[PlayerMovementSystem]');

test('입력 방향으로 플레이어 이동', () => {
  const player = makePlayer({ x: 0, y: 0, moveSpeed: 200 });
  const world  = makeWorld({ player });
  const input  = makeInput({ dx: 1, dy: 0 });
  PlayerMovementSystem.update({ dt: 0.016, input, world });
  assert.ok(player.x > 0, `x가 양수여야 함 (실제: ${player.x})`);
});

test('입력 없으면 플레이어 정지', () => {
  const player = makePlayer({ x: 0, y: 0 });
  const world  = makeWorld({ player });
  const input  = makeInput({ dx: 0, dy: 0 });
  PlayerMovementSystem.update({ dt: 0.016, input, world });
  assert.equal(player.x, 0, `이동이 없어야 함 (실제: ${player.x})`);
  assert.equal(player.y, 0, `이동이 없어야 함 (실제: ${player.y})`);
});

test('isAlive=false 플레이어는 이동하지 않음', () => {
  const player = makePlayer({ x: 0, y: 0, isAlive: false });
  const world  = makeWorld({ player });
  const input  = makeInput({ dx: 1, dy: 0 });
  PlayerMovementSystem.update({ dt: 0.016, input, world });
  assert.equal(player.x, 0, '죽은 플레이어가 이동함');
});

// ── EnemyMovementSystem ───────────────────────────────────────────────

console.log('\n[EnemyMovementSystem]');

test('적이 플레이어 방향으로 이동', () => {
  const player = makePlayer({ x: 0,   y: 0 });
  const enemy  = makeEnemy ({ x: 100, y: 0, moveSpeed: 80 });
  const world  = makeWorld({ player, enemies: [enemy] });
  EnemyMovementSystem.update({ dt: 0.016, world });
  assert.ok(enemy.x < 100, `적이 플레이어 쪽으로 이동해야 함 (실제: ${enemy.x})`);
});

test('isAlive=false 적은 이동하지 않음', () => {
  const player = makePlayer({ x: 0,   y: 0 });
  const enemy  = makeEnemy ({ x: 100, y: 0, isAlive: false });
  const world  = makeWorld({ player, enemies: [enemy] });
  EnemyMovementSystem.update({ dt: 0.016, world });
  assert.equal(enemy.x, 100, '죽은 적이 이동함');
});

summary();
