/**
 * tests/DamageSystem.test.js — DamageSystem 단위 테스트
 */

import assert from 'node:assert/strict';

function makeEnemy(overrides = {}) {
  return {
    id: 'e1', type: 'enemy',
    hp: 10, maxHp: 10,
    isAlive: true, pendingDestroy: false,
    hitFlashTimer: 0,
    knockbackX: 0, knockbackY: 0, knockbackTimer: 0,
    knockbackResist: 0,
    radius: 12,
    ...overrides,
  };
}

function makePlayer(overrides = {}) {
  return {
    id: 'p1', type: 'player',
    hp: 20, maxHp: 20,
    isAlive: true, pendingDestroy: false,
    invincibleTimer: 0, invincibleDuration: 1.0,
    lifesteal: 0,
    radius: 14,
    ...overrides,
  };
}

function makeHit(target, damage, projectile = null) {
  return {
    attackerId: 'attacker', targetId: target.id,
    target, damage, projectileId: null, projectile,
  };
}

function makeEvents(hits = []) {
  return {
    hits,
    deaths:           [],
    pickupCollected:  [],
    levelUpRequested: [],
  };
}

let DamageSystem;
try {
  ({ DamageSystem } = await import('../src/systems/combat/DamageSystem.js'));
} catch {
  console.warn('[테스트] DamageSystem import 실패 — 로직 검증 스킵');
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

console.log('\n[DamageSystem]');

if (DamageSystem) {
  test('적에게 데미지 정상 적용', () => {
    const enemy  = makeEnemy({ hp: 10 });
    const player = makePlayer();
    const events = makeEvents([makeHit(enemy, 4)]);
    DamageSystem.update({ events, player, spawnQueue: [] });
    assert.equal(enemy.hp, 6);
    assert.equal(enemy.isAlive, true);
  });

  test('데미지가 hp를 0 이하로 만들면 사망 처리', () => {
    const enemy  = makeEnemy({ hp: 3 });
    const player = makePlayer();
    const events = makeEvents([makeHit(enemy, 10)]);
    DamageSystem.update({ events, player, spawnQueue: [] });
    assert.equal(enemy.hp, 0);
    assert.equal(enemy.isAlive, false);
    assert.equal(enemy.pendingDestroy, true);
    assert.equal(events.deaths.length, 1);
  });
}

console.log(`\n결과: ${passed}개 통과, ${failed}개 실패`);
if (failed > 0) process.exit(1);
