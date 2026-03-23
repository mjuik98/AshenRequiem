/**
 * tests/CollisionSystem.test.js — CollisionSystem 단위 테스트
 *
 * REFACTOR (R-05): createCollisionSystem() factory 패턴 대응
 *   Before: import { CollisionSystem } (singleton)
 *   After:  import { createCollisionSystem } (factory)
 *           각 테스트에서 새 인스턴스 생성 → 테스트 격리 보장
 */

import assert from 'node:assert/strict';
import { makePlayer, makeEnemy, makeProjectile, makeEvents } from './fixtures/index.js';
import { test, summary } from './helpers/testRunner.js';

let createCollisionSystem;
try {
  ({ createCollisionSystem } = await import('../src/systems/combat/CollisionSystem.js'));
} catch (e) {
  console.error('[테스트] CollisionSystem import 실패:', e.message);
  process.exit(1);
}

console.log('\n[CollisionSystem 테스트 시작]');

test('반경 내 적에게 hit 이벤트 발행', () => {
  const sys        = createCollisionSystem();
  const player     = makePlayer({ x: 0, y: 0 });
  const enemy      = makeEnemy({ x: 10, y: 0 });
  const projectile = makeProjectile({ x: 0, y: 0 });
  const events     = makeEvents();
  sys.update({
    world: { player, enemies: [enemy], projectiles: [projectile], pickups: [], events,
             camera: { x: 0, y: 0, width: 1920, height: 1080 } },
  });
  assert(events.hits.length > 0, '히트 발생 안 함');
  assert.equal(events.hits[0].targetId, enemy.id);
});

test('반경 밖 적에게는 hit 이벤트 없음', () => {
  const sys        = createCollisionSystem();
  const player     = makePlayer({ x: 0, y: 0 });
  const enemy      = makeEnemy({ x: 10000, y: 0 });
  const projectile = makeProjectile({ x: 0, y: 0 });
  const events     = makeEvents();
  sys.update({
    world: { player, enemies: [enemy], projectiles: [projectile], pickups: [], events,
             camera: { x: 0, y: 0, width: 100, height: 100 } },
  });
  assert.equal(events.hits.length, 0, '먼 적에게 히트 발생');
});

test('pendingDestroy 적에게는 hit 이벤트 없음', () => {
  const sys        = createCollisionSystem();
  const player     = makePlayer({ x: 0, y: 0 });
  const enemy      = makeEnemy({ x: 5, y: 0, pendingDestroy: true });
  const projectile = makeProjectile({ x: 0, y: 0 });
  const events     = makeEvents();
  sys.update({
    world: { player, enemies: [enemy], projectiles: [projectile], pickups: [], events,
             camera: { x: 0, y: 0, width: 1920, height: 1080 } },
  });
  assert.equal(events.hits.length, 0, 'pendingDestroy 적에게 히트 발생');
});

test('pierce=1인 투사체는 첫 번째 적 이후 관통 중단', () => {
  const sys    = createCollisionSystem();
  const player = makePlayer({ x: -1000, y: -1000 });
  const e1     = makeEnemy({ x: 5,  y: 0 });
  const e2     = makeEnemy({ x: 10, y: 0 });
  const proj   = makeProjectile({ x: 0, y: 0, pierce: 1 });
  const events = makeEvents();
  sys.update({
    world: { player, enemies: [e1, e2], projectiles: [proj], pickups: [], events,
             camera: { x: 0, y: 0, width: 1920, height: 1080 } },
  });
  assert.ok(events.hits.length <= 1, `pierce=1 투사체가 ${events.hits.length}번 히트함`);
});

test('CollisionSystem은 히트 이벤트만 예약하고 projectile 상태는 직접 소비하지 않는다', () => {
  const sys    = createCollisionSystem();
  const player = makePlayer({ x: 0, y: 0 });
  const enemy  = makeEnemy({ x: 5, y: 0 });
  const proj   = makeProjectile({ x: 0, y: 0, pierce: 1 });
  const events = makeEvents();

  sys.update({
    world: { player, enemies: [enemy], projectiles: [proj], pickups: [], events,
             camera: { x: 0, y: 0, width: 1920, height: 1080 } },
  });

  assert.equal(events.hits.length, 1, '히트 이벤트가 예약되지 않음');
  assert.equal(proj.hitCount, 0, 'CollisionSystem이 projectile.hitCount를 직접 증가시킴');
  assert.equal(proj.hitTargets.size, 0, 'CollisionSystem이 projectile.hitTargets를 직접 수정함');
});

test('각 테스트에서 독립 인스턴스 — 그리드 상태 격리', () => {
  const sysA = createCollisionSystem();
  const sysB = createCollisionSystem();
  assert.notStrictEqual(sysA, sysB, 'factory가 동일 인스턴스 반환');
});

summary();
