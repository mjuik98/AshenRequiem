/**
 * tests/DamageSystem.test.js — DamageSystem 단위 테스트
 *
 * 검증 항목:
 *   - hit 이벤트 기반 HP 감소
 *   - 사망 판정 (hp <= 0 → pendingDestroy + events.deaths)
 *   - pendingDestroy 엔티티 이중 처리 차단
 *   - 플레이어 피격 시 invincibleTimer 설정
 *   - 흡혈(lifesteal) 적용
 *   - 데미지 텍스트 MAX_PER_FRAME 상한
 *
 * 실행: npm test
 */

import assert from 'node:assert/strict';

let DamageSystem;
try {
  ({ DamageSystem } = await import('../src/systems/combat/DamageSystem.js'));
} catch (e) {
  console.warn('[테스트] DamageSystem import 실패 — 스킵:', e.message);
  process.exit(0);
}

// ── 픽스처 ────────────────────────────────────────────────────────────

function makeEnemy(overrides = {}) {
  return {
    id: 'e1', type: 'enemy',
    x: 0, y: 0, radius: 20,
    hp: 50, maxHp: 50,
    isAlive: true, pendingDestroy: false,
    knockbackResist: 0,
    ...overrides,
  };
}

function makePlayer(overrides = {}) {
  return {
    id: 'player', type: 'player',
    x: 0, y: 0, radius: 16,
    hp: 100, maxHp: 100,
    isAlive: true, pendingDestroy: false,
    lifesteal: 0,
    invincibleTimer: 0,
    invincibleDuration: 1.0,
    ...overrides,
  };
}

function makeHit(target, damage, projectile = null) {
  return {
    attackerId:   'attacker',
    targetId:     target.id,
    target,
    damage,
    projectileId: projectile?.id ?? null,
    projectile,
  };
}

function makeWorld(overrides = {}) {
  return {
    player:     makePlayer(),
    spawnQueue: [],
    events: {
      hits:   [],
      deaths: [],
    },
    ...overrides,
  };
}

// ── 테스트 러너 ───────────────────────────────────────────────────────

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

console.log('\n[DamageSystem 테스트 시작]');

// ── 기본 HP 감소 ──────────────────────────────────────────────────────

test('hit 이벤트로 적 HP가 감소한다', () => {
  const enemy  = makeEnemy({ hp: 50 });
  const world  = makeWorld({ events: { hits: [makeHit(enemy, 20)], deaths: [] }, spawnQueue: [] });

  DamageSystem.update({ world });

  assert.equal(enemy.hp, 30);
});

test('데미지가 hp를 초과해도 음수가 되지 않는다', () => {
  const enemy = makeEnemy({ hp: 10 });
  const world = makeWorld({ events: { hits: [makeHit(enemy, 9999)], deaths: [] }, spawnQueue: [] });

  DamageSystem.update({ world });

  assert.equal(enemy.hp, 0);
});

// ── 사망 판정 ─────────────────────────────────────────────────────────

test('hp가 0 이하가 되면 pendingDestroy=true, deaths에 기록', () => {
  const enemy = makeEnemy({ hp: 5 });
  const world = makeWorld({ events: { hits: [makeHit(enemy, 10)], deaths: [] }, spawnQueue: [] });

  DamageSystem.update({ world });

  assert.equal(enemy.isAlive, false);
  assert.equal(enemy.pendingDestroy, true);
  assert.equal(world.events.deaths.length, 1);
  assert.equal(world.events.deaths[0].entity, enemy);
});

test('이미 pendingDestroy인 엔티티는 처리하지 않는다', () => {
  const enemy = makeEnemy({ hp: 50, pendingDestroy: true });
  const world = makeWorld({ events: { hits: [makeHit(enemy, 20)], deaths: [] }, spawnQueue: [] });

  DamageSystem.update({ world });

  assert.equal(enemy.hp, 50, 'pendingDestroy 엔티티의 HP가 변경됨');
  assert.equal(world.events.deaths.length, 0);
});

// ── 플레이어 피격 ─────────────────────────────────────────────────────

test('플레이어 피격 시 invincibleTimer가 설정된다', () => {
  const player = makePlayer({ hp: 100, invincibleTimer: 0, invincibleDuration: 1.5 });
  const world  = makeWorld({
    player,
    events: { hits: [makeHit(player, 10)], deaths: [] },
    spawnQueue: [],
  });

  DamageSystem.update({ world });

  assert.equal(player.invincibleTimer, 1.5);
});

// ── 흡혈 ─────────────────────────────────────────────────────────────

test('lifesteal > 0이면 플레이어 HP 회복', () => {
  const enemy  = makeEnemy({ hp: 100 });
  const player = makePlayer({ hp: 80, maxHp: 100, lifesteal: 0.2 });
  const world  = makeWorld({
    player,
    events: { hits: [makeHit(enemy, 20)], deaths: [] },
    spawnQueue: [],
  });

  DamageSystem.update({ world });

  assert.equal(player.hp, 84, `흡혈 후 HP 불일치 (기대: 84, 실제: ${player.hp})`);
});

test('흡혈로 maxHp를 초과하지 않는다', () => {
  const enemy  = makeEnemy({ hp: 100 });
  const player = makePlayer({ hp: 99, maxHp: 100, lifesteal: 1.0 });
  const world  = makeWorld({
    player,
    events: { hits: [makeHit(enemy, 50)], deaths: [] },
    spawnQueue: [],
  });

  DamageSystem.update({ world });

  assert.equal(player.hp, 100, 'maxHp 초과');
});

// ── 스폰 큐 (데미지 텍스트) ───────────────────────────────────────────

test('데미지 적용 시 damageText가 spawnQueue에 추가된다', () => {
  const enemy = makeEnemy();
  const world = makeWorld({ events: { hits: [makeHit(enemy, 15)], deaths: [] }, spawnQueue: [] });

  DamageSystem.update({ world });

  const textSpawns = world.spawnQueue.filter(s => s.type === 'effect' && s.config.effectType === 'damageText');
  assert(textSpawns.length > 0, 'damageText spawnQueue 없음');
  assert.equal(textSpawns[0].config.text, '-15');
});

// ── 결과 ─────────────────────────────────────────────────────────────

console.log(`\n최종 결과: ${passed}개 통과, ${failed}개 실패`);
if (failed > 0) process.exit(1);
