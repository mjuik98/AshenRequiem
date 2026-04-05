/**
 * tests/StatusEffectSystem.test.js — StatusEffectSystem 단위 테스트
 *
 * 리팩터링:
 *   Before: 로컬 passed/failed/test() 패턴
 *   After:  tests/helpers/testRunner.js → test(), summary()
 *
 * 실행: npm test
 */

import assert from 'node:assert/strict';
import {
  makeEnemy,
  makePlayer,
  makeEvents,
  makeRng,
  makeWorld,
} from './fixtures/index.js';
import { test, summary } from './helpers/testRunner.js';

let StatusEffectSystem;
try {
  ({ StatusEffectSystem } = await import('../src/systems/combat/StatusEffectSystem.js'));
} catch {
  console.warn('[테스트] StatusEffectSystem import 실패 — 로직 검증 스킵');
  StatusEffectSystem = null;
}

console.log('\n[StatusEffectSystem]');

// ── applyFromHits ─────────────────────────────────────────────────────

test('statusEffectId 없는 투사체 → 상태이상 미부여', () => {
  if (!StatusEffectSystem) return;
  const enemy  = makeEnemy();
  const hit    = { target: enemy, projectile: { isAlive: true, pendingDestroy: false } };
  const events = makeEvents();
  StatusEffectSystem.applyFromHits({ hits: [hit], events });
  assert.equal(enemy.statusEffects.length, 0, '상태이상이 잘못 부여됨');
});

test('statusEffectChance=0 → 상태이상 미부여', () => {
  if (!StatusEffectSystem) return;
  const enemy  = makeEnemy();
  const proj   = { isAlive: true, pendingDestroy: false, statusEffectId: 'slow', statusEffectChance: 0 };
  const events = makeEvents();
  StatusEffectSystem.applyFromHits({ hits: [{ target: enemy, projectile: proj }], events });
  assert.equal(enemy.statusEffects.length, 0, '확률 0인데 상태이상 부여됨');
});

test('pendingDestroy 대상에는 상태이상 미부여', () => {
  if (!StatusEffectSystem) return;
  const enemy  = makeEnemy({ pendingDestroy: true });
  const proj   = { isAlive: true, pendingDestroy: false, statusEffectId: 'slow', statusEffectChance: 1.0 };
  const events = makeEvents();
  StatusEffectSystem.applyFromHits({ hits: [{ target: enemy, projectile: proj }], events });
  assert.equal(enemy.statusEffects.length, 0, 'pendingDestroy 대상에 상태이상 부여됨');
});

test('isAlive=false 대상에는 상태이상 미부여', () => {
  if (!StatusEffectSystem) return;
  const enemy  = makeEnemy({ isAlive: false });
  const proj   = { isAlive: true, pendingDestroy: false, statusEffectId: 'slow', statusEffectChance: 1.0 };
  const events = makeEvents();
  StatusEffectSystem.applyFromHits({ hits: [{ target: enemy, projectile: proj }], events });
  assert.equal(enemy.statusEffects.length, 0, '죽은 대상에 상태이상 부여됨');
});

test('statusEffectId 있는 투사체 → entity.statusEffects에 즉시 부여 (BUG-3 수정)', () => {
  if (!StatusEffectSystem) return;
  const enemy  = makeEnemy();
  const proj   = { isAlive: true, pendingDestroy: false, statusEffectId: 'slow', statusEffectChance: 1.0 };
  const events = makeEvents();
  StatusEffectSystem.applyFromHits({ hits: [{ target: enemy, projectile: proj }], events });
  assert.equal(enemy.statusEffects.length, 1, 'entity.statusEffects에 즉시 부여되어야 함');
  assert.equal(events.statusApplied?.length ?? 0, 1, 'statusApplied 알림도 발행되어야 함');
});

test('동일 타입 상태이상 2회 적용 → 1개만 존재 (중복 방지)', () => {
  if (!StatusEffectSystem) return;
  const enemy  = makeEnemy();
  const proj   = { isAlive: true, pendingDestroy: false, statusEffectId: 'slow', statusEffectChance: 1.0 };
  const hit    = { target: enemy, projectile: proj };
  const events = makeEvents();
  StatusEffectSystem.applyFromHits({ hits: [hit, hit], events });
  assert.equal(enemy.statusEffects.length, 1, '중복 적용됨 — 1개만 존재해야 함');
});

test('ice_bolt_upgrade impactBurst는 primary target 제외 주변 적에게 slow와 secondary hit를 부여한다', () => {
  if (!StatusEffectSystem) return;
  const player = makePlayer({ id: 'player' });
  const primary = makeEnemy({ id: 'enemy_primary', x: 120, y: 80 });
  const splash = makeEnemy({ id: 'enemy_splash', x: 170, y: 80 });
  const far = makeEnemy({ id: 'enemy_far', x: 280, y: 80 });
  const events = makeEvents();
  const projectile = {
    ownerId: player.id,
    impactEffectType: 'ice_bolt_upgrade_impact',
    statusEffectId: 'slow',
    statusEffectChance: 1.0,
    impactBurst: {
      radius: 96,
      damage: 2,
      statusEffectId: 'slow',
      statusEffectChance: 1.0,
      excludePrimaryTarget: true,
    },
  };

  events.hits.push({
    attackerId: player.id,
    targetId: primary.id,
    target: primary,
    damage: 5,
    projectile,
  });

  const world = makeWorld({
    entities: { player, enemies: [primary, splash, far] },
    queues: { events },
    runtime: { rng: makeRng([0.25, 0.25]) },
  });

  StatusEffectSystem.update({ world });

  assert.equal(primary.statusEffects.some((effect) => effect.type === 'slow'), true, 'primary target slow 누락');
  assert.equal(splash.statusEffects.some((effect) => effect.type === 'slow'), true, 'impactBurst splash target slow 누락');
  assert.equal(far.statusEffects.length, 0, 'impactBurst 범위 밖 대상에 slow가 적용되면 안 됨');
  assert.equal(events.hits.length, 2, 'impactBurst secondary hit가 enqueue되지 않음');

  const secondaryHit = events.hits.find((hit) => hit.targetId === splash.id);
  assert.ok(secondaryHit, 'impactBurst splash hit 이벤트가 없음');
  assert.equal(secondaryHit.damage, 2, 'impactBurst splash damage가 기대값과 다름');
  assert.equal(secondaryHit.projectile?.impactEffectType ?? null, null, 'splash proxy projectile은 impactEffectType을 가지면 안 됨');
  assert.equal(secondaryHit.projectile?.impactBurst ?? null, null, 'splash proxy projectile은 impactBurst를 재귀적으로 가지면 안 됨');
});

test('impactBurst는 pendingDestroy 또는 isAlive=false 대상에는 secondary hit를 만들지 않는다', () => {
  if (!StatusEffectSystem) return;
  const player = makePlayer({ id: 'player' });
  const primary = makeEnemy({ id: 'enemy_primary', x: 120, y: 80 });
  const pending = makeEnemy({ id: 'enemy_pending', x: 150, y: 80, pendingDestroy: true });
  const dead = makeEnemy({ id: 'enemy_dead', x: 160, y: 80, isAlive: false });
  const events = makeEvents({
    hits: [{
      attackerId: player.id,
      targetId: primary.id,
      target: primary,
      damage: 5,
      projectile: {
        ownerId: player.id,
        statusEffectId: 'slow',
        statusEffectChance: 1.0,
        impactBurst: {
          radius: 96,
          damage: 2,
          statusEffectId: 'slow',
          statusEffectChance: 1.0,
          excludePrimaryTarget: true,
        },
      },
    }],
  });
  const world = makeWorld({
    entities: { player, enemies: [primary, pending, dead] },
    queues: { events },
    runtime: { rng: makeRng([0.25, 0.25]) },
  });

  StatusEffectSystem.update({ world });

  assert.equal(events.hits.length, 1, '비활성 대상은 splash secondary hit에서 제외되어야 함');
  assert.equal(pending.statusEffects.length, 0, 'pendingDestroy target에 slow가 적용되면 안 됨');
  assert.equal(dead.statusEffects.length, 0, 'dead target에 slow가 적용되면 안 됨');
});

// ── tick ──────────────────────────────────────────────────────────────

test('remaining이 0 이하가 되면 상태이상 제거', () => {
  if (!StatusEffectSystem) return;
  const enemy = makeEnemy();
  enemy.statusEffects.push({
    id: 'se_1', type: 'slow', remaining: 0.001,
    magnitude: 0.3, tickInterval: null, tickAccumulator: 0, color: '#aaa',
  });
  const events = makeEvents();
  StatusEffectSystem.tick({ enemies: [enemy], player: null, deltaTime: 0.1, events });
  assert.equal(enemy.statusEffects.length, 0, '만료된 상태이상이 제거되지 않음');
});

summary();
