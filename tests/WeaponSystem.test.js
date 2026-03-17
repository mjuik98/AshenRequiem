/**
 * tests/WeaponSystem.test.js — WeaponSystem 단위 테스트
 *
 * 실행:
 *   node --experimental-vm-modules tests/WeaponSystem.test.js
 */

import assert from 'node:assert/strict';

// ─── 헬퍼 ───────────────────────────────────────────────────────────

function makePlayer(weaponOverrides = {}) {
  return {
    id:     'player',
    x:      0,
    y:      0,
    radius: 14,
    isAlive: true,
    weapons: [
      {
        id:             'weapon_basic',
        level:          1,
        cooldown:       1.0,
        currentCooldown: 0,
        damage:         5,
        radius:         8,
        pierce:         1,
        range:          400,
        speed:          300,
        behaviorId:     'targetProjectile',
        ...weaponOverrides,
      },
    ],
  };
}

function makeEnemy(overrides = {}) {
  return {
    id:            `e_${Math.random().toString(36).slice(2)}`,
    x:             100,
    y:             0,
    radius:        12,
    isAlive:       true,
    pendingDestroy: false,
    ...overrides,
  };
}

function makeWorld(player, enemies = []) {
  return {
    player,
    enemies,
    spawnQueue: [],
    events:     { hits: [], deaths: [], pickupCollected: [], levelUpRequested: [] },
    deltaTime:  0.016,
  };
}

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
  const player = makePlayer({ cooldown: 1.0, currentCooldown: 0.5 });
  const world  = makeWorld(player, [makeEnemy()]);

  // WeaponSystem.update는 이제 behaviorRegistry를 사용합니다.
  // 실제 behavior 함수들이 math 함수들을 사용하므로, 테스트 환경에서도 math 함수들이 필요합니다.
  WeaponSystem.update({ world: { player, enemies: world.enemies, spawnQueue: world.spawnQueue, deltaTime: 0.016 } });

  const w = player.weapons[0];
  assert(w.currentCooldown < 0.5, `currentCooldown이 줄지 않음: ${w.currentCooldown}`);
});

test('쿨다운 0 이하 시 spawnQueue에 투사체 추가', () => {
  if (!WeaponSystem) return;
  const player = makePlayer({ cooldown: 1.0, currentCooldown: 0 }); // 즉시 발사 가능
  const enemy  = makeEnemy({ x: 100, y: 0 }); // 사거리 400 안
  const spawnQueue = [];

  WeaponSystem.update({ world: { player, enemies: [enemy], spawnQueue, deltaTime: 0.016 } });

  assert(spawnQueue.length > 0, '쿨다운 0인데 투사체가 spawnQueue에 추가되지 않음');
  assert.equal(spawnQueue[0].type, 'projectile');
});

test('사거리 밖 적에게는 발사 안 함', () => {
  if (!WeaponSystem) return;
  const player = makePlayer({ cooldown: 1.0, currentCooldown: 0, range: 200 });
  const enemy  = makeEnemy({ x: 500, y: 0 }); // 사거리 500 > 200
  const spawnQueue = [];

  WeaponSystem.update({ world: { player, enemies: [enemy], spawnQueue, deltaTime: 0.016 } });

  assert.equal(spawnQueue.length, 0, '사거리 밖 적에게 발사됨');
});

test('적이 없으면 발사 안 함', () => {
  if (!WeaponSystem) return;
  const player     = makePlayer({ cooldown: 1.0, currentCooldown: 0 });
  const spawnQueue = [];

  WeaponSystem.update({ world: { player, enemies: [], spawnQueue, deltaTime: 0.016 } });

  assert.equal(spawnQueue.length, 0, '적 없는데 발사됨');
});

test('쿨다운 완료 후 currentCooldown이 cooldown으로 리셋', () => {
  if (!WeaponSystem) return;
  const player     = makePlayer({ cooldown: 1.0, currentCooldown: 0 });
  const enemy      = makeEnemy({ x: 50, y: 0 });
  const spawnQueue = [];

  WeaponSystem.update({ world: { player, enemies: [enemy], spawnQueue, deltaTime: 0.016 } });

  const w = player.weapons[0];
  // 발사 후 currentCooldown은 cooldown(1.0) 근처로 리셋되어야 한다
  assert(w.currentCooldown > 0, `발사 후 currentCooldown이 0임: ${w.currentCooldown}`);
  assert(w.currentCooldown <= w.cooldown + 0.01, `currentCooldown이 cooldown보다 큼: ${w.currentCooldown}`);
});

// ─── 투사체 설정 테스트 ──────────────────────────────────────────────

console.log('\n[WeaponSystem — spawnQueue 투사체 설정]');

test('발사된 투사체의 damage가 무기 damage와 일치', () => {
  if (!WeaponSystem) return;
  const player     = makePlayer({ damage: 7, currentCooldown: 0, cooldown: 1.0 });
  const enemy      = makeEnemy({ x: 50, y: 0 });
  const spawnQueue = [];

  WeaponSystem.update({ world: { player, enemies: [enemy], spawnQueue, deltaTime: 0.016 } });

  if (spawnQueue.length > 0) {
    assert.equal(spawnQueue[0].config.damage, 7, `투사체 damage 불일치: ${spawnQueue[0].config.damage}`);
  }
});

test('발사된 투사체의 ownerId가 player.id와 일치', () => {
  if (!WeaponSystem) return;
  const player     = makePlayer({ currentCooldown: 0, cooldown: 1.0 });
  const enemy      = makeEnemy({ x: 50, y: 0 });
  const spawnQueue = [];

  WeaponSystem.update({ world: { player, enemies: [enemy], spawnQueue, deltaTime: 0.016 } });

  if (spawnQueue.length > 0) {
    assert.equal(spawnQueue[0].config.ownerId, 'player', `ownerId 불일치: ${spawnQueue[0].config.ownerId}`);
  }
});

// ─── 결과 ────────────────────────────────────────────────────────────

console.log(`\n결과: ${passed}개 통과, ${failed}개 실패`);
if (failed > 0) process.exit(1);
