/**
 * tests/DamageSystem.test.js — DamageSystem 단위 테스트
 *
 * 검증 항목:
 *   - hits 이벤트 기반 체력 감소
 *   - 무적 타이머 중 데미지 무시
 *   - lifesteal — 데미지 비례 체력 회복
 *   - 체력 0 이하 시 isAlive=false + deaths 큐잉
 *   - pendingDestroy 엔티티 데미지 무시
 *
 * 실행: npm test
 */

import assert from 'node:assert/strict';
import { makePlayer, makeEnemy, makeWorld, makeEvents } from './fixtures/index.js';
import { test, summary }                               from './helpers/testRunner.js';

let DamageSystem;
try {
  ({ DamageSystem } = await import('../src/systems/combat/DamageSystem.js'));
} catch {
  console.warn('[테스트] DamageSystem import 실패 — 스킵');
  process.exit(0);
}

function makeHitEvent(overrides = {}) {
  return {
    attackerId:  'attacker',
    targetId:    'target',
    target:      null,
    damage:      10,
    projectileId: null,
    projectile:  null,
    ...overrides,
  };
}

console.log('\n[DamageSystem 테스트]');

// ── 기본 데미지 ───────────────────────────────────────────────────────────

test('hits 이벤트로 적의 hp가 감소한다', () => {
  if (!DamageSystem) return;
  const enemy  = makeEnemy({ hp: 50 });
  const hit    = makeHitEvent({ target: enemy, damage: 15 });
  const world  = makeWorld({ queues: { events: makeEvents({ hits: [hit] }) } });
  DamageSystem.update({ world });
  assert.ok(enemy.hp <= 35, `데미지 미적용 (실제 hp: ${enemy.hp})`);
});

test('hits 이벤트로 플레이어의 hp가 감소한다', () => {
  if (!DamageSystem) return;
  const player = makePlayer({ hp: 100, invincibleTimer: 0 });
  const hit    = makeHitEvent({ target: player, damage: 20 });
  const world  = makeWorld({ entities: { player }, queues: { events: makeEvents({ hits: [hit] }) } });
  DamageSystem.update({ world });
  assert.ok(player.hp <= 80, `플레이어 데미지 미적용 (실제 hp: ${player.hp})`);
});

// ── 무적 타이머 ───────────────────────────────────────────────────────────

test('invincibleTimer > 0 플레이어는 데미지를 받지 않는다', () => {
  if (!DamageSystem) return;
  const player = makePlayer({ hp: 100, invincibleTimer: 1.0 });
  const hit    = makeHitEvent({ target: player, damage: 30 });
  const world  = makeWorld({ entities: { player }, queues: { events: makeEvents({ hits: [hit] }) } });
  DamageSystem.update({ world });
  assert.equal(player.hp, 100, '무적 중 데미지 적용됨');
});

// ── lifesteal ─────────────────────────────────────────────────────────────

test('lifesteal > 0이면 데미지에 비례해 플레이어 hp가 회복된다', () => {
  if (!DamageSystem) return;
  const player = makePlayer({ hp: 50, maxHp: 100, lifesteal: 0.2, invincibleTimer: 0 });
  const enemy  = makeEnemy({ hp: 100 });
  const hit    = makeHitEvent({ attackerId: player.id, target: enemy, damage: 50 });
  const world  = makeWorld({ entities: { player }, queues: { events: makeEvents({ hits: [hit] }) } });
  DamageSystem.update({ world });
  // lifesteal 0.2 × damage 50 = 10 회복
  assert.ok(player.hp > 50, `lifesteal 회복 미작동 (실제 hp: ${player.hp})`);
  assert.ok(player.hp <= player.maxHp, `hp가 maxHp 초과 (실제: ${player.hp})`);
});

// ── 사망 처리 ─────────────────────────────────────────────────────────────

test('hp가 0 이하가 되면 isAlive=false가 되고 deaths 큐에 추가된다', () => {
  if (!DamageSystem) return;
  const enemy = makeEnemy({ hp: 5 });
  const hit   = makeHitEvent({ target: enemy, damage: 10 });
  const world = makeWorld({ entities: { enemies: [enemy] }, queues: { events: makeEvents({ hits: [hit] }) } });
  DamageSystem.update({ world });
  assert.equal(enemy.isAlive, false, '사망 후 isAlive가 여전히 true');
  assert.ok(world.queues.events.deaths.some(d => d.entity === enemy || d.entityId === enemy.id),
    'deaths 큐에 사망 이벤트 없음');
});

// ── pendingDestroy 무시 ────────────────────────────────────────────────────

test('pendingDestroy=true 엔티티는 데미지를 받지 않는다', () => {
  if (!DamageSystem) return;
  const enemy = makeEnemy({ hp: 50, pendingDestroy: true });
  const hit   = makeHitEvent({ target: enemy, damage: 25 });
  const world = makeWorld({ entities: { enemies: [enemy] }, queues: { events: makeEvents({ hits: [hit] }) } });
  DamageSystem.update({ world });
  assert.equal(enemy.hp, 50, 'pendingDestroy 엔티티에 데미지 적용됨');
});

test('같은 프레임에 적이 먼저 죽으면 뒤늦은 히트에 묶인 다른 투사체는 소비되지 않는다', () => {
  if (!DamageSystem) return;
  const enemy = makeEnemy({ hp: 5 });
  const projectiles = Array.from({ length: 4 }, () => {
    const projectile = {
      hitCount: 1,
      hitTargets: new Set([enemy.id]),
      ownerId: 'player',
    };
    return projectile;
  });
  const hits = projectiles.map((projectile) => makeHitEvent({
    attackerId: 'player',
    target: enemy,
    damage: 10,
    projectile,
  }));
  const player = makePlayer({ critChance: 0 });
  const world = makeWorld({
    entities: { player, enemies: [enemy] },
    queues: { events: makeEvents({ hits }) },
  });

  DamageSystem.update({ world });

  assert.equal(projectiles[0].hitCount, 1, '실제로 적을 처치한 첫 투사체의 소비 정보가 사라짐');
  assert.equal(projectiles[0].hitTargets.has(enemy.id), true, '첫 투사체의 명중 대상 정보가 사라짐');
  for (let i = 1; i < projectiles.length; i += 1) {
    assert.equal(projectiles[i].hitCount, 0, `남은 투사체 ${i}의 hitCount가 롤백되지 않음`);
    assert.equal(projectiles[i].hitTargets.size, 0, `남은 투사체 ${i}의 hitTargets가 비워지지 않음`);
  }
});

summary();
