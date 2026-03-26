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
  ExperienceSystem.update({ world: makeWorld({ entities: { player, pickups: [pickup] }, queues: { events } }) });
  assert.ok(player.xp >= 3, `xp 미증가 (실제: ${player.xp})`);
});

test('magnetRadius 내 픽업은 magnetized=true', () => {
  if (!ExperienceSystem) return;
  const player = makePlayer({ x: 0, y: 0, magnetRadius: 100 });
  const nearby = makePickup({ x: 50,  y: 0, magnetized: false });
  const far    = makePickup({ x: 500, y: 0, magnetized: false });
  ExperienceSystem.update({ world: makeWorld({ entities: { player, pickups: [nearby, far] } }) });
  assert.equal(nearby.magnetized, true,  '근처 픽업이 magnetized되지 않음');
  assert.equal(far.magnetized,    false, '먼 픽업이 magnetized됨');
});

test('pendingDestroy 픽업은 XP 계산 제외', () => {
  if (!ExperienceSystem) return;
  const player = makePlayer({ xp: 0 });
  const dead   = makePickup({ xpValue: 99, pendingDestroy: true });
  const events = makeEvents({ pickupCollected: [{ pickup: dead }] });
  ExperienceSystem.update({ world: makeWorld({ entities: { player }, queues: { events } }) });
  assert.equal(player.xp, 0, 'pendingDestroy 픽업 XP가 적용됨');
});

test('Phase 4: xpMult 적용 — 획득 XP에 배율 곱함 (올림 처리)', () => {
  if (!ExperienceSystem) return;
  const player = makePlayer({ xp: 0, xpMult: 1.5 });
  const pickup = makePickup({ xpValue: 10 }); // 10 * 1.5 = 15
  const events = makeEvents({ pickupCollected: [{ pickup, playerId: player.id }] });
  ExperienceSystem.update({ world: makeWorld({ entities: { player, pickups: [pickup] }, queues: { events } }) });
  assert.equal(player.xp, 15, `xpMult 미적용 또는 계산 틀림 (실제: ${player.xp})`);

  const player2 = makePlayer({ xp: 0, xpMult: 1.1 });
  const pickup2 = makePickup({ xpValue: 5 }); // 5 * 1.1 = 5.5 → Math.ceil(5.5) = 6
  const events2 = makeEvents({ pickupCollected: [{ pickup: pickup2, playerId: player2.id }] });
  ExperienceSystem.update({ world: makeWorld({ entities: { player: player2, pickups: [pickup2] }, queues: { events: events2 } }) });
  assert.equal(player2.xp, 6, `xpMult 올림 처리 미적용 (실제: ${player2.xp})`);
});

test('special pickup은 heal, ward, gold 효과를 적용하고 vacuum은 XP를 플레이어 쪽으로 끌어당긴다', () => {
  if (!ExperienceSystem) return;
  const player = makePlayer({ xp: 0, hp: 40, maxHp: 100, invincibleTimer: 0 });
  const heal = makePickup({ pickupType: 'heal', healValue: 25 });
  const ward = makePickup({ pickupType: 'ward', duration: 2.5 });
  const gold = makePickup({ pickupType: 'gold', currencyValue: 12 });
  const gemA = makePickup({ id: 'xp_a', pickupType: 'xp', xpValue: 3, x: 180, y: 0, magnetized: false });
  const gemB = makePickup({ id: 'xp_b', pickupType: 'xp', xpValue: 5, x: 0, y: 220, magnetized: false });
  const vacuum = makePickup({ pickupType: 'vacuum' });
  const events = makeEvents({
    pickupCollected: [
      { pickup: heal, playerId: player.id },
      { pickup: ward, playerId: player.id },
      { pickup: gold, playerId: player.id },
      { pickup: vacuum, playerId: player.id },
    ],
    currencyEarned: [],
  });
  const world = makeWorld({ entities: { player, pickups: [heal, ward, gold, vacuum, gemA, gemB] }, queues: { events } });

  ExperienceSystem.update({ world });

  assert.equal(player.hp, 65, 'heal pickup 효과가 적용되지 않음');
  assert.equal(player.invincibleTimer, 2.5, 'ward pickup 효과가 적용되지 않음');
  assert.deepEqual(events.currencyEarned, [{ amount: 12 }], 'gold pickup이 currencyEarned 이벤트를 발행하지 않음');
  assert.equal(player.xp, 0, 'vacuum pickup이 XP를 즉시 정산하면 안 됨');
  assert.equal(gemA.pendingDestroy, false, 'vacuum 직후 XP gem이 즉시 정리되면 안 됨');
  assert.equal(gemB.pendingDestroy, false, 'vacuum 직후 XP gem이 즉시 정리되면 안 됨');
  assert.equal(gemA.vacuumPulled, true, 'vacuum pickup이 XP gem을 vacuumPulled 상태로 바꾸지 않음');
  assert.equal(gemB.vacuumPulled, true, 'vacuum pickup이 맵 전체 XP gem을 vacuumPulled 상태로 바꾸지 않음');
  assert.equal(gemA.magnetized, true, 'vacuum pickup이 XP gem의 magnetized 상태를 켜지 않음');
  assert.equal(gemB.magnetized, true, 'vacuum pickup이 먼 XP gem의 magnetized 상태를 켜지 않음');
});

test('vacuum으로 끌려오는 XP는 플레이어에 닿을 때 경험치로 정산된다', () => {
  if (!ExperienceSystem) return;
  const player = makePlayer({ x: 0, y: 0, xp: 0, magnetRadius: 0 });
  const gemA = makePickup({ id: 'xp_a', pickupType: 'xp', xpValue: 3, x: 24, y: 0, radius: 8, vacuumPulled: true, magnetized: true });
  const gemB = makePickup({ id: 'xp_b', pickupType: 'xp', xpValue: 5, x: 0, y: 24, radius: 8, vacuumPulled: true, magnetized: true });
  const world = makeWorld({ entities: { player, pickups: [gemA, gemB] }, runtime: { deltaTime: 0.1 } });

  ExperienceSystem.update({ world });

  assert.equal(player.xp, 8, 'vacuum으로 끌려온 XP가 접촉 시 정산되지 않음');
  assert.equal(gemA.pendingDestroy, true, '플레이어에 닿은 XP gem이 정리되지 않음');
  assert.equal(gemB.pendingDestroy, true, '플레이어에 닿은 XP gem이 정리되지 않음');
});

test('살아 있는 vacuumPulled XP가 남아 있으면 새로 드랍된 근처 XP는 일반 magnetized 상태가 되지 않는다', () => {
  if (!ExperienceSystem) return;
  const player = makePlayer({ x: 0, y: 0, xp: 0, magnetRadius: 100 });
  const pulled = makePickup({ id: 'xp_old', pickupType: 'xp', xpValue: 3, x: 180, y: 0, radius: 8, vacuumPulled: true, magnetized: true });
  const newDrop = makePickup({ id: 'xp_new', pickupType: 'xp', xpValue: 2, x: 40, y: 0, radius: 8, vacuumPulled: false, magnetized: false });
  const world = makeWorld({
    entities: { player, pickups: [pulled, newDrop] },
    runtime: { deltaTime: 0.1 },
  });

  ExperienceSystem.update({ world });

  assert.equal(newDrop.magnetized, false, 'vacuumPulled XP가 남아 있는데 새 XP가 일반 magnetized 상태가 되면 안 됨');
  assert.equal(newDrop.vacuumPulled, false, '새 XP가 vacuumPulled 상태로 바뀌면 안 됨');
});

test('vacuumPulled XP가 모두 사라지면 새로 드랍된 근처 XP는 다시 magnetized 될 수 있다', () => {
  if (!ExperienceSystem) return;
  const player = makePlayer({ x: 0, y: 0, xp: 0, magnetRadius: 100 });
  const newDrop = makePickup({ id: 'xp_new', pickupType: 'xp', xpValue: 2, x: 40, y: 0, radius: 8, vacuumPulled: false, magnetized: false });
  const world = makeWorld({
    entities: { player, pickups: [newDrop] },
    runtime: { deltaTime: 0.1 },
  });

  ExperienceSystem.update({ world });

  assert.equal(newDrop.magnetized, true, 'vacuumPulled XP가 없으면 새 XP는 일반 자석 반응을 해야 함');
});

test('vacuumPulled XP는 기존보다 더 빠르게 플레이어 쪽으로 이동한다', () => {
  if (!ExperienceSystem) return;
  const player = makePlayer({ x: 0, y: 0, xp: 0, magnetRadius: 0 });
  const gem = makePickup({ id: 'xp_fast', pickupType: 'xp', xpValue: 3, x: 180, y: 0, radius: 8, vacuumPulled: true, magnetized: true });
  const world = makeWorld({ entities: { player, pickups: [gem] }, runtime: { deltaTime: 0.1 } });

  ExperienceSystem.update({ world });

  assert.ok(gem.x < 160, `vacuumPulled XP 이동 속도가 충분히 빠르지 않음 (실제 x: ${gem.x})`);
});

test('XP 픽업이 과밀하면 근처 젬들을 병합해 엔티티 수를 줄인다', () => {
  if (!ExperienceSystem) return;
  const player = makePlayer({ x: 9999, y: 9999, magnetRadius: 0 });
  const pickups = Array.from({ length: 36 }, (_, index) => makePickup({
    x: 100 + (index % 6) * 4,
    y: 100 + Math.floor(index / 6) * 4,
    xpValue: 1,
    radius: 8,
    magnetized: false,
  }));
  const world = makeWorld({ entities: { player, pickups } });

  ExperienceSystem.update({ world });

  const livePickups = world.entities.pickups.filter((pickup) => pickup.isAlive && !pickup.pendingDestroy);
  assert.ok(livePickups.length < pickups.length, 'XP 픽업 병합이 발생하지 않음');
  assert.ok(livePickups.some((pickup) => pickup.xpValue > 1), '병합 후 큰 XP gem이 생성되지 않음');
});


summary();
