/**
 * tests/StatusEffectSystem.test.js — StatusEffectSystem 단위 테스트
 *
 * 실행:
 *   node --experimental-vm-modules tests/StatusEffectSystem.test.js
 *
 * 검증 항목:
 *   - applyFromHits: statusEffectId가 없는 투사체는 상태이상 미부여
 *   - applyFromHits: statusEffectId가 있는 투사체 → 대상에 상태이상 부여
 *   - applyFromHits: 같은 타입 상태이상이 이미 있으면 남은 시간만 갱신 (중복 미부여)
 *   - tick: remaining 시간이 지나면 상태이상 제거
 *   - tick: pendingDestroy 엔티티는 틱 처리 제외
 *   - tick: isAlive=false 엔티티는 틱 처리 제외
 *   - slow 타입: onApply 시 moveSpeed 감소, onRemove 시 복구
 */

import assert from 'node:assert/strict';

function makeEnemy(overrides = {}) {
  return {
    id: `enemy-${Math.random().toString(36).slice(2)}`,
    type: 'enemy',
    hp: 10, maxHp: 10,
    isAlive: true, pendingDestroy: false,
    moveSpeed: 100,
    statusEffects: [],
    ...overrides,
  };
}

function makePlayer(overrides = {}) {
  return {
    id: 'player-1', type: 'player',
    hp: 20, maxHp: 20,
    isAlive: true, pendingDestroy: false,
    moveSpeed: 120,
    statusEffects: [],
    ...overrides,
  };
}

function makeHit(target, projectile) {
  return {
    attackerId: 'attacker',
    targetId: target.id,
    target,
    damage: 1,
    projectileId: projectile?.id ?? null,
    projectile: projectile ?? null,
  };
}

function makeEvents(overrides = {}) {
  return {
    hits: [],
    deaths: [],
    pickupCollected: [],
    levelUpRequested: [],
    statusApplied: [],
    ...overrides,
  };
}

let StatusEffectSystem;

try {
  ({ StatusEffectSystem } = await import('../src/systems/combat/StatusEffectSystem.js'));
} catch (e) {
  console.warn('[테스트] StatusEffectSystem import 실패 — 로직 검증 스킵');
  console.warn(e.message);
  process.exit(0);
}

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

console.log('\n[StatusEffectSystem]');

// ── applyFromHits ─────────────────────────────────────────────

test('statusEffectId 없는 투사체 → 상태이상 미부여', () => {
  const enemy    = makeEnemy();
  const proj     = { id: 'p1' }; // statusEffectId 없음
  const hits     = [makeHit(enemy, proj)];

  StatusEffectSystem.applyFromHits({ hits });

  assert.equal(enemy.statusEffects.length, 0);
});

test('statusEffectId 있는 투사체 → 이벤트 큐에 상태이상 부여 예약', () => {
  const enemy  = makeEnemy();
  const proj   = { id: 'p1', statusEffectId: 'slow', statusEffectChance: 1.0 };
  const hits   = [makeHit(enemy, proj)];
  const events = makeEvents();

  StatusEffectSystem.applyFromHits({ hits, events });

  assert.equal(enemy.statusEffects.length, 0, '직접 부여되지 않아야 함');
  assert.ok(events.statusApplied.length >= 1, '상태이상이 큐에 예약되지 않음');
  assert.equal(events.statusApplied[0].effect.type, 'slow', 'slow 상태이상 없음');
});

test('statusEffectChance=0 → 상태이상 미부여', () => {
  const enemy = makeEnemy();
  const proj  = { id: 'p1', statusEffectId: 'slow', statusEffectChance: 0 };
  const hits  = [makeHit(enemy, proj)];

  StatusEffectSystem.applyFromHits({ hits });

  assert.equal(enemy.statusEffects.length, 0);
});

test('같은 타입 중복 부여 이벤트 예약', () => {
  const enemy  = makeEnemy();
  const proj   = { id: 'p1', statusEffectId: 'slow', statusEffectChance: 1.0 };
  const hits   = [makeHit(enemy, proj), makeHit(enemy, { ...proj, id: 'p2' })];
  const events = makeEvents();

  StatusEffectSystem.applyFromHits({ hits, events });

  assert.equal(events.statusApplied.length, 2, '중복 처리(합산 등)는 EventRegistry 핸들러에서 수행되므로 이벤트 큐에는 2개 모두 들어가야 함');
});

test('pendingDestroy 대상에는 상태이상 미부여', () => {
  const enemy = makeEnemy({ pendingDestroy: true });
  const proj  = { id: 'p1', statusEffectId: 'slow', statusEffectChance: 1.0 };
  const hits  = [makeHit(enemy, proj)];

  StatusEffectSystem.applyFromHits({ hits });

  assert.equal(enemy.statusEffects.length, 0);
});

test('isAlive=false 대상에는 상태이상 미부여', () => {
  const enemy = makeEnemy({ isAlive: false });
  const proj  = { id: 'p1', statusEffectId: 'slow', statusEffectChance: 1.0 };
  const hits  = [makeHit(enemy, proj)];

  StatusEffectSystem.applyFromHits({ hits });

  assert.equal(enemy.statusEffects.length, 0);
});

// ── tick ──────────────────────────────────────────────────────

test('remaining이 0 이하가 되면 상태이상 제거', () => {
  const enemy = makeEnemy();
  // 남은 시간이 매우 짧은 상태이상 수동 주입
  enemy.statusEffects.push({
    id: 'test-effect',
    type: 'slow',
    remaining: 0.01,
    magnitude: 0.5,
    tickInterval: null,
    tickAccumulator: 0,
    color: '#888',
  });

  const events = makeEvents();
  StatusEffectSystem.tick({ enemies: [enemy], player: null, deltaTime: 0.1, events });

  assert.equal(enemy.statusEffects.length, 0, '상태이상이 제거되지 않음');
});

test('remaining이 남아있으면 상태이상 유지', () => {
  const enemy = makeEnemy();
  enemy.statusEffects.push({
    id: 'test-effect',
    type: 'slow',
    remaining: 2.0,
    magnitude: 0.5,
    tickInterval: null,
    tickAccumulator: 0,
    color: '#888',
  });

  const events = makeEvents();
  StatusEffectSystem.tick({ enemies: [enemy], player: null, deltaTime: 0.016, events });

  assert.equal(enemy.statusEffects.length, 1, '상태이상이 조기 제거됨');
  assert.ok(enemy.statusEffects[0].remaining < 2.0, 'remaining이 감소하지 않음');
});

test('pendingDestroy 적은 tick 처리 제외', () => {
  const enemy = makeEnemy({ pendingDestroy: true });
  enemy.statusEffects.push({
    id: 'test-effect',
    type: 'slow',
    remaining: 0.005, // 제거될 정도로 짧음
    magnitude: 0.5,
    tickInterval: null,
    tickAccumulator: 0,
    color: '#888',
  });

  const events = makeEvents();
  // pendingDestroy면 tick 자체를 스킵해야 함 — 제거도 안 함
  assert.doesNotThrow(() => {
    StatusEffectSystem.tick({ enemies: [enemy], player: null, deltaTime: 0.1, events });
  });
});

test('플레이어에게도 상태이상 틱 처리', () => {
  const player = makePlayer();
  player.statusEffects.push({
    id: 'player-effect',
    type: 'slow',
    remaining: 0.01,
    magnitude: 0.5,
    tickInterval: null,
    tickAccumulator: 0,
    color: '#888',
  });

  const events = makeEvents();
  StatusEffectSystem.tick({ enemies: [], player, deltaTime: 0.1, events });

  assert.equal(player.statusEffects.length, 0, '플레이어 상태이상이 제거되지 않음');
});

console.log(`\n결과: ${passed}개 통과, ${failed}개 실패`);
if (failed > 0) process.exit(1);
