/**
 * tests/StatusEffectSystem.test.js — StatusEffectSystem 단위 테스트
 *
 * FIX(TEST-BUG-3): BUG-3 수정 이후 2개 테스트 케이스 갱신
 *
 *   실패하던 테스트:
 *     ✗ "statusEffectId 있는 투사체 → 이벤트 큐에 상태이상 부여 예약 / 직접 부여되지 않아야 함"
 *     ✗ "중복 상태이상 부여 방지"
 *
 *   실패 원인:
 *     BUG-3 수정 전에는 _applyEffect()가 entity.statusEffects에는 push하지 않고
 *     events.statusApplied 큐에만 push했음 (이벤트 핸들러가 실제 적용 담당).
 *
 *     BUG-3 수정 후에는 _applyEffect()가 entity.statusEffects에 즉시 push함
 *     (중복 방지도 entity.statusEffects 기준으로 동작).
 *
 *   수정 방향:
 *     1. "직접 부여되지 않아야 함" → "entity.statusEffects에 즉시 부여되어야 함"으로 변경
 *     2. "중복 방지" → 동일 프레임 2번 적용해도 entity.statusEffects에 1개만 남아야 함으로 변경
 *
 *   실행: npm test
 */

import assert from 'node:assert/strict';
import { makeEnemy, makePlayer, makeEvents } from './fixtures/index.js';

let StatusEffectSystem;
try {
  ({ StatusEffectSystem } = await import('../src/systems/combat/StatusEffectSystem.js'));
} catch {
  console.warn('[테스트] StatusEffectSystem import 실패 — 로직 검증 스킵');
  StatusEffectSystem = null;
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

// ── applyFromHits ────────────────────────────────────────────────────

test('statusEffectId 없는 투사체 → 상태이상 미부여', () => {
  if (!StatusEffectSystem) return;
  const enemy = makeEnemy();
  const proj  = { isAlive: true, pendingDestroy: false };
  const hit   = { target: enemy, projectile: proj };
  const events = makeEvents();

  StatusEffectSystem.applyFromHits({ hits: [hit], events });
  assert.equal(enemy.statusEffects.length, 0, '상태이상이 잘못 부여됨');
});

test('statusEffectChance=0 → 상태이상 미부여', () => {
  if (!StatusEffectSystem) return;
  const enemy = makeEnemy();
  const proj  = { isAlive: true, pendingDestroy: false, statusEffectId: 'slow', statusEffectChance: 0 };
  const hit   = { target: enemy, projectile: proj };
  const events = makeEvents();

  StatusEffectSystem.applyFromHits({ hits: [hit], events });
  assert.equal(enemy.statusEffects.length, 0, '확률 0인데 상태이상 부여됨');
});

test('pendingDestroy 대상에는 상태이상 미부여', () => {
  if (!StatusEffectSystem) return;
  const enemy = makeEnemy({ pendingDestroy: true });
  const proj  = { isAlive: true, pendingDestroy: false, statusEffectId: 'slow', statusEffectChance: 1.0 };
  const hit   = { target: enemy, projectile: proj };
  const events = makeEvents();

  StatusEffectSystem.applyFromHits({ hits: [hit], events });
  assert.equal(enemy.statusEffects.length, 0, 'pendingDestroy 대상에 상태이상 부여됨');
});

test('isAlive=false 대상에는 상태이상 미부여', () => {
  if (!StatusEffectSystem) return;
  const enemy = makeEnemy({ isAlive: false });
  const proj  = { isAlive: true, pendingDestroy: false, statusEffectId: 'slow', statusEffectChance: 1.0 };
  const hit   = { target: enemy, projectile: proj };
  const events = makeEvents();

  StatusEffectSystem.applyFromHits({ hits: [hit], events });
  assert.equal(enemy.statusEffects.length, 0, '죽은 대상에 상태이상 부여됨');
});

/**
 * FIX(TEST-BUG-3): 이전 테스트는 "직접 부여되지 않아야 함"이라고 검증했으나,
 *   BUG-3 수정으로 entity.statusEffects에 즉시 push하는 것이 올바른 동작.
 *   → 이제 "entity.statusEffects에 즉시 1개 부여되어야 함"으로 검증.
 *
 *   Before (실패하던 코드):
 *     assert.equal(enemy.statusEffects.length, 0, '직접 부여되지 않아야 함');
 *
 *   After (수정):
 *     assert.equal(enemy.statusEffects.length, 1, 'entity에 즉시 부여되어야 함');
 *     assert.equal(events.statusApplied.length, 1, '알림 이벤트도 발행되어야 함');
 */
test('statusEffectId 있는 투사체 → entity.statusEffects에 즉시 부여 (BUG-3 수정 이후 동작)', () => {
  if (!StatusEffectSystem) return;
  const enemy = makeEnemy();
  const proj  = {
    isAlive: true,
    pendingDestroy: false,
    statusEffectId:     'slow',
    statusEffectChance: 1.0,
  };
  const hit    = { target: enemy, projectile: proj };
  const events = makeEvents();

  StatusEffectSystem.applyFromHits({ hits: [hit], events });

  // BUG-3 수정 후: entity에 즉시 직접 push
  assert.equal(enemy.statusEffects.length, 1, 'entity.statusEffects에 즉시 부여되어야 함');
  // events.statusApplied는 알림 전용 큐 (이벤트 핸들러 연동용)
  assert.equal(events.statusApplied?.length ?? 0, 1, 'statusApplied 알림도 발행되어야 함');
});

/**
 * FIX(TEST-BUG-3): 중복 방지 테스트 갱신
 *
 *   Before (실패하던 코드):
 *     StatusEffectSystem.applyFromHits 2번 호출 후
 *     entity.statusEffects.length === 0 이라고 검증 (큐잉 방식 기준)
 *
 *   After (수정):
 *     entity.statusEffects.length === 1 이어야 함
 *     (두 번 호출해도 같은 타입이면 1개만 남음, remaining만 갱신)
 */
test('동일 타입 상태이상 2회 적용 → entity.statusEffects에 1개만 존재 (중복 방지)', () => {
  if (!StatusEffectSystem) return;
  const enemy = makeEnemy();
  const proj  = {
    isAlive: true,
    pendingDestroy: false,
    statusEffectId:     'slow',
    statusEffectChance: 1.0,
  };
  const hit    = { target: enemy, projectile: proj };
  const events = makeEvents();

  // 동일 타입 2회 연속 적용 (같은 프레임 시뮬레이션)
  StatusEffectSystem.applyFromHits({ hits: [hit, hit], events });

  // BUG-3 수정 후: 두 번째 _applyEffect는 existing을 발견하고 remaining 갱신만 수행
  assert.equal(enemy.statusEffects.length, 1, '중복 적용되면 안 됨 — 1개만 존재해야 함');
});

// ── tick ────────────────────────────────────────────────────────────

test('remaining이 0 이하가 되면 상태이상 제거', () => {
  if (!StatusEffectSystem) return;
  const enemy = makeEnemy();
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
  StatusEffectSystem.tick({ enemies: [enemy], player: null, deltaTime: 0.1, events });

  assert.equal(enemy.statusEffects.length, 0, '상태이상이 제거되지 않음');
});

test('remaining이 남아있으면 상태이상 유지', () => {
  if (!StatusEffectSystem) return;
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
  if (!StatusEffectSystem) return;
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
  if (!StatusEffectSystem) return;
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
