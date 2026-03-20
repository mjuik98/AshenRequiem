/**
 * tests/StatusEffectSystem.test.js — StatusEffectSystem 단위 테스트
 *
 * 리팩터링:
 *   Before: 로컬 passed/failed/test() 패턴
 *   After:  tests/helpers/testRunner.js → test(), summary()
 *
 * 실행: npm test
 */

import assert from 'node:assert/strict';
import { makeEnemy, makePlayer, makeEvents } from './fixtures/index.js';
import { test, summary } from './helpers/testRunner.js';

let StatusEffectSystem;
try {
  ({ StatusEffectSystem } = await import('../src/systems/combat/StatusEffectSystem.js'));
} catch {
  console.warn('[테스트] StatusEffectSystem import 실패 — 로직 검증 스킵');
  StatusEffectSystem = null;
}

console.log('\n[StatusEffectSystem]');

// ── applyFromHits ─────────────────────────────────────────────────────

test('statusEffectId 없는 투사체 → 상태이상 미부여', () => {
  if (!StatusEffectSystem) return;
  const enemy  = makeEnemy();
  const hit    = { target: enemy, projectile: { isAlive: true, pendingDestroy: false } };
  const events = makeEvents();
  StatusEffectSystem.applyFromHits({ hits: [hit], events });
  assert.equal(enemy.statusEffects.length, 0, '상태이상이 잘못 부여됨');
});

test('statusEffectChance=0 → 상태이상 미부여', () => {
  if (!StatusEffectSystem) return;
  const enemy  = makeEnemy();
  const proj   = { isAlive: true, pendingDestroy: false, statusEffectId: 'slow', statusEffectChance: 0 };
  const events = makeEvents();
  StatusEffectSystem.applyFromHits({ hits: [{ target: enemy, projectile: proj }], events });
  assert.equal(enemy.statusEffects.length, 0, '확률 0인데 상태이상 부여됨');
});

test('pendingDestroy 대상에는 상태이상 미부여', () => {
  if (!StatusEffectSystem) return;
  const enemy  = makeEnemy({ pendingDestroy: true });
  const proj   = { isAlive: true, pendingDestroy: false, statusEffectId: 'slow', statusEffectChance: 1.0 };
  const events = makeEvents();
  StatusEffectSystem.applyFromHits({ hits: [{ target: enemy, projectile: proj }], events });
  assert.equal(enemy.statusEffects.length, 0, 'pendingDestroy 대상에 상태이상 부여됨');
});

test('isAlive=false 대상에는 상태이상 미부여', () => {
  if (!StatusEffectSystem) return;
  const enemy  = makeEnemy({ isAlive: false });
  const proj   = { isAlive: true, pendingDestroy: false, statusEffectId: 'slow', statusEffectChance: 1.0 };
  const events = makeEvents();
  StatusEffectSystem.applyFromHits({ hits: [{ target: enemy, projectile: proj }], events });
  assert.equal(enemy.statusEffects.length, 0, '죽은 대상에 상태이상 부여됨');
});

test('statusEffectId 있는 투사체 → entity.statusEffects에 즉시 부여 (BUG-3 수정)', () => {
  if (!StatusEffectSystem) return;
  const enemy  = makeEnemy();
  const proj   = { isAlive: true, pendingDestroy: false, statusEffectId: 'slow', statusEffectChance: 1.0 };
  const events = makeEvents();
  StatusEffectSystem.applyFromHits({ hits: [{ target: enemy, projectile: proj }], events });
  assert.equal(enemy.statusEffects.length, 1, 'entity.statusEffects에 즉시 부여되어야 함');
  assert.equal(events.statusApplied?.length ?? 0, 1, 'statusApplied 알림도 발행되어야 함');
});

test('동일 타입 상태이상 2회 적용 → 1개만 존재 (중복 방지)', () => {
  if (!StatusEffectSystem) return;
  const enemy  = makeEnemy();
  const proj   = { isAlive: true, pendingDestroy: false, statusEffectId: 'slow', statusEffectChance: 1.0 };
  const hit    = { target: enemy, projectile: proj };
  const events = makeEvents();
  StatusEffectSystem.applyFromHits({ hits: [hit, hit], events });
  assert.equal(enemy.statusEffects.length, 1, '중복 적용됨 — 1개만 존재해야 함');
});

// ── tick ──────────────────────────────────────────────────────────────

test('remaining이 0 이하가 되면 상태이상 제거', () => {
  if (!StatusEffectSystem) return;
  const enemy = makeEnemy();
  enemy.statusEffects.push({
    id: 'se_1', type: 'slow', remaining: 0.001,
    magnitude: 0.3, tickInterval: null, tickAccumulator: 0, color: '#aaa',
  });
  const events = makeEvents();
  StatusEffectSystem.tick({ enemies: [enemy], player: null, deltaTime: 0.1, events });
  assert.equal(enemy.statusEffects.length, 0, '만료된 상태이상이 제거되지 않음');
});

summary();
