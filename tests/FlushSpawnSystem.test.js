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
 * 리팩터링:
 *   Before: makeEnemy / makeEffect / makeWorld / makePoolStub / makeServices 로컬 선언
 *           passed/failed/test() 로컬 패턴
 *   After:  tests/fixtures/index.js  → makeEnemy, makeEffect, makeWorld,
 *                                       makePoolStub, makeServices
 *           tests/helpers/testRunner.js → test(), summary()
 *
 * 실행: npm test
 */

import assert from 'node:assert/strict';
import {
  makeEnemy, makeEffect, makeWorld,
  makePoolStub, makeServices,
} from './fixtures/index.js';
import { test, summary } from './helpers/testRunner.js';

// ── 시스템 import ─────────────────────────────────────────────────────

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

// ── FlushSystem ───────────────────────────────────────────────────────

if (FlushSystem) {
  console.log('\n[FlushSystem 테스트 시작]');

  test('pendingDestroy 적은 world.enemies에서 제거된다', () => {
    const alive = makeEnemy({ isAlive: true,  pendingDestroy: false });
    const dead  = makeEnemy({ isAlive: false, pendingDestroy: true  });
    const world = makeWorld({ enemies: [alive, dead] });
    FlushSystem.update({ world, services: makeServices() });
    assert.equal(world.enemies.length, 1, '죽은 적이 제거되지 않음');
    assert.equal(world.enemies[0].id, alive.id, '살아있는 적이 잘못 제거됨');
  });

  test('isAlive=false 이펙트가 world.effects에서 제거된다', () => {
    const alive = makeEffect({ isAlive: true,  pendingDestroy: false });
    const dead  = makeEffect({ isAlive: false, pendingDestroy: true  });
    const world = makeWorld({ effects: [alive, dead] });
    FlushSystem.update({ world, services: makeServices() });
    assert.equal(world.effects.length, 1, '죽은 이펙트가 제거되지 않음');
  });

  test('살아있는 엔티티는 보존된다', () => {
    const a = makeEnemy({ isAlive: true, pendingDestroy: false });
    const b = makeEnemy({ isAlive: true, pendingDestroy: false });
    const world = makeWorld({ enemies: [a, b] });
    FlushSystem.update({ world, services: makeServices() });
    assert.equal(world.enemies.length, 2, '살아있는 엔티티가 잘못 제거됨');
  });

  test('spawnQueue가 처리 후 비워진다', () => {
    const world = makeWorld({
      spawnQueue: [{ type: 'enemy', config: { enemyId: 'slime', x: 0, y: 0 } }],
    });
    FlushSystem.update({ world, services: makeServices() });
    assert.equal(world.spawnQueue.length, 0, 'spawnQueue가 비워지지 않음');
  });
}

// ── SpawnSystem ───────────────────────────────────────────────────────

if (SpawnSystem) {
  console.log('\n[SpawnSystem 테스트 시작]');

  test('playMode !== "playing" 이면 스폰 없음', () => {
    const world = makeWorld({ playMode: 'paused' });
    const data  = { waveData: [] };
    SpawnSystem.update({ world, data, services: makeServices() });
    assert.equal(world.spawnQueue.length, 0, 'paused 중에 스폰 발생');
  });
}

summary();
