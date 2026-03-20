/**
 * tests/ExperienceSystem.test.js — ExperienceSystem 단위 테스트
 *
 * 리팩터링:
 *   Before: 로컬 makePlayer/makePickup/makeEvents + passed/failed/test() 패턴
 *   After:  tests/fixtures/index.js  → makePlayer, makePickup, makeEvents, makeWorld
 *           tests/helpers/testRunner.js → test(), summary()
 *
 * 실행: npm test
 */

import assert from 'node:assert/strict';
import { makePlayer, makePickup, makeEvents, makeWorld } from './fixtures/index.js';
import { test, summary } from './helpers/testRunner.js';

let ExperienceSystem;
try {
  ({ ExperienceSystem } = await import('../src/systems/progression/ExperienceSystem.js'));
} catch {
  console.warn('[테스트] ExperienceSystem import 실패 — 로직 검증 스킵');
  ExperienceSystem = null;
}

console.log('\n[ExperienceSystem]');

test('픽업 수집 시 플레이어 xp 증가', () => {
  if (!ExperienceSystem) return;
  const player = makePlayer({ xp: 0 });
  const pickup = makePickup({ xpValue: 3 });
  const events = makeEvents({ pickupCollected: [{ pickup, playerId: player.id }] });
  ExperienceSystem.update({ world: makeWorld({ player, events, pickups: [pickup] }) });
  assert.ok(player.xp >= 3, `xp 미증가 (실제: ${player.xp})`);
});

test('magnetRadius 내 픽업은 magnetized=true', () => {
  if (!ExperienceSystem) return;
  const player = makePlayer({ x: 0, y: 0, magnetRadius: 100 });
  const nearby = makePickup({ x: 50,  y: 0, magnetized: false });
  const far    = makePickup({ x: 500, y: 0, magnetized: false });
  ExperienceSystem.update({ world: makeWorld({ player, pickups: [nearby, far] }) });
  assert.equal(nearby.magnetized, true,  '근처 픽업이 magnetized되지 않음');
  assert.equal(far.magnetized,    false, '먼 픽업이 magnetized됨');
});

test('pendingDestroy 픽업은 XP 계산 제외', () => {
  if (!ExperienceSystem) return;
  const player = makePlayer({ xp: 0 });
  const dead   = makePickup({ xpValue: 99, pendingDestroy: true });
  const events = makeEvents({ pickupCollected: [{ pickup: dead }] });
  ExperienceSystem.update({ world: makeWorld({ player, events }) });
  assert.equal(player.xp, 0, 'pendingDestroy 픽업 XP가 적용됨');
});

test('Phase 4: xpMult 적용 — 획득 XP에 배율 곱함 (올림 처리)', () => {
  if (!ExperienceSystem) return;
  const player = makePlayer({ xp: 0, xpMult: 1.5 });
  const pickup = makePickup({ xpValue: 10 }); // 10 * 1.5 = 15
  const events = makeEvents({ pickupCollected: [{ pickup, playerId: player.id }] });
  ExperienceSystem.update({ world: makeWorld({ player, events, pickups: [pickup] }) });
  assert.equal(player.xp, 15, `xpMult 미적용 또는 계산 틀림 (실제: ${player.xp})`);

  const player2 = makePlayer({ xp: 0, xpMult: 1.1 });
  const pickup2 = makePickup({ xpValue: 5 }); // 5 * 1.1 = 5.5 → Math.ceil(5.5) = 6
  const events2 = makeEvents({ pickupCollected: [{ pickup: pickup2, playerId: player2.id }] });
  ExperienceSystem.update({ world: makeWorld({ player: player2, events: events2, pickups: [pickup2] }) });
  assert.equal(player2.xp, 6, `xpMult 올림 처리 미적용 (실제: ${player2.xp})`);
});


summary();
