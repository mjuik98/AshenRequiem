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

// ─── 투사체 vs 적 충돌 ───────────────────────────────────────────────

console.log('\n[CollisionSystem — 투사체 vs 적]');

test('반경 내 적에게 hit 이벤트 발행', () => {
  const player    = makePlayer({ x: 0, y: 0 });
  const enemy     = makeEnemy({ x: 10, y: 0 }); // 거리 10, 반경합 17 -> 충돌
  const projectile = makeProjectile({ x: 0, y: 0, radius: 5, ownerId: 'player' });
  const events    = makeEvents();

  CollisionSystem.update({
    player, enemies: [enemy], projectiles: [projectile],
    pickups: [], events,
    camera: { x: 0, y: 0, width: 1920, height: 1080 },
  });

  assert(events.hits.length > 0, 'hit 이벤트가 발행되지 않음');
  assert.equal(events.hits[0].targetId, enemy.id);
});

test('반경 밖 적에게는 hit 이벤트 없음', () => {
  const player    = makePlayer({ x: 0, y: 0 });
  const enemy     = makeEnemy({ x: 200, y: 0 }); 
  const projectile = makeProjectile({ x: 0, y: 0, radius: 5 });
  const events    = makeEvents();

  CollisionSystem.update({
    player, enemies: [enemy], projectiles: [projectile],
    pickups: [], events,
    camera: { x: 0, y: 0, width: 1920, height: 1080 },
  });

  assert.equal(events.hits.length, 0, `예상치 않은 hit 이벤트: ${events.hits.length}개`);
});

test('pendingDestroy 투사체는 충돌 무시', () => {
  if (!CollisionSystem) return;
  const player    = makePlayer({ x: 0, y: 0 });
  const enemy     = makeEnemy({ x: 0, y: 0 });
  const projectile = makeProjectile({ x: 0, y: 0, pendingDestroy: true });
  const events    = makeEvents();

  CollisionSystem.update({
    player, enemies: [enemy], projectiles: [projectile],
    pickups: [], events,
    camera: { x: 0, y: 0, width: 1920, height: 1080 },
  });

  assert.equal(events.hits.length, 0, 'pendingDestroy 투사체가 충돌 판정됨');
});

test('hitTargets에 이미 있는 적은 중복 hit 없음', () => {
  if (!CollisionSystem) return;
  const player    = makePlayer({ x: 0, y: 0 });
  const enemy     = makeEnemy({ x: 0, y: 0, id: 'e_dup' });
  const projectile = makeProjectile({
    x: 0, y: 0,
    hitTargets: new Set(['e_dup']), // 이미 히트 기록
  });
  const events = makeEvents();

  CollisionSystem.update({
    player, enemies: [enemy], projectiles: [projectile],
    pickups: [], events,
    camera: { x: 0, y: 0, width: 1920, height: 1080 },
  });

  assert.equal(events.hits.length, 0, '이미 히트한 적에게 중복 충돌 발생');
});

// ─── 픽업 vs 플레이어 ────────────────────────────────────────────────

console.log('\n[CollisionSystem — 픽업 vs 플레이어]');

test('픽업 반경 내 접근 시 pickupCollected 이벤트', () => {
  if (!CollisionSystem) return;
  const player = makePlayer({ x: 0, y: 0, radius: 14 });
  const pickup = makePickup({ x: 10, y: 0, radius: 10 }); // 거리 10, 반경합 24 → 충돌
  const events = makeEvents();

  CollisionSystem.update({
    player, enemies: [], projectiles: [], pickups: [pickup],
    events,
    camera: { x: 0, y: 0, width: 1920, height: 1080 },
  });

  assert(events.pickupCollected.length > 0, 'pickupCollected 이벤트 없음');
  assert.equal(events.pickupCollected[0].pickupId, pickup.id);
});

test('멀리 있는 픽업은 pickupCollected 없음', () => {
  if (!CollisionSystem) return;
  const player = makePlayer({ x: 0, y: 0 });
  const pickup = makePickup({ x: 500, y: 0 });
  const events = makeEvents();

  CollisionSystem.update({
    player, enemies: [], projectiles: [], pickups: [pickup],
    events,
    camera: { x: 0, y: 0, width: 1920, height: 1080 },
  });

  assert.equal(events.pickupCollected.length, 0, '멀리 있는 픽업이 수집됨');
});

// ─── 무적 상태 ───────────────────────────────────────────────────────

console.log('\n[CollisionSystem — 무적 처리]');

test('invincibleTimer > 0 시 적 접촉 hit 없음', () => {
  if (!CollisionSystem) return;
  const player = makePlayer({ x: 0, y: 0, invincibleTimer: 0.5 });
  const enemy  = makeEnemy({ x: 0, y: 0 }); // 동일 위치 → 충돌
  const events = makeEvents();

  CollisionSystem.update({
    player, enemies: [enemy], projectiles: [],
    pickups: [], events,
    camera: { x: 0, y: 0, width: 1920, height: 1080 },
  });

  const playerHits = events.hits.filter(h => h.targetId === 'player');
  assert.equal(playerHits.length, 0, '무적 중임에도 플레이어가 피격됨');
});

// ─── 결과 ────────────────────────────────────────────────────────────

console.log(`\n결과: ${passed}개 통과, ${failed}개 실패`);
if (failed > 0) process.exit(1);
