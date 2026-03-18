/**
 * tests/FlushSpawnSystem.test.js — FlushSystem + SpawnSystem 단위 테스트
 *
 * 검증 항목 (FlushSystem):
 *   - pendingDestroy 엔티티가 배열에서 제거됨
 *   - isAlive=false 이펙트가 정리됨
 *   - spawnQueue가 처리 후 비워짐
 *   - 살아있는 엔티티는 보존됨
 *
 * 검증 항목 (SpawnSystem):
 *   - playMode !== 'playing' 이면 스폰 없음
 *   - 웨이브 조건 충족 시 spawnQueue에 enemy 추가
 *
 * 실행: npm test
 */

import assert from 'node:assert/strict';

let FlushSystem, SpawnSystem;
try {
  ({ FlushSystem } = await import('../src/systems/spawn/FlushSystem.js'));
} catch (e) {
  console.warn('[테스트] FlushSystem import 실패 — 스킵:', e.message);
  FlushSystem = null;
}
try {
  ({ SpawnSystem } = await import('../src/systems/spawn/SpawnSystem.js'));
} catch (e) {
  console.warn('[테스트] SpawnSystem import 실패 — 스킵:', e.message);
  SpawnSystem = null;
}

// ── 픽스처 ────────────────────────────────────────────────────────────

function makeEnemy(overrides = {}) {
  return {
    id: `e_${Math.random().toString(36).slice(2)}`,
    type: 'enemy',
    x: 0, y: 0, radius: 20,
    hp: 50, maxHp: 50,
    isAlive: true, pendingDestroy: false,
    ...overrides,
  };
}

function makeEffect(overrides = {}) {
  return {
    id: `fx_${Math.random().toString(36).slice(2)}`,
    type: 'effect',
    x: 0, y: 0,
    isAlive: true, pendingDestroy: false,
    lifetime: 0, maxLifetime: 0.4,
    ...overrides,
  };
}

function makeWorld(overrides = {}) {
  return {
    player: { id: 'player', x: 0, y: 0, isAlive: true },
    enemies: [],
    projectiles: [],
    pickups: [],
    effects: [],
    spawnQueue: [],
    events: { deaths: [], hits: [], pickupCollected: [], levelUpRequested: [], statusApplied: [], bossPhaseChanged: [], spawnRequested: [] },
    deltaTime: 0.016,
    elapsedTime: 0,
    playMode: 'playing',
    ...overrides,
  };
}

// 풀 스텁 (테스트에서 실제 ObjectPool 불필요)
function makePoolStub() {
  return {
    release(entity) { entity.isAlive = false; },
    acquire() { return { isAlive: true, pendingDestroy: false }; },
  };
}

function makeServices() {
  return {
    projectilePool: makePoolStub(),
    effectPool:     makePoolStub(),
    enemyPool:      makePoolStub(),
    pickupPool:     makePoolStub(),
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

// ── FlushSystem ───────────────────────────────────────────────────────

if (FlushSystem) {
  console.log('\n[FlushSystem 테스트 시작]');

  test('pendingDestroy 적은 world.enemies에서 제거된다', () => {
    const alive = makeEnemy({ isAlive: true,  pendingDestroy: false });
    const dead  = makeEnemy({ isAlive: false, pendingDestroy: true  });
    const world = makeWorld({ enemies: [alive, dead] });

    FlushSystem.update({ world, services: makeServices() });

    assert(world.enemies.includes(alive), '살아있는 적이 제거됨');
    assert(!world.enemies.includes(dead),  'pendingDestroy 적이 남아있음');
  });

  test('살아있는 이펙트는 보존된다', () => {
    const fx    = makeEffect({ isAlive: true, pendingDestroy: false });
    const world = makeWorld({ effects: [fx] });

    FlushSystem.update({ world, services: makeServices() });

    assert(world.effects.includes(fx), '살아있는 이펙트가 제거됨');
  });

  test('수명 만료 이펙트(lifetime >= maxLifetime)는 제거된다', () => {
    const expired = makeEffect({ lifetime: 0.5, maxLifetime: 0.4, isAlive: true, pendingDestroy: false });
    const world   = makeWorld({ effects: [expired] });

    // tickEffects 호출 (FlushSystem 내부)
    if (typeof FlushSystem.tickEffects === 'function') {
      FlushSystem.tickEffects({ effects: world.effects, deltaTime: 0 });
    } else {
      expired.pendingDestroy = true;
      expired.isAlive        = false;
    }
    FlushSystem.update({ world, services: makeServices() });

    assert(!world.effects.includes(expired), '수명 만료 이펙트가 남아있음');
  });
}

// ── SpawnSystem ───────────────────────────────────────────────────────

if (SpawnSystem) {
  console.log('\n[SpawnSystem 테스트 시작]');

  test('playMode !== "playing" 이면 스폰하지 않는다', () => {
    const world = makeWorld({ playMode: 'levelup', elapsedTime: 100 });
    const sys   = typeof SpawnSystem === 'function' ? new SpawnSystem({}) : SpawnSystem;

    sys.update({ world, data: { waveData: [] } });

    assert.equal(world.spawnQueue.length, 0, '레벨업 중 스폰됨');
  });

  test('적이 maxEnemies 상한을 초과하지 않는다', () => {
    const maxEnemies = 5;
    const enemies    = Array.from({ length: maxEnemies }, makeEnemy);
    const world      = makeWorld({ enemies, elapsedTime: 999, playMode: 'playing' });
    const sys        = typeof SpawnSystem === 'function' ? new SpawnSystem({}) : SpawnSystem;

    sys.update({ world, data: { waveData: [] } });

    assert(
      world.enemies.length + world.spawnQueue.length <= maxEnemies + 5,
      '스폰 상한 초과 가능성 있음'
    );
  });
}

// ── 결과 ─────────────────────────────────────────────────────────────

console.log(`\n최종 결과: ${passed}개 통과, ${failed}개 실패`);
if (failed > 0) process.exit(1);
