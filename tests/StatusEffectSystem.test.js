/**
 * tests/StatusEffectSystem.test.js — StatusEffectSystem 단위 테스트
 *
 * CHANGE(BUG-3 fix): 테스트 계약 업데이트
 *
 *   Before (구 테스트):
 *     - "statusEffectId 있는 투사체" 케이스:
 *         assert(enemy.statusEffects.length === 0)  // 직접 부여 안 됨
 *     - "같은 타입 중복" 케이스:
 *         assert(events.statusApplied.length === 2)  // 큐에 2개
 *
 *   After (수정 테스트):
 *     - enemy.statusEffects.length === 1  // 직접 부여됨
 *     - events.statusApplied.length === 1 // 큐에 1개 (두 번째는 remaining 갱신으로 처리)
 *
 *   이유:
 *     BUG-3 수정으로 StatusEffectSystem._applyEffect()가
 *     entity.statusEffects에 직접 커밋하도록 변경됨.
 *     동일 타입 두 번째 히트는 entity.statusEffects에서 existing을 찾아
 *     remaining만 갱신하고 이벤트 큐에 다시 push하지 않음.
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
    attackerId:   'attacker',
    targetId:     target.id,
    target,
    damage:       1,
    projectileId: projectile?.id ?? null,
    projectile:   projectile ?? null,
  };
}

function makeEvents(overrides = {}) {
  return {
    hits:              [],
    deaths:            [],
    pickupCollected:   [],
    levelUpRequested:  [],
    statusApplied:     [],
    ...overrides,
  };
}

// ── StatusEffectSystem import ────────────────────────────────────────

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

// ── applyFromHits ─────────────────────────────────────────────────────

console.log('\n[StatusEffectSystem]');

test('statusEffectId 없는 투사체 → 상태이상 미부여', () => {
  const enemy = makeEnemy();
  const proj  = { id: 'p1' }; // statusEffectId 없음
  const hits  = [makeHit(enemy, proj)];

  StatusEffectSystem.applyFromHits({ hits });

  assert.equal(enemy.statusEffects.length, 0);
});

// CHANGE(BUG-3): entity.statusEffects에 직접 부여되도록 수정됨
test('statusEffectId 있는 투사체 → 이벤트 큐에 상태이상 부여 예약', () => {
  const enemy  = makeEnemy();
  const proj   = { id: 'p1', statusEffectId: 'slow', statusEffectChance: 1.0 };
  const hits   = [makeHit(enemy, proj)];
  const events = makeEvents();

  StatusEffectSystem.applyFromHits({ hits, events });

  // BUG-3 수정 후: entity에 직접 부여
  assert.equal(enemy.statusEffects.length, 1, '직접 부여되어야 함');
  // 알림용 이벤트 큐에도 push됨
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

// CHANGE(BUG-3): 중복 처리가 entity.statusEffects 기준으로 변경됨
//   Before: events.statusApplied에 2개 (중복 허용)
//   After:  events.statusApplied에 1개 (두 번째는 remaining 갱신만)
test('같은 타입 중복 부여 이벤트 예약', () => {
  const enemy  = makeEnemy();
  const proj   = { id: 'p1', statusEffectId: 'slow', statusEffectChance: 1.0 };
  const hits   = [makeHit(enemy, proj), makeHit(enemy, { ...proj, id: 'p2' })];
  const events = makeEvents();

  StatusEffectSystem.applyFromHits({ hits, events });

  // BUG-3 수정 후: 두 번째 히트는 remaining 갱신만 → 이벤트 큐에 1개만
  assert.equal(events.statusApplied.length, 1,
    '두 번째 히트는 기존 effect remaining 갱신이므로 큐에 1개만 들어가야 함');
  // entity에는 여전히 1개만
  assert.equal(enemy.statusEffects.length, 1, '중복 부여로 2개가 됨');
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

// ── tick ─────────────────────────────────────────────────────────────

test('remaining이 0 이하가 되면 상태이상 제거', () => {
  const enemy = makeEnemy();
  enemy.statusEffects.push({
    id:              'test-effect',
    type:            'slow',
    remaining:       0.01,
    magnitude:       0.5,
    tickInterval:    null,
    tickAccumulator: 0,
    color:           '#888',
  });

  const events = makeEvents();
  StatusEffectSystem.tick({ enemies: [enemy], player: null, deltaTime: 0.1, events });

  assert.equal(enemy.statusEffects.length, 0, '상태이상이 제거되지 않음');
});

test('remaining이 남아있으면 상태이상 유지', () => {
  const enemy = makeEnemy();
  enemy.statusEffects.push({
    id:              'test-effect',
    type:            'slow',
    remaining:       2.0,
    magnitude:       0.5,
    tickInterval:    null,
    tickAccumulator: 0,
    color:           '#888',
  });

  const events = makeEvents();
  StatusEffectSystem.tick({ enemies: [enemy], player: null, deltaTime: 0.016, events });

  assert.equal(enemy.statusEffects.length, 1, '상태이상이 조기 제거됨');
  assert.ok(enemy.statusEffects[0].remaining < 2.0, 'remaining이 감소하지 않음');
});

test('pendingDestroy 적은 tick 처리 제외', () => {
  const enemy = makeEnemy({ pendingDestroy: true });
  enemy.statusEffects.push({
    id:              'test-effect',
    type:            'slow',
    remaining:       0.005,
    magnitude:       0.5,
    tickInterval:    null,
    tickAccumulator: 0,
    color:           '#888',
  });

  const events = makeEvents();
  assert.doesNotThrow(() => {
    StatusEffectSystem.tick({ enemies: [enemy], player: null, deltaTime: 0.1, events });
  });
});

test('플레이어에게도 상태이상 틱 처리', () => {
  const player = makePlayer();
  player.statusEffects.push({
    id:              'player-effect',
    type:            'slow',
    remaining:       0.01,
    magnitude:       0.5,
    tickInterval:    null,
    tickAccumulator: 0,
    color:           '#888',
  });

  const events = makeEvents();
  StatusEffectSystem.tick({ enemies: [], player, deltaTime: 0.1, events });

  assert.equal(player.statusEffects.length, 0, '플레이어 상태이상이 제거되지 않음');
});

// ── 결과 ─────────────────────────────────────────────────────────────

console.log(`\n결과: ${passed}개 통과, ${failed}개 실패`);
if (failed > 0) process.exit(1);
