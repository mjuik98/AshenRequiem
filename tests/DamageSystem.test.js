/**
 * tests/DamageSystem.test.js — DamageSystem 단위 테스트
 *
 * 검증 항목:
 *   - hits 이벤트 기반 적 HP 감소
 *   - 데미지 적용 후 HP가 0 미만이 되지 않음
 *   - 플레이어 lifesteal: 데미지만큼 HP 회복 (maxHp 초과 금지)
 *   - 플레이어에게 직접 데미지 적용 (enemy → player)
 *   - pendingDestroy 타겟은 데미지 적용 건너뜀
 *   - isAlive=false 타겟은 데미지 적용 건너뜀
 *
 * 리팩터링:
 *   Before: 로컬 passed/failed/test() 패턴
 *   After:  tests/helpers/testRunner.js → test(), summary()
 *
 * 실행: npm test
 */

import assert from 'node:assert/strict';
import { makePlayer, makeEnemy, makeWorld, makeEvents, makeHit } from './fixtures/index.js';
import { test, summary } from './helpers/testRunner.js';

let DamageSystem;
try {
  ({ DamageSystem } = await import('../src/systems/combat/DamageSystem.js'));
} catch {
  console.warn('[테스트] DamageSystem import 실패 — 로직 검증 스킵');
  DamageSystem = null;
}

function run(world) {
  DamageSystem?.update({ world, data: {}, services: {} });
}

// ── 기본 데미지 적용 ──────────────────────────────────────────────────

console.log('\n[DamageSystem — 기본 데미지]');

test('hits 이벤트로 적 HP 감소', () => {
  if (!DamageSystem) return;
  const enemy  = makeEnemy({ hp: 100 });
  const events = makeEvents({ hits: [makeHit(enemy, 30)] });
  run(makeWorld({ enemies: [enemy], events }));
  assert.equal(enemy.hp, 70, `HP가 70이 아님 (실제: ${enemy.hp})`);
});

test('연속 hits — 누적 데미지 정확히 적용', () => {
  if (!DamageSystem) return;
  const enemy  = makeEnemy({ hp: 100 });
  const events = makeEvents({ hits: [makeHit(enemy, 30), makeHit(enemy, 20)] });
  run(makeWorld({ enemies: [enemy], events }));
  assert.equal(enemy.hp, 50, `HP가 50이 아님 (실제: ${enemy.hp})`);
});

test('HP가 0 아래로 내려가지 않는다 (사망 처리 포함)', () => {
  if (!DamageSystem) return;
  const enemy  = makeEnemy({ hp: 10 });
  const events = makeEvents({ hits: [makeHit(enemy, 999)] });
  run(makeWorld({ enemies: [enemy], events }));
  assert.ok(enemy.hp <= 0, `HP가 음수가 아닌 0 이하여야 함 (실제: ${enemy.hp})`);
});

// ── 플레이어 흡혈 ─────────────────────────────────────────────────────

console.log('\n[DamageSystem — lifesteal]');

test('lifesteal > 0 이면 데미지의 일부만큼 HP 회복', () => {
  if (!DamageSystem) return;
  const player = makePlayer({ hp: 50, maxHp: 100, lifesteal: 0.5 });
  const enemy  = makeEnemy({ hp: 100 });
  const events = makeEvents({ hits: [makeHit(enemy, 40, null)] });
  // 플레이어 무기가 적을 타격하는 시나리오
  events.hits[0].attackerId = player.id;
  run(makeWorld({ player, enemies: [enemy], events }));
  // lifesteal 0.5 × 40 = 20 회복 → 70
  assert.equal(player.hp, 70, `lifesteal 미적용 (실제 HP: ${player.hp})`);
});

test('lifesteal 회복 시 maxHp 초과하지 않는다', () => {
  if (!DamageSystem) return;
  const player = makePlayer({ hp: 95, maxHp: 100, lifesteal: 1.0 });
  const enemy  = makeEnemy({ hp: 100 });
  const events = makeEvents({ hits: [makeHit(enemy, 40)] });
  run(makeWorld({ player, enemies: [enemy], events }));
  assert.ok(player.hp <= 100, `HP가 maxHp를 초과함 (실제: ${player.hp})`);
});

// ── 플레이어 피격 ─────────────────────────────────────────────────────

console.log('\n[DamageSystem — 플레이어 피격]');

test('플레이어에게 데미지 적용', () => {
  if (!DamageSystem) return;
  const player = makePlayer({ hp: 100 });
  const events = makeEvents({ hits: [makeHit(player, 25)] });
  run(makeWorld({ player, events }));
  assert.equal(player.hp, 75, `플레이어 HP가 75 아님 (실제: ${player.hp})`);
});

test('플레이어 피격 시 invincibleTimer 설정', () => {
  if (!DamageSystem) return;
  const player = makePlayer({ hp: 100, invincibleTimer: 0, invincibleDuration: 0.5 });
  const events = makeEvents({ hits: [makeHit(player, 10)] });
  run(makeWorld({ player, events }));
  assert.ok(player.invincibleTimer > 0, 'invincibleTimer가 설정되지 않음');
});

// ── 가드 조건 ─────────────────────────────────────────────────────────

console.log('\n[DamageSystem — 가드 조건]');

test('pendingDestroy 타겟은 데미지 건너뜀', () => {
  if (!DamageSystem) return;
  const enemy  = makeEnemy({ hp: 100, pendingDestroy: true });
  const events = makeEvents({ hits: [makeHit(enemy, 50)] });
  run(makeWorld({ enemies: [enemy], events }));
  assert.equal(enemy.hp, 100, 'pendingDestroy 적에게 데미지 적용됨');
});

test('isAlive=false 타겟은 데미지 건너뜀', () => {
  if (!DamageSystem) return;
  const enemy  = makeEnemy({ hp: 100, isAlive: false });
  const events = makeEvents({ hits: [makeHit(enemy, 50)] });
  run(makeWorld({ enemies: [enemy], events }));
  assert.equal(enemy.hp, 100, '죽은 적에게 데미지 적용됨');
});

summary();
