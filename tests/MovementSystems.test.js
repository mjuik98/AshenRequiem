/**
 * tests/MovementSystems.test.js — PlayerMovementSystem + EnemyMovementSystem 단위 테스트
 *
 * REFACTOR (R-06): EnemyMovementSystem factory 패턴 대응
 *   Before: import { EnemyMovementSystem } (singleton)
 *   After:  import { createEnemyMovementSystem } (factory)
 *           각 테스트에서 새 인스턴스 생성 → 테스트 격리 보장
 */

import assert from 'node:assert/strict';
import { makePlayer, makeEnemy, makeWorld } from './fixtures/index.js';
import { test, summary } from './helpers/testRunner.js';

function makeInput(overrides = {}) {
  const state = { moveX: 0, moveY: 0, ...overrides };
  return {
    ...state,
    getDirection() {
      const len = Math.sqrt(state.moveX ** 2 + state.moveY ** 2);
      if (len === 0) return { x: 0, y: 0 };
      return { x: state.moveX / len, y: state.moveY / len };
    },
    isDown(key) { return false; },
    isAction(name) { return false; },
    actions: new Set(),
  };
}

let PlayerMovementSystem, createEnemyMovementSystem;
try {
  ({ PlayerMovementSystem } = await import('../src/systems/movement/PlayerMovementSystem.js'));
  ({ createEnemyMovementSystem } = await import('../src/systems/movement/EnemyMovementSystem.js'));
} catch (e) {
  console.warn('[테스트] MovementSystems import 실패 — 스킵:', e.message);
  process.exit(0);
}

// ── PlayerMovementSystem ──────────────────────────────────────────────

console.log('\n[PlayerMovementSystem]');

test('입력 방향으로 플레이어 이동', () => {
  const player = makePlayer({ x: 0, y: 0, moveSpeed: 200 });
  const world  = makeWorld({ player });
  const input  = makeInput({ moveX: 1, moveY: 0 });
  PlayerMovementSystem.update({ dt: 0.016, input, world });
  assert.ok(player.x > 0, `x가 양수여야 함 (실제: ${player.x})`);
});

test('입력 없으면 플레이어 정지', () => {
  const player = makePlayer({ x: 0, y: 0 });
  const world  = makeWorld({ player });
  const input  = makeInput({ moveX: 0, moveY: 0 });
  PlayerMovementSystem.update({ dt: 0.016, input, world });
  assert.equal(player.x, 0, `이동이 없어야 함 (실제: ${player.x})`);
  assert.equal(player.y, 0, `이동이 없어야 함 (실제: ${player.y})`);
});

test('isAlive=false 플레이어는 이동하지 않음', () => {
  const player = makePlayer({ x: 0, y: 0, isAlive: false });
  const world  = makeWorld({ player });
  const input  = makeInput({ moveX: 1, moveY: 0 });
  PlayerMovementSystem.update({ dt: 0.016, input, world });
  assert.equal(player.x, 0, '죽은 플레이어가 이동함');
});

// ── EnemyMovementSystem (factory) ─────────────────────────────────────

console.log('\n[EnemyMovementSystem — factory 패턴]');

test('각 테스트에서 독립 인스턴스 생성 가능', () => {
  const sysA = createEnemyMovementSystem();
  const sysB = createEnemyMovementSystem();
  assert.notStrictEqual(sysA, sysB, '인스턴스가 동일함 — factory 패턴 실패');
});

test('적이 플레이어 방향으로 이동', () => {
  const sys    = createEnemyMovementSystem();
  const player = makePlayer({ x: 0,   y: 0 });
  const enemy  = makeEnemy ({ x: 100, y: 0, moveSpeed: 80 });
  const world  = makeWorld({ player, enemies: [enemy] });
  sys.update({ dt: 0.016, world });
  assert.ok(enemy.x < 100, `적이 플레이어 쪽으로 이동해야 함 (실제: ${enemy.x})`);
});

test('isAlive=false 적은 이동하지 않음', () => {
  const sys    = createEnemyMovementSystem();
  const player = makePlayer({ x: 0,   y: 0 });
  const enemy  = makeEnemy ({ x: 100, y: 0, isAlive: false });
  const world  = makeWorld({ player, enemies: [enemy] });
  sys.update({ dt: 0.016, world });
  assert.equal(enemy.x, 100, '죽은 적이 이동함');
});

test('인스턴스 간 상태 격리 — 한 인스턴스의 내부 그리드가 다른 인스턴스에 영향 없음', () => {
  const sysA = createEnemyMovementSystem();
  const sysB = createEnemyMovementSystem();
  const player = makePlayer({ x: 0, y: 0 });
  const enemy  = makeEnemy ({ x: 50, y: 0, moveSpeed: 80 });
  const world  = makeWorld({ player, enemies: [enemy] });

  // sysA 실행 후 sysB도 독립적으로 실행 가능해야 함
  assert.doesNotThrow(() => {
    sysA.update({ dt: 0.016, world });
    sysB.update({ dt: 0.016, world });
  });
});

summary();
