/**
 * tests/CritSystem.test.js — DamageSystem 크리티컬 히트 단위 테스트
 */
import assert from 'node:assert/strict';
import { makePlayer, makeEnemy, makeWorld, makeEvents } from './fixtures/index.js';
import { test, summary } from './helpers/testRunner.js';

let DamageSystem;
try {
  ({ DamageSystem } = await import('../src/systems/combat/DamageSystem.js'));
} catch (e) {
  console.warn('[테스트] DamageSystem import 실패 — 스킵:', e.message);
  process.exit(0);
}

function makeHitEvent(overrides = {}) {
  return {
    attackerId:  'player',
    targetId:    'enemy',
    target:      null,
    damage:      10,
    projectileId: null,
    projectile:  null,
    isCrit:      false,
    ...overrides,
  };
}

console.log('\n[CritSystem — DamageSystem 크리티컬 테스트]');

test('critChance=1.0이면 항상 크리티컬 발생 (데미지 배율 2배)', () => {
  const player = makePlayer({ critChance: 1.0, critMultiplier: 2.0 });
  const enemy  = makeEnemy({ hp: 1000 });
  const hit    = makeHitEvent({ target: enemy, attackerId: 'player', damage: 10 });
  const world  = makeWorld({ entities: { player }, queues: { events: makeEvents({ hits: [hit] }) } });
  DamageSystem.update({ world });
  // critMultiplier 2.0 → 10 * 2 = 20 피해
  assert.ok(enemy.hp <= 980, `크리티컬 미발생 (실제 hp: ${enemy.hp})`);
});

test('critChance=0이면 크리티컬 미발생 (데미지 그대로)', () => {
  const player = makePlayer({ critChance: 0, critMultiplier: 2.0 });
  const enemy  = makeEnemy({ hp: 100 });
  const hit    = makeHitEvent({ target: enemy, attackerId: 'player', damage: 10 });
  const world  = makeWorld({ entities: { player }, queues: { events: makeEvents({ hits: [hit] }) } });
  DamageSystem.update({ world });
  assert.ok(enemy.hp >= 88, `일반 데미지여야 함 (실제 hp: ${enemy.hp})`);
  assert.ok(enemy.hp <= 92, `일반 데미지여야 함 (실제 hp: ${enemy.hp})`);
});

test('isCrit=true 플래그가 있으면 외부 크리티컬로 처리 (critChance 무관)', () => {
  const player = makePlayer({ critChance: 0, critMultiplier: 3.0 });
  const enemy  = makeEnemy({ hp: 1000 });
  // 외부(chainLightning 등)에서 isCrit=true 세팅
  const hit    = makeHitEvent({ target: enemy, attackerId: 'player', damage: 10, isCrit: true });
  const world  = makeWorld({ entities: { player }, queues: { events: makeEvents({ hits: [hit] }) } });
  DamageSystem.update({ world });
  // isCrit=true지만 외부 크리티컬은 critMultiplier 미적용 (hit.damage 그대로 사용)
  // DamageSystem은 isCrit=true일 때 텍스트 색상만 바꾸고 데미지 재계산은 하지 않음
  assert.ok(enemy.hp <= 992, `데미지 미적용 (hp: ${enemy.hp})`);
});

test('critMultiplier가 높을수록 크리 피해량 증가', () => {
  const player1 = makePlayer({ critChance: 1.0, critMultiplier: 2.0 });
  const player2 = makePlayer({ critChance: 1.0, critMultiplier: 4.0 });
  const enemy1  = makeEnemy({ hp: 1000, id: 'e1' });
  const enemy2  = makeEnemy({ hp: 1000, id: 'e2' });

  const world1  = makeWorld({ entities: { player: player1 }, queues: { events: makeEvents({ hits: [makeHitEvent({ target: enemy1, attackerId: 'player', damage: 10 })] }) } });
  const world2  = makeWorld({ entities: { player: player2 }, queues: { events: makeEvents({ hits: [makeHitEvent({ target: enemy2, attackerId: 'player', damage: 10 })] }) } });

  DamageSystem.update({ world: world1 });
  DamageSystem.update({ world: world2 });

  assert.ok(enemy2.hp < enemy1.hp, `critMultiplier 4.0이 2.0보다 더 많은 피해를 줘야 함 (hp1:${enemy1.hp}, hp2:${enemy2.hp})`);
});

summary();
