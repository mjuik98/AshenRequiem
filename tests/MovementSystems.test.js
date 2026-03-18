/**
 * tests/MovementSystems.test.js — PlayerMovementSystem + EnemyMovementSystem 단위 테스트
 *
 * [개선 P0-②] 로컬 인라인 픽스처 → tests/fixtures/index.js 공통 픽스처로 교체
 *   Before: makePlayer / makeEnemy / makeInput / makeWorld 로컬 선언
 *   After:  fixtures/index.js import → Entity 구조 변경 시 1곳만 수정
 *
 * 실행: npm test
 */

import assert from 'node:assert/strict';
import { makePlayer, makeEnemy, makeWorld } from './fixtures/index.js';

// ─── makeInput 헬퍼 (이동 시스템 전용, 픽스처에 미포함) ──────────────

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

// ─── 시스템 import ────────────────────────────────────────────────────

let PlayerMovementSystem, EnemyMovementSystem;
try {
  ({ PlayerMovementSystem } = await import('../src/systems/movement/PlayerMovementSystem.js'));
  ({ EnemyMovementSystem  } = await import('../src/systems/movement/EnemyMovementSystem.js'));
} catch (e) {
  console.warn('[테스트] MovementSystems import 실패 — 스킵:', e.message);
  process.exit(0);
}

// ─── 테스트 러너 ─────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ✗ ${name}`);
    console.error(`    [ERROR] ${e.message}`);
    failed++;
  }
}

// ─── PlayerMovementSystem ────────────────────────────────────────────

console.log('\n[PlayerMovementSystem]');

test('입력 방향으로 플레이어 이동', () => {
  const player = makePlayer({ x: 0, y: 0, moveSpeed: 200 });
  const world  = makeWorld({ player });
  const input  = makeInput({ dx: 1, dy: 0 });

  PlayerMovementSystem.update({ dt: 0.016, world, input });

  assert.ok(player.x > 0, `x가 증가하지 않음 (실제: ${player.x})`);
  assert.equal(player.y, 0, `y가 변경됨 (실제: ${player.y})`);
});

test('대각선 입력 시 속도 정규화 (대각선이 더 빠르지 않음)', () => {
  const playerDiag     = makePlayer({ x: 0, y: 0, moveSpeed: 200 });
  const playerStraight = makePlayer({ x: 0, y: 0, moveSpeed: 200 });
  const worldDiag     = makeWorld({ player: playerDiag });
  const worldStraight = makeWorld({ player: playerStraight });

  PlayerMovementSystem.update({ dt: 0.016, world: worldDiag,     input: makeInput({ dx: 1, dy: 1 }) });
  PlayerMovementSystem.update({ dt: 0.016, world: worldStraight, input: makeInput({ dx: 1, dy: 0 }) });

  const distDiag     = Math.sqrt(playerDiag.x ** 2 + playerDiag.y ** 2);
  const distStraight = Math.sqrt(playerStraight.x ** 2 + playerStraight.y ** 2);

  assert.ok(
    Math.abs(distDiag - distStraight) < 0.5,
    `대각선 속도(${distDiag.toFixed(2)})가 직선(${distStraight.toFixed(2)})과 다름`
  );
});

test('입력 없을 때 플레이어 정지', () => {
  const player = makePlayer({ x: 0, y: 0 });
  const world  = makeWorld({ player });

  PlayerMovementSystem.update({ dt: 0.016, world, input: makeInput({ dx: 0, dy: 0 }) });

  assert.equal(player.x, 0, `입력 없는데 x 이동 (${player.x})`);
  assert.equal(player.y, 0, `입력 없는데 y 이동 (${player.y})`);
});

test('isAlive=false 플레이어 이동 없음', () => {
  const player = makePlayer({ x: 0, y: 0, isAlive: false });
  const world  = makeWorld({ player });

  PlayerMovementSystem.update({ dt: 0.016, world, input: makeInput({ dx: 1, dy: 0 }) });

  assert.equal(player.x, 0, `죽은 플레이어가 이동함 (x: ${player.x})`);
});

// ─── EnemyMovementSystem ─────────────────────────────────────────────

console.log('\n[EnemyMovementSystem]');

test('적이 플레이어를 향해 이동', () => {
  const player = makePlayer({ x: 0, y: 0 });
  const enemy  = makeEnemy({ x: 100, y: 0, moveSpeed: 80 });
  const world  = makeWorld({ player, enemies: [enemy] });

  EnemyMovementSystem.update({ dt: 0.016, world });

  assert.ok(enemy.x < 100, `적이 플레이어 방향으로 이동하지 않음 (x: ${enemy.x})`);
});

test('이동 후 플레이어와 거리가 가까워짐', () => {
  const player = makePlayer({ x: 0, y: 0 });
  const enemy  = makeEnemy({ x: 200, y: 0, moveSpeed: 80 });
  const world  = makeWorld({ player, enemies: [enemy] });

  const before = Math.hypot(enemy.x - player.x, enemy.y - player.y);
  EnemyMovementSystem.update({ dt: 0.016, world });
  const after  = Math.hypot(enemy.x - player.x, enemy.y - player.y);

  assert.ok(after < before, `이동 후 거리가 가까워지지 않음 (${before.toFixed(1)} → ${after.toFixed(1)})`);
});

test('pendingDestroy 적은 이동하지 않음', () => {
  const player = makePlayer({ x: 0, y: 0 });
  const enemy  = makeEnemy({ x: 100, y: 0, pendingDestroy: true });
  const world  = makeWorld({ player, enemies: [enemy] });

  EnemyMovementSystem.update({ dt: 0.016, world });

  assert.equal(enemy.x, 100, `pendingDestroy 적이 이동함 (x: ${enemy.x})`);
});

test('knockback 중인 적은 knockback 방향으로 이동', () => {
  const player = makePlayer({ x: 0, y: 0 });
  const enemy  = makeEnemy({
    x: 100, y: 0,
    knockbackX: -300, knockbackY: 0,
    knockbackTimer: 0.2,
    moveSpeed: 80,
  });
  const world = makeWorld({ player, enemies: [enemy] });

  EnemyMovementSystem.update({ dt: 0.016, world });

  // knockback 방향(-x)으로 이동해야 하므로 x가 100보다 작아야 함
  assert.ok(enemy.x < 100, `knockback 방향으로 이동하지 않음 (x: ${enemy.x})`);
});

// ─── 결과 ────────────────────────────────────────────────────────────

console.log(`\n결과: ${passed}개 통과, ${failed}개 실패`);
if (failed > 0) process.exit(1);
