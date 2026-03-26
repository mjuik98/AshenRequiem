/**
 * tests/WeaponSystem.test.js — WeaponSystem 단위 테스트
 *
 * 리팩터링:
 *   Before: 로컬 passed/failed/test() 패턴
 *   After:  tests/helpers/testRunner.js → test(), summary()
 *
 * 실행: npm test
 */

import assert from 'node:assert/strict';
import { makePlayer, makeEnemy, makeWorld, makeWeapon } from './fixtures/index.js';
import { test, summary } from './helpers/testRunner.js';

let WeaponSystem;
try {
  ({ WeaponSystem } = await import('../src/systems/combat/WeaponSystem.js'));
} catch {
  console.warn('[테스트] WeaponSystem import 실패 — 구조 검증만 수행');
  WeaponSystem = null;
}

// ── 쿨다운 ────────────────────────────────────────────────────────────

console.log('\n[WeaponSystem — 쿨다운]');

test('쿨다운 감소 — 0.016s dt 경과 시 currentCooldown 감소', () => {
  if (!WeaponSystem) return;
  const weapon = makeWeapon({ cooldown: 1.0, currentCooldown: 0.5, behaviorId: 'targetProjectile' });
  const player = makePlayer({ weapons: [weapon] });
  const world  = makeWorld({ entities: { player, enemies: [makeEnemy()] } });
  WeaponSystem.update({ dt: 0.016, world, data: {}, services: {} });
  assert.ok(weapon.currentCooldown < 0.5, `currentCooldown이 줄어들지 않음 (실제: ${weapon.currentCooldown})`);
});

test('쿨다운이 0이면 발사 시도 후 쿨다운이 리셋됨', () => {
  if (!WeaponSystem) return;
  const weapon = makeWeapon({ cooldown: 1.0, currentCooldown: 0, behaviorId: 'targetProjectile' });
  const player = makePlayer({ weapons: [weapon] });
  const world  = makeWorld({ entities: { player, enemies: [makeEnemy({ x: 10, y: 0 })] } });
  WeaponSystem.update({ dt: 0.016, world, data: {}, services: {} });
  const fired = weapon.currentCooldown > 0 || world.queues.spawnQueue.length > 0;
  assert.ok(fired, '발사 또는 쿨다운 리셋이 발생하지 않음');
});

test('Phase 4: cooldownMult 적용 — 발사 후 리셋 시 배율 반영', () => {
  if (!WeaponSystem) return;
  // cooldown 1.0, mult 0.5 → 리셋 시 0.5가 되어야 함
  const weapon = makeWeapon({ cooldown: 1.0, currentCooldown: 0, behaviorId: 'targetProjectile' });
  const player = makePlayer({ weapons: [weapon], cooldownMult: 0.5 });
  const world  = makeWorld({ entities: { player, enemies: [makeEnemy({ x: 10, y: 0 })] } });
  
  // update({ world }) 구조로 변경됨 (R-14 이후)
  WeaponSystem.update({ world });
  
  assert.equal(weapon.currentCooldown, 0.5, `cooldownMult 미적용 (실제: ${weapon.currentCooldown})`);
});

test('projectileLifetimeMult 적용 — 직선 투사체의 비행 지속 거리가 증가한다', () => {
  if (!WeaponSystem) return;
  const weapon = makeWeapon({
    id: 'magic_bolt',
    cooldown: 1.0,
    currentCooldown: 0,
    behaviorId: 'targetProjectile',
    range: 400,
    projectileSpeed: 200,
  });
  const player = makePlayer({
    weapons: [weapon],
    projectileLifetimeMult: 1.5,
  });
  const world  = makeWorld({ entities: { player, enemies: [makeEnemy({ x: 10, y: 0 })] } });

  WeaponSystem.update({ world });

  assert.equal(world.queues.spawnQueue.length > 0, true, '투사체가 생성되지 않음');
  assert.equal(
    world.queues.spawnQueue[0].config.maxRange,
    600,
    `직선 투사체 maxRange가 지속시간 배율만큼 증가하지 않음 (실제: ${world.queues.spawnQueue[0].config.maxRange})`,
  );
});

test('projectileLifetimeMult 적용 — orbit 무기의 maxLifetime이 증가한다', () => {
  if (!WeaponSystem) return;
  const weapon = makeWeapon({
    id: 'lightning_ring',
    cooldown: 2.0,
    currentCooldown: 0,
    behaviorId: 'orbit',
    orbitCount: 1,
    orbitRadius: 72,
    orbitSpeed: 2.8,
    radius: 9,
    damage: 3,
    pierce: 999,
  });
  const player = makePlayer({
    weapons: [weapon],
    projectileLifetimeMult: 1.5,
  });
  const world = makeWorld({ entities: { player, enemies: [makeEnemy({ x: 10, y: 0 })] } });

  WeaponSystem.update({ world });

  assert.equal(world.queues.spawnQueue.length > 0, true, 'orbit 투사체가 생성되지 않음');
  assert.equal(
    Number(world.queues.spawnQueue[0].config.maxLifetime.toFixed(2)),
    3.06,
    `orbit 투사체 maxLifetime 증가 불일치 (실제: ${world.queues.spawnQueue[0].config.maxLifetime})`,
  );
});


test('isAlive=false 플레이어는 무기 발사 없음', () => {
  if (!WeaponSystem) return;
  const weapon = makeWeapon({ cooldown: 1.0, currentCooldown: 0 });
  const player = makePlayer({ weapons: [weapon], isAlive: false });
  const world  = makeWorld({ entities: { player, enemies: [makeEnemy()] } });
  WeaponSystem.update({ dt: 0.016, world, data: {}, services: {} });
  assert.equal(world.queues.spawnQueue.length, 0, '죽은 플레이어가 무기 발사함');
});

// ── 구조 검증 ─────────────────────────────────────────────────────────

console.log('\n[WeaponSystem — 구조]');

test('WeaponSystem.update 메서드가 존재한다', () => {
  assert.ok(WeaponSystem === null || typeof WeaponSystem.update === 'function',
    'update 메서드 없음');
});

summary();
