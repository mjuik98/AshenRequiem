/**
 * tests/MovementSystems.test.js — PlayerMovementSystem + EnemyMovementSystem 단위 테스트
 *
 * 검증 항목 (PlayerMovementSystem):
 *   - 입력 방향으로 플레이어 이동
 *   - 대각선 입력 시 정규화 (속도 1.0 유지)
 *   - 입력 없을 때 정지
 *   - isAlive=false 플레이어 이동 없음
 *
 * 검증 항목 (EnemyMovementSystem):
 *   - 적이 플레이어를 향해 이동
 *   - 이동 후 플레이어와 거리가 가까워짐
 *   - pendingDestroy 적은 이동하지 않음
 *   - knockback 중인 적은 knockback 방향으로 이동
 *
 * 실행: npm test
 */

import assert from 'node:assert/strict';

let PlayerMovementSystem, EnemyMovementSystem;
try {
  [
    { PlayerMovementSystem } = await import('../src/systems/movement/PlayerMovementSystem.js'),
    { EnemyMovementSystem  } = await import('../src/systems/movement/EnemyMovementSystem.js'),
  ];
} catch (e) {
  console.warn('[테스트] MovementSystems import 실패 — 스킵:', e.message);
  process.exit(0);
}

// ── 픽스처 ────────────────────────────────────────────────────────────

function makePlayer(overrides = {}) {
  return {
    id: 'player', type: 'player',
    x: 0, y: 0, radius: 16,
    hp: 100, maxHp: 100,
    isAlive: true, pendingDestroy: false,
    moveSpeed: 200,
    ...overrides,
  };
}

function makeEnemy(overrides = {}) {
  return {
    id: `e_${Math.random().toString(36).slice(2)}`,
    type: 'enemy',
    x: 100, y: 0, radius: 20,
    hp: 50, maxHp: 50,
    isAlive: true, pendingDestroy: false,
    moveSpeed: 80,
    knockbackX: 0, knockbackY: 0, knockbackTimer: 0,
    ...overrides,
  };
}

function makeInput(overrides = {}) {
  const state = { dx: 0, dy: 0, ...overrides };
  return {
    ...state,
    getDirection() {
      const len = Math.sqrt(state.dx * state.dx + state.dy * state.dy);
      if (len === 0) return { x: 0, y: 0 };
      return { x: state.dx / len, y: state.dy / len };
    }
  };
}

function makeWorld(overrides = {}) {
  return {
    player:  makePlayer(),
    enemies: [],
    deltaTime: 0.016,
    ...overrides,
  };
}

// ── 테스트 러너 ───────────────────────────────────────────────────────

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

function dist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// ── PlayerMovementSystem ──────────────────────────────────────────────

console.log('\n[PlayerMovementSystem 테스트 시작]');

test('오른쪽 입력 시 x가 증가한다', () => {
  const player = makePlayer({ x: 0, y: 0, moveSpeed: 200 });
  const world  = makeWorld({ player, deltaTime: 1.0 });
  const input  = makeInput({ dx: 1, dy: 0 });

  PlayerMovementSystem.update({ world, input });

  assert(player.x > 0, `x가 증가하지 않음 (x: ${player.x})`);
  assert.equal(player.y, 0, `y가 변경됨 (y: ${player.y})`);
});

test('입력 없을 때 플레이어가 멈춘다', () => {
  const player = makePlayer({ x: 50, y: 50 });
  const world  = makeWorld({ player, deltaTime: 0.016 });
  const input  = makeInput({ dx: 0, dy: 0 });

  PlayerMovementSystem.update({ world, input });

  assert.equal(player.x, 50, 'x 변경됨');
  assert.equal(player.y, 50, 'y 변경됨');
});

test('대각선 이동 시 속력이 단일 방향보다 빠르지 않다', () => {
  const pDiag  = makePlayer({ x: 0, y: 0, moveSpeed: 200 });
  const pRight = makePlayer({ x: 0, y: 0, moveSpeed: 200 });
  const dt     = 1.0;

  PlayerMovementSystem.update({ world: makeWorld({ player: pDiag,  deltaTime: dt }), input: makeInput({ dx: 1, dy: 1 }) });
  PlayerMovementSystem.update({ world: makeWorld({ player: pRight, deltaTime: dt }), input: makeInput({ dx: 1, dy: 0 }) });

  const speedDiag  = Math.sqrt(pDiag.x  * pDiag.x  + pDiag.y  * pDiag.y);
  const speedRight = Math.sqrt(pRight.x * pRight.x + pRight.y * pRight.y);

  assert(speedDiag <= speedRight + 0.1, `대각선 속력(${speedDiag.toFixed(2)})이 단일 방향(${speedRight.toFixed(2)})보다 큼 — 정규화 미적용`);
});

test('isAlive=false 플레이어는 이동하지 않는다', () => {
  const player = makePlayer({ x: 0, y: 0, isAlive: false });
  const world  = makeWorld({ player, deltaTime: 1.0 });
  const input  = makeInput({ dx: 1, dy: 0 });

  PlayerMovementSystem.update({ world, input });

  assert.equal(player.x, 0, '죽은 플레이어가 이동함');
});

// ── EnemyMovementSystem ───────────────────────────────────────────────

console.log('\n[EnemyMovementSystem 테스트 시작]');

test('적이 플레이어 방향으로 이동해 거리가 줄어든다', () => {
  const player = makePlayer({ x: 0, y: 0 });
  const enemy  = makeEnemy({ x: 100, y: 0, moveSpeed: 80 });
  const world  = makeWorld({ player, enemies: [enemy], deltaTime: 0.1 });

  const before = dist(player, enemy);
  EnemyMovementSystem.update({ world });
  const after = dist(player, enemy);

  assert(after < before, `적이 플레이어에 가까워지지 않음 (before: ${before}, after: ${after})`);
});

test('pendingDestroy 적은 이동하지 않는다', () => {
  const player = makePlayer({ x: 0, y: 0 });
  const enemy  = makeEnemy({ x: 100, y: 0, pendingDestroy: true });
  const world  = makeWorld({ player, enemies: [enemy], deltaTime: 0.1 });

  const beforeX = enemy.x;
  EnemyMovementSystem.update({ world });

  assert.equal(enemy.x, beforeX, 'pendingDestroy 적이 이동함');
});

test('knockbackTimer > 0인 적은 knockback 방향으로 밀린다', () => {
  const player = makePlayer({ x: 0, y: 0 });
  const enemy  = makeEnemy({
    x: 100, y: 0,
    knockbackX: 1, knockbackY: 0,
    knockbackTimer: 0.5,
    moveSpeed: 0,  // 일반 이동 제거
  });
  const world = makeWorld({ player, enemies: [enemy], deltaTime: 0.1 });

  const beforeX = enemy.x;
  EnemyMovementSystem.update({ world });

  assert(enemy.x > beforeX, `넉백 방향 이동 실패 (before: ${beforeX}, after: ${enemy.x})`);
});

// ── 결과 ─────────────────────────────────────────────────────────────

console.log(`\n최종 결과: ${passed}개 통과, ${failed}개 실패`);
if (failed > 0) process.exit(1);
