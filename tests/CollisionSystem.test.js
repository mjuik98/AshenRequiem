/**
 * tests/CollisionSystem.test.js — CollisionSystem 단위 테스트
 *
 * 리팩터링:
 *   Before: 로컬 passed/failed/test() 패턴
 *   After:  tests/helpers/testRunner.js → test(), summary()
 *
 * 실행: npm test
 */

import assert from 'node:assert/strict';
import { makePlayer, makeEnemy, makeProjectile, makeEvents } from './fixtures/index.js';
import { test, summary } from './helpers/testRunner.js';

let CollisionSystem;
try {
  ({ CollisionSystem } = await import('../src/systems/combat/CollisionSystem.js'));
} catch (e) {
  console.error('[테스트] CollisionSystem import 실패:', e.message);
  process.exit(1);
}

console.log('\n[CollisionSystem 테스트 시작]');

test('반경 내 적에게 hit 이벤트 발행', () => {
  const player     = makePlayer({ x: 0, y: 0 });
  const enemy      = makeEnemy({ x: 10, y: 0 });
  const projectile = makeProjectile({ x: 0, y: 0 });
  const events     = makeEvents();
  CollisionSystem.update({
    world: { player, enemies: [enemy], projectiles: [projectile], pickups: [], events,
             camera: { x: 0, y: 0, width: 1920, height: 1080 } },
  });
  assert(events.hits.length > 0, '히트 발생 안 함');
  assert.equal(events.hits[0].targetId, enemy.id);
});

test('반경 밖 적에게는 hit 이벤트 없음', () => {
  const player     = makePlayer({ x: 0, y: 0 });
  const enemy      = makeEnemy({ x: 10000, y: 0 });
  const projectile = makeProjectile({ x: 0, y: 0 });
  const events     = makeEvents();
  CollisionSystem.update({
    world: { player, enemies: [enemy], projectiles: [projectile], pickups: [], events,
             camera: { x: 0, y: 0, width: 100, height: 100 } },
  });
  assert.equal(events.hits.length, 0, '먼 적에게 히트 발생');
});

test('pendingDestroy 적에게는 hit 이벤트 없음', () => {
  const player     = makePlayer({ x: 0, y: 0 });
  const enemy      = makeEnemy({ x: 5, y: 0, pendingDestroy: true });
  const projectile = makeProjectile({ x: 0, y: 0 });
  const events     = makeEvents();
  CollisionSystem.update({
    world: { player, enemies: [enemy], projectiles: [projectile], pickups: [], events,
             camera: { x: 0, y: 0, width: 1920, height: 1080 } },
  });
  assert.equal(events.hits.length, 0, 'pendingDestroy 적에게 히트 발생');
});

test('pierce=1인 투사체는 첫 번째 적 이후 관통 중단', () => {
  const player = makePlayer({ x: -1000, y: -1000 }); // 저 멀리 배치
  const e1     = makeEnemy({ x: 5,  y: 0 });
  const e2     = makeEnemy({ x: 10, y: 0 });
  const proj   = makeProjectile({ x: 0, y: 0, pierce: 1 });
  const events = makeEvents();
  CollisionSystem.update({
    world: { player, enemies: [e1, e2], projectiles: [proj], pickups: [], events,
             camera: { x: 0, y: 0, width: 1920, height: 1080 } },
  });
  assert.ok(events.hits.length <= 1, `pierce=1 투사체가 ${events.hits.length}번 히트함`);
});

summary();
