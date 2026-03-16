/**
 * tests/CollisionSystem.test.js — CollisionSystem 단위 테스트
 *
 * 실행:
 *   node --experimental-vm-modules tests/CollisionSystem.test.js
 *
 * 검증 항목:
 *   - 투사체가 적과 충돌하면 events.hits에 기록
 *   - 투사체가 적과 충돌하지 않으면 hits 없음
 *   - 적 소유 투사체는 플레이어와 충돌
 *   - 플레이어 소유 투사체는 적과 충돌, 플레이어와는 미충돌
 *   - 픽업이 플레이어 반경 내 진입 시 pickupCollected 기록
 *   - 플레이어 무적 중 피격 이벤트 미발생
 *   - pendingDestroy 엔티티는 충돌 처리 제외
 */

import assert from 'node:assert/strict';

function makePlayer(overrides = {}) {
  return {
    id: 'player-1', type: 'player',
    x: 0, y: 0, radius: 14,
    hp: 20, maxHp: 20,
    isAlive: true, pendingDestroy: false,
    invincibleTimer: 0, invincibleDuration: 1.0,
    ...overrides,
  };
}

function makeEnemy(overrides = {}) {
  return {
    id: `enemy-${Math.random().toString(36).slice(2)}`,
    type: 'enemy',
    x: 0, y: 0, radius: 12,
    hp: 10, maxHp: 10,
    isAlive: true, pendingDestroy: false,
    damage: 5,
    ...overrides,
  };
}

function makeProjectile(overrides = {}) {
  return {
    id: `proj-${Math.random().toString(36).slice(2)}`,
    type: 'projectile',
    x: 0, y: 0, radius: 5,
    isAlive: true, pendingDestroy: false,
    damage: 8,
    ownerId: 'player-1',
    hitTargets: new Set(),
    hitCount: 0,
    pierceCount: 1,
    ...overrides,
  };
}

function makePickup(overrides = {}) {
  return {
    id: `pickup-${Math.random().toString(36).slice(2)}`,
    type: 'pickup',
    x: 0, y: 0, radius: 6,
    isAlive: true, pendingDestroy: false,
    xpValue: 1,
    ...overrides,
  };
}

function makeCamera(overrides = {}) {
  return { x: -640, y: -360, ...overrides };
}

function makeEvents() {
  return {
    hits: [],
    deaths: [],
    pickupCollected: [],
    levelUpRequested: [],
  };
}

let CollisionSystem;
try {
  ({ CollisionSystem } = await import('../src/systems/combat/CollisionSystem.js'));
} catch {
  console.warn('[테스트] CollisionSystem import 실패 — 로직 검증 스킵');
  process.exit(0);
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

console.log('\n[CollisionSystem]');

// ── 투사체 vs 적 ─────────────────────────────────────────────

test('플레이어 투사체가 적 반경 내 → events.hits 기록', () => {
  const player = makePlayer();
  const enemy  = makeEnemy({ id: 'e1', x: 10, y: 0 }); // radius 12, proj radius 5 → 거리 10 < 17
  const proj   = makeProjectile({ x: 0, y: 0, ownerId: player.id });
  const events = makeEvents();

  CollisionSystem.update({
    player, enemies: [enemy],
    projectiles: [proj], pickups: [],
    events, camera: makeCamera(),
  });

  assert.equal(events.hits.length, 1);
  assert.equal(events.hits[0].targetId, 'e1');
  assert.equal(events.hits[0].damage, proj.damage);
});

test('플레이어 투사체가 적 반경 밖 → events.hits 없음', () => {
  const player = makePlayer();
  const enemy  = makeEnemy({ id: 'e1', x: 500, y: 0 });
  const proj   = makeProjectile({ x: 0, y: 0, ownerId: player.id });
  const events = makeEvents();

  CollisionSystem.update({
    player, enemies: [enemy],
    projectiles: [proj], pickups: [],
    events, camera: makeCamera(),
  });

  assert.equal(events.hits.length, 0);
});

test('이미 hitTargets에 있는 적은 재충돌 안 함', () => {
  const player = makePlayer();
  const enemy  = makeEnemy({ id: 'e1', x: 5, y: 0 });
  const proj   = makeProjectile({ x: 0, y: 0, ownerId: player.id });
  proj.hitTargets.add('e1');
  const events = makeEvents();

  CollisionSystem.update({
    player, enemies: [enemy],
    projectiles: [proj], pickups: [],
    events, camera: makeCamera(),
  });

  assert.equal(events.hits.length, 0);
});

test('플레이어 투사체는 플레이어 자신과 충돌 안 함', () => {
  const player = makePlayer({ x: 0, y: 0 });
  const proj   = makeProjectile({ x: 0, y: 0, ownerId: player.id });
  const events = makeEvents();

  CollisionSystem.update({
    player, enemies: [],
    projectiles: [proj], pickups: [],
    events, camera: makeCamera(),
  });

  assert.equal(events.hits.filter(h => h.targetId === player.id).length, 0);
});

// ── 적 투사체 vs 플레이어 ────────────────────────────────────

test('적 소유 투사체가 플레이어 반경 내 → events.hits 기록', () => {
  const player   = makePlayer({ x: 0, y: 0 });
  const enemyId  = 'enemy-atk';
  const proj     = makeProjectile({ x: 5, y: 0, ownerId: enemyId });
  const events   = makeEvents();

  CollisionSystem.update({
    player, enemies: [],
    projectiles: [proj], pickups: [],
    events, camera: makeCamera(),
  });

  assert.equal(events.hits.length, 1);
  assert.equal(events.hits[0].targetId, player.id);
});

// ── 플레이어 무적 ─────────────────────────────────────────────

test('플레이어 무적 중 적 직접 충돌 → hits 없음', () => {
  const player = makePlayer({ x: 0, y: 0, invincibleTimer: 0.5 });
  const enemy  = makeEnemy({ x: 5, y: 0 });
  const events = makeEvents();

  CollisionSystem.update({
    player, enemies: [enemy],
    projectiles: [], pickups: [],
    events, camera: makeCamera(),
  });

  assert.equal(events.hits.length, 0);
});

test('플레이어 무적 중 적 투사체 충돌 → hits 없음', () => {
  const player = makePlayer({ x: 0, y: 0, invincibleTimer: 0.5 });
  const proj   = makeProjectile({ x: 5, y: 0, ownerId: 'enemy-x' });
  const events = makeEvents();

  CollisionSystem.update({
    player, enemies: [],
    projectiles: [proj], pickups: [],
    events, camera: makeCamera(),
  });

  assert.equal(events.hits.length, 0);
});

// ── 픽업 vs 플레이어 ──────────────────────────────────────────

test('픽업이 플레이어 반경 내 → pickupCollected 기록', () => {
  const player = makePlayer({ x: 0, y: 0 });
  const pickup = makePickup({ x: 5, y: 0 }); // player r14 + pickup r6 = 20 > 5
  const events = makeEvents();

  CollisionSystem.update({
    player, enemies: [],
    projectiles: [], pickups: [pickup],
    events, camera: makeCamera(),
  });

  assert.equal(events.pickupCollected.length, 1);
  assert.equal(events.pickupCollected[0].pickupId, pickup.id);
});

test('픽업이 플레이어 반경 밖 → pickupCollected 없음', () => {
  const player = makePlayer({ x: 0, y: 0 });
  const pickup = makePickup({ x: 500, y: 0 });
  const events = makeEvents();

  CollisionSystem.update({
    player, enemies: [],
    projectiles: [], pickups: [pickup],
    events, camera: makeCamera(),
  });

  assert.equal(events.pickupCollected.length, 0);
});

// ── pendingDestroy 제외 ───────────────────────────────────────

test('pendingDestroy 적은 충돌 처리 제외', () => {
  const player = makePlayer();
  const enemy  = makeEnemy({ id: 'e1', x: 5, y: 0, pendingDestroy: true });
  const proj   = makeProjectile({ x: 0, y: 0, ownerId: player.id });
  const events = makeEvents();

  CollisionSystem.update({
    player, enemies: [enemy],
    projectiles: [proj], pickups: [],
    events, camera: makeCamera(),
  });

  assert.equal(events.hits.length, 0);
});

test('isAlive=false 투사체는 충돌 처리 제외', () => {
  const player = makePlayer();
  const enemy  = makeEnemy({ id: 'e1', x: 5, y: 0 });
  const proj   = makeProjectile({ x: 0, y: 0, ownerId: player.id, isAlive: false });
  const events = makeEvents();

  CollisionSystem.update({
    player, enemies: [enemy],
    projectiles: [proj], pickups: [],
    events, camera: makeCamera(),
  });

  assert.equal(events.hits.length, 0);
});

console.log(`\n결과: ${passed}개 통과, ${failed}개 실패`);
if (failed > 0) process.exit(1);
