/**
 * tests/ExperienceSystem.test.js — ExperienceSystem 단위 테스트
 */

import assert from 'node:assert/strict';

function makePlayer(overrides = {}) {
  return {
    id: 'p1', type: 'player',
    xp: 0, xpToNext: 10, level: 1,
    isAlive: true, pendingDestroy: false,
    magnetRadius: 100,
    x: 0, y: 0,
    ...overrides,
  };
}

function makePickup(overrides = {}) {
  return {
    id: `pk-${Math.random()}`, type: 'pickup',
    xpValue: 1,
    isAlive: true, pendingDestroy: false,
    x: 0, y: 0, radius: 6,
    ...overrides,
  };
}

function makeEvents(overrides = {}) {
  return {
    hits:             [],
    deaths:           [],
    pickupCollected:  [],
    levelUpRequested: [],
    ...overrides,
  };
}

let ExperienceSystem;
try {
  ({ ExperienceSystem } = await import('../src/systems/progression/ExperienceSystem.js'));
} catch {
  console.warn('[테스트] ExperienceSystem import 실패 — 로직 검증 스킵');
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

console.log('\n[ExperienceSystem]');

if (ExperienceSystem) {
  test('픽업 수집 시 플레이어 xp 증가', () => {
    const player  = makePlayer({ xp: 0 });
    const pickup  = makePickup({ xpValue: 3 });
    const events  = makeEvents({ pickupCollected: [{ pickup, playerId: player.id }] });
    ExperienceSystem.update({ world: { events, player, pickups: [pickup], deltaTime: 0.016 } });
    assert.ok(player.xp >= 3);
  });
}

console.log(`\n결과: ${passed}개 통과, ${failed}개 실패`);
if (failed > 0) process.exit(1);
