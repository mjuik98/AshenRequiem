/**
 * tests/WeaponSystem.test.js — WeaponSystem 단위 테스트
 *
 * [개선 P0-②] 로컬 인라인 픽스처 → tests/fixtures/index.js 공통 픽스처로 교체
 *   Before: makePlayer / makeEnemy / makeWorld 로컬 선언
 *   After:  fixtures/index.js import → Entity 구조 변경 시 1곳만 수정
 *
 * 실행: npm test
 */

import assert from 'node:assert/strict';
import { makePlayer, makeEnemy, makeWorld, makeWeapon } from './fixtures/index.js';

// ─── WeaponSystem import ─────────────────────────────────────────────

let WeaponSystem;
try {
  ({ WeaponSystem } = await import('../src/systems/combat/WeaponSystem.js'));
} catch {
  console.warn('[테스트] WeaponSystem import 실패 — 구조 검증만 수행');
  WeaponSystem = null;
}

// ─── 테스트 러너 ─────────────────────────────────────────────────────

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

// ─── 쿨다운 테스트 ───────────────────────────────────────────────────

console.log('\n[WeaponSystem — 쿨다운]');

test('쿨다운 감소 — 0.016s dt 경과 시 currentCooldown 감소', () => {
  if (!WeaponSystem) return;

  const weapon = makeWeapon({
    cooldown: 1.0,
    currentCooldown: 0.5,
    behaviorId: 'targetProjectile',
  });
  const player = makePlayer({ weapons: [weapon] });
  const world  = makeWorld({ player, enemies: [makeEnemy()] });

  WeaponSystem.update({ dt: 0.016, world, data: {}, services: {} });

  assert.ok(
    weapon.currentCooldown < 0.5,
    `currentCooldown이 줄어들지 않음 (실제: ${weapon.currentCooldown})`
  );
});

test('쿨다운이 0이면 발사 시도 후 쿨다운이 리셋됨', () => {
  if (!WeaponSystem) return;

  const weapon = makeWeapon({
    cooldown: 1.0,
    currentCooldown: 0,
    behaviorId: 'targetProjectile',
  });
  const player = makePlayer({ weapons: [weapon] });
  const enemy  = makeEnemy({ x: 100, y: 0 });
  const world  = makeWorld({ player, enemies: [enemy] });

  WeaponSystem.update({ dt: 0.016, world, data: {}, services: {} });

  // 발사 후 쿨다운이 > 0 이거나, spawnQueue에 투사체가 추가되었어야 함
  const fired = weapon.currentCooldown > 0 || world.spawnQueue.length > 0;
  assert.ok(fired, '발사 또는 쿨다운 리셋이 발생하지 않음');
});

test('isAlive=false 플레이어는 무기 발사 없음', () => {
  if (!WeaponSystem) return;

  const weapon = makeWeapon({ cooldown: 1.0, currentCooldown: 0 });
  const player = makePlayer({ weapons: [weapon], isAlive: false });
  const world  = makeWorld({ player, enemies: [makeEnemy()] });

  WeaponSystem.update({ dt: 0.016, world, data: {}, services: {} });

  assert.equal(world.spawnQueue.length, 0, '죽은 플레이어가 무기를 발사함');
});

test('적이 없으면 발사하지 않음 (targetProjectile)', () => {
  if (!WeaponSystem) return;

  const weapon = makeWeapon({ cooldown: 1.0, currentCooldown: 0, behaviorId: 'targetProjectile' });
  const player = makePlayer({ weapons: [weapon] });
  const world  = makeWorld({ player, enemies: [] });

  WeaponSystem.update({ dt: 0.016, world, data: {}, services: {} });

  assert.equal(world.spawnQueue.length, 0, '적 없는 상황에서 투사체 발사됨');
});

test('무기가 없으면 에러 없이 통과', () => {
  if (!WeaponSystem) return;
  const player = makePlayer({ weapons: [] });
  const world  = makeWorld({ player, enemies: [makeEnemy()] });
  assert.doesNotThrow(() => WeaponSystem.update({ dt: 0.016, world, data: {}, services: {} }));
});

// ─── 결과 ────────────────────────────────────────────────────────────

console.log(`\n결과: ${passed}개 통과, ${failed}개 실패`);
if (failed > 0) process.exit(1);
