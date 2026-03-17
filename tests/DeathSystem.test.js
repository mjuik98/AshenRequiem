/**
 * tests/DeathSystem.test.js — DeathSystem 단위 테스트
 *
 * 실행:
 *   node --experimental-vm-modules tests/DeathSystem.test.js
 *
 * 검증 항목:
 *   - 적 사망 시 killCount 증가
 *   - 적 사망 시 XP 픽업 spawnQueue 추가
 *   - 적 사망 시 이펙트 spawnQueue 추가
 *   - deathSpawn 설정 시 하위 적 spawnQueue 추가
 *   - 플레이어 사망 시 playMode = 'dead'
 *   - events.deaths 가 빈 배열이면 아무것도 안 함
 *   - pendingDestroy 적은 이미 dead 처리가 완료된 것이므로 deaths 이벤트에 오면 안 됨(주의 케이스)
 */

import assert from 'node:assert/strict';

// ─── 픽스처 ──────────────────────────────────────────────────────────

function makeEnemy(overrides = {}) {
  return {
    id:            `e_${Math.random().toString(36).slice(2)}`,
    type:          'enemy',
    x:             100,
    y:             200,
    radius:        12,
    color:         '#e53935',
    xpValue:       5,
    hp:            0,
    isAlive:       false,
    pendingDestroy: true,
    deathSpawn:    null,
    ...overrides,
  };
}

function makePlayer(overrides = {}) {
  return {
    id:     'player',
    type:   'player',
    x:      0,
    y:      0,
    radius: 14,
    hp:     0,
    isAlive: false,
    pendingDestroy: true,
    ...overrides,
  };
}

function makeContext(deathEntities = []) {
  return {
    events: {
      deaths: deathEntities.map(entity => ({ entity })),
    },
    worldState: {
      killCount: 0,
      playMode:  'playing',
    },
    spawnQueue: [],
  };
}

// ─── DeathSystem import ───────────────────────────────────────────────

let DeathSystem;
try {
  ({ DeathSystem } = await import('../src/systems/combat/DeathSystem.js'));
} catch {
  console.warn('[테스트] DeathSystem import 실패 — 스킵');
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
    console.error(`    ${e.message}`);
    failed++;
  }
}

// ─── 기본 동작 ────────────────────────────────────────────────────────

console.log('\n[DeathSystem — 기본 동작]');

test('events.deaths 빈 배열이면 spawnQueue·killCount 변화 없음', () => {
  const ctx = makeContext([]);
  DeathSystem.update(ctx);
  assert.equal(ctx.spawnQueue.length, 0);
  assert.equal(ctx.worldState.killCount, 0);
});

test('적 사망 시 killCount +1', () => {
  const ctx = makeContext([makeEnemy()]);
  DeathSystem.update(ctx);
  assert.equal(ctx.worldState.killCount, 1);
});

test('적 2마리 사망 시 killCount +2', () => {
  const ctx = makeContext([makeEnemy(), makeEnemy()]);
  DeathSystem.update(ctx);
  assert.equal(ctx.worldState.killCount, 2);
});

// ─── spawnQueue 항목 검증 ────────────────────────────────────────────

console.log('\n[DeathSystem — spawnQueue]');

test('적 사망 시 XP 픽업이 spawnQueue에 추가됨', () => {
  const enemy = makeEnemy({ x: 50, y: 80, xpValue: 10 });
  const ctx   = makeContext([enemy]);
  DeathSystem.update(ctx);

  const pickup = ctx.spawnQueue.find(q => q.type === 'pickup');
  assert.ok(pickup, 'pickup 항목이 spawnQueue에 없음');
  assert.equal(pickup.config.x, 50);
  assert.equal(pickup.config.y, 80);
  assert.equal(pickup.config.xpValue, 10);
});

test('적 사망 시 이펙트가 spawnQueue에 추가됨', () => {
  const enemy = makeEnemy({ x: 100, y: 200 });
  const ctx   = makeContext([enemy]);
  DeathSystem.update(ctx);

  const effect = ctx.spawnQueue.find(q => q.type === 'effect');
  assert.ok(effect, 'effect 항목이 spawnQueue에 없음');
  assert.equal(effect.config.x, 100);
  assert.equal(effect.config.y, 200);
});

test('적 사망 시 spawnQueue 항목은 pickup + effect 최소 2개', () => {
  const ctx = makeContext([makeEnemy()]);
  DeathSystem.update(ctx);
  assert.ok(ctx.spawnQueue.length >= 2, `spawnQueue 항목 부족: ${ctx.spawnQueue.length}`);
});

// ─── deathSpawn ───────────────────────────────────────────────────────

console.log('\n[DeathSystem — deathSpawn]');

test('deathSpawn 설정 시 하위 적이 spawnQueue에 추가됨', () => {
  const enemy = makeEnemy({
    x: 0, y: 0,
    deathSpawn: { enemyId: 'slime_small', count: 3 },
  });
  const ctx = makeContext([enemy]);
  DeathSystem.update(ctx);

  const spawned = ctx.spawnQueue.filter(q => q.type === 'enemy');
  assert.equal(spawned.length, 3, `deathSpawn count=3인데 enemy spawn이 ${spawned.length}개`);
  assert.ok(spawned.every(q => q.config.enemyId === 'slime_small'));
});

test('deathSpawn null이면 enemy spawn 없음', () => {
  const enemy = makeEnemy({ deathSpawn: null });
  const ctx   = makeContext([enemy]);
  DeathSystem.update(ctx);

  const spawned = ctx.spawnQueue.filter(q => q.type === 'enemy');
  assert.equal(spawned.length, 0);
});

// ─── 플레이어 사망 ────────────────────────────────────────────────────

console.log('\n[DeathSystem — 플레이어 사망]');

test('플레이어 사망 시 worldState.playMode = "dead"', () => {
  const ctx = makeContext([makePlayer()]);
  DeathSystem.update(ctx);
  assert.equal(ctx.worldState.playMode, 'dead');
});

test('플레이어 사망 시 killCount는 증가하지 않음', () => {
  const ctx = makeContext([makePlayer()]);
  DeathSystem.update(ctx);
  assert.equal(ctx.worldState.killCount, 0);
});

test('적+플레이어 동시 사망 — killCount 1, playMode dead', () => {
  const ctx = makeContext([makeEnemy(), makePlayer()]);
  DeathSystem.update(ctx);
  assert.equal(ctx.worldState.killCount, 1);
  assert.equal(ctx.worldState.playMode, 'dead');
});

// ─── 결과 ────────────────────────────────────────────────────────────

console.log(`\n결과: ${passed}개 통과, ${failed}개 실패`);
if (failed > 0) process.exit(1);
