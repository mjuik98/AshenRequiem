/**
 * tests/CollisionSystem.test.js — CollisionSystem 단위 테스트
 *
 * 실행:
 *   node --experimental-vm-modules tests/CollisionSystem.test.js
 */

import assert from 'node:assert/strict';

// ─── 헬퍼 ───────────────────────────────────────────────────────────

function makePlayer(overrides = {}) {
  return {
    id: 'player', type: 'player',
    x: 0, y: 0, radius: 14,
    hp: 20, maxHp: 20,
    isAlive: true, pendingDestroy: false,
    invincibleTimer: 0, invincibleDuration: 1.0,
    ...overrides,
  };
}

function makeEnemy(overrides = {}) {
  return {
    id: `e_${Math.random().toString(36).slice(2)}`,
    type: 'enemy',
    x: 0, y: 0, radius: 12,
    hp: 10, maxHp: 10,
    isAlive: true, pendingDestroy: false,
    damage: 2,
    ...overrides,
  };
}

function makeProjectile(overrides = {}) {
  return {
    id: `p_${Math.random().toString(36).slice(2)}`,
    type: 'projectile',
    x: 0, y: 0, radius: 5,
    damage: 3,
    ownerId: 'player',
    isAlive: true, pendingDestroy: false,
    hitTargets: new Set(),
    hitCount: 0,
    pierce: 1,
    ...overrides,
  };
}

function makePickup(overrides = {}) {
  return {
    id: `pk_${Math.random().toString(36).slice(2)}`,
    type: 'pickup',
    x: 0, y: 0, radius: 10,
    xpValue: 5,
    isAlive: true, pendingDestroy: false,
    ...overrides,
  };
}

function makeEvents() {
  return {
    hits: [],
    pickupCollected: [],
  };
}

// ─── CollisionSystem import ──────────────────────────────────────────

let CollisionSystem;
try {
  ({ CollisionSystem } = await import('../src/systems/combat/CollisionSystem.js'));
} catch (e) {
  console.error('[테스트] CollisionSystem import 실패:', e.message);
  process.exit(1);
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
    console.error(`    [ERROR] ${e.message}`);
    failed++;
  }
}

// ─── 테스트 케이스 ───────────────────────────────────────────────────

console.log('\n[CollisionSystem 테스트 시작]');

test('반경 내 적에게 hit 이벤트 발행', () => {
  const player = makePlayer({ x: 0, y: 0 });
  const enemy = makeEnemy({ x: 10, y: 0 }); // 충돌
  const projectile = makeProjectile({ x: 0, y: 0 });
  const events = makeEvents();
  const camera = { x: 0, y: 0, width: 1920, height: 1080 };

  CollisionSystem.update({
    player, enemies: [enemy], projectiles: [projectile],
    pickups: [], events, camera
  });

  assert(events.hits.length > 0, '히트 발생 안 함');
  assert.equal(events.hits[0].targetId, enemy.id);
});

test('반경 밖 적에게는 hit 이벤트 없음', () => {
  const player = makePlayer({ x: 0, y: 0 });
  const enemy = makeEnemy({ x: 10000, y: 0 }); // 정말 먼 거리
  const projectile = makeProjectile({ x: 0, y: 0 });
  const events = makeEvents();
  const camera = { x: 0, y: 0, width: 100, height: 100 }; // 좁은 카메라

  CollisionSystem.update({
    player, enemies: [enemy], projectiles: [projectile],
    pickups: [], events, camera
  });

  assert.equal(events.hits.length, 0, '먼 거리 적이 히트됨');
});

test('무적 상태에서는 플레이어 피격 안 됨', () => {
  const player = makePlayer({ x: 0, y: 0, invincibleTimer: 0.5 });
  const enemy = makeEnemy({ x: 0, y: 0 });
  const events = makeEvents();
  const camera = { x: 0, y: 0, width: 1920, height: 1080 };

  CollisionSystem.update({
    player, enemies: [enemy], projectiles: [],
    pickups: [], events, camera
  });

  const playerHits = events.hits.filter(h => h.targetId === 'player');
  assert.equal(playerHits.length, 0, '무적 중 피격됨');
});

test('픽업 반경 내 수집 가능', () => {
  const player = makePlayer({ x: 0, y: 0, radius: 14 });
  const pickup = makePickup({ x: 10, y: 0, radius: 10 });
  const events = makeEvents();
  const camera = { x: 0, y: 0, width: 1920, height: 1080 };

  CollisionSystem.update({
    player, enemies: [], projectiles: [],
    pickups: [pickup], events, camera
  });

  assert(events.pickupCollected.length > 0, '픽업 수집 안 함');
});

test('멀리 있는 픽업은 수집 안 됨', () => {
  const player = makePlayer({ x: 0, y: 0 });
  const pickup = makePickup({ x: 5000, y: 0 });
  const events = makeEvents();
  const camera = { x: 0, y: 0, width: 1920, height: 1080 };

  CollisionSystem.update({
    player, enemies: [], projectiles: [],
    pickups: [pickup], events, camera
  });

  assert.equal(events.pickupCollected.length, 0, '먼 거리 픽업 수집됨');
});

console.log(`\n최종 결과: ${passed}개 통과, ${failed}개 실패`);
if (failed > 0) process.exit(1);
