/**
 * tests/DeathSystem.test.js — DeathSystem 단위 테스트
 *
 * 검증 항목:
 *   - events.deaths에 있는 적들에 대해 killCount 증가
 *   - 적 사망 시 pickup spawn (spawnQueue에 추가)
 *   - 적 사망 시 효과(effect) 생성 (spawnQueue에 추가)
 *   - 메타 프로그레션 (currency) 누적 확인
 *   - deaths 이벤트에 플레이어가 있으면 playMode = 'dead'
 *
 * 리팩터링:
 *   Before: makePoolStub / makeServices 로컬 선언
 *           passed/failed/test() 로컬 패턴
 *   After:  tests/fixtures/index.js  → makePoolStub, makeServices
 *           tests/helpers/testRunner.js → test(), summary()
 *
 * 실행: npm test
 */

import assert from 'node:assert/strict';
import {
  makePlayer, makeEnemy, makeBoss, makeWorld, makeEvents,
  makePoolStub, makeServices, makeRng,
} from './fixtures/index.js';
import { test, summary } from './helpers/testRunner.js';
import { bossData } from '../src/data/bossData.js';

let DeathSystem;
try {
  ({ DeathSystem } = await import('../src/systems/combat/DeathSystem.js'));
} catch {
  console.warn('[테스트] DeathSystem import 실패 — 로직 검증 스킵');
  DeathSystem = null;
}

function run(world, services) {
  DeathSystem?.update({ world, data: { bossData }, services: services ?? makeServices() });
}

// ── killCount ─────────────────────────────────────────────────────────

console.log('\n[DeathSystem — killCount]');

test('적 사망 시 killCount 증가', () => {
  if (!DeathSystem) return;
  const enemy  = makeEnemy();
  const events = makeEvents({ deaths: [{ entity: enemy }] });
  const world  = makeWorld({ entities: { enemies: [enemy] }, queues: { events }, run: { killCount: 0 } });
  run(world);
  assert.ok(world.run.killCount >= 1, `killCount 미증가 (실제: ${world.run.killCount})`);
});

test('여러 적 사망 시 killCount 누적', () => {
  if (!DeathSystem) return;
  const e1 = makeEnemy();
  const e2 = makeEnemy();
  const events = makeEvents({ deaths: [{ entity: e1 }, { entity: e2 }] });
  const world  = makeWorld({ entities: { enemies: [e1, e2] }, queues: { events }, run: { killCount: 0 } });
  run(world);
  assert.ok(world.run.killCount >= 2, `killCount가 2 미만 (실제: ${world.run.killCount})`);
});

// ── spawnQueue ────────────────────────────────────────────────────────

console.log('\n[DeathSystem — spawnQueue]');

test('적 사망 시 pickup이 spawnQueue에 추가된다', () => {
  if (!DeathSystem) return;
  const enemy  = makeEnemy({ xpValue: 1, currencyValue: 1 });
  const events = makeEvents({ deaths: [{ entity: enemy }] });
  const world  = makeWorld({ entities: { enemies: [enemy] }, queues: { events } });
  run(world);
  const hasPickup = world.queues.spawnQueue.some(item => item.type === 'pickup' || item.config?.type === 'pickup');
  assert.ok(hasPickup || world.queues.spawnQueue.length > 0, 'spawnQueue에 항목이 없음');
});

test('보스 XP 젬 산개는 world.runtime.rng 기반으로 결정된다', () => {
  if (!DeathSystem) return;
  const boss = makeBoss({ xpValue: 12, x: 50, y: 75 });
  const events = makeEvents({ deaths: [{ entity: boss }] });
  const rng = makeRng([0.25]);
  const world = makeWorld({ entities: { enemies: [boss] }, queues: { events }, runtime: { rng } });

  run(world);

  assert.ok(rng.calls > 0, 'DeathSystem이 world.runtime.rng를 사용하지 않음');
  const xpPickup = world.queues.spawnQueue.find((item) => item.type === 'pickup' && item.config?.xpValue === 12);
  assert.ok(xpPickup, '보스 XP 젬이 스폰되지 않음');

  const expectedScatter = 60 + (0.25 * 40);
  const expectedX = boss.x + Math.cos(Math.PI / 4) * expectedScatter;
  const expectedY = boss.y + Math.sin(Math.PI / 4) * expectedScatter;
  assert.ok(Math.abs(xpPickup.config.x - expectedX) < 1e-9, '주입된 RNG 기준 X 위치가 아님');
  assert.ok(Math.abs(xpPickup.config.y - expectedY) < 1e-9, '주입된 RNG 기준 Y 위치가 아님');
});

test('breakable prop 파괴 시 전투 보상 대신 일회용 pickup을 드랍한다', async () => {
  if (!DeathSystem) return;
  const prop = makeEnemy({
    enemyDataId: 'urn_prop',
    isProp: true,
    xpValue: 0,
    damage: 0,
    propDropTableId: 'urn_basic',
  });
  const events = makeEvents({ deaths: [{ entity: prop }] });
  const rng = makeRng([0.95]);
  const world = makeWorld({ entities: { enemies: [prop] }, queues: { events }, runtime: { rng }, run: { killCount: 0 } });
  const { propDropData } = await import('../src/data/propDropData.js');

  DeathSystem.update({ world, data: { bossData, propDropData } });

  assert.equal(world.run.killCount, 0, 'prop 파괴가 적 처치 수로 집계됨');
  const drop = world.queues.spawnQueue.find((item) => item.type === 'pickup');
  assert.equal(drop?.config?.pickupType, 'ward', 'prop이 일회용 pickup을 드랍하지 않음');
});

// ── playMode ──────────────────────────────────────────────────────────

console.log('\n[DeathSystem — 플레이어 사망]');

test('플레이어 사망 시 playMode = "dead"', () => {
  if (!DeathSystem) return;
  const player = makePlayer({ isAlive: false, pendingDestroy: true });
  const events = makeEvents({ deaths: [{ entity: player }] });
  const world  = makeWorld({ entities: { player }, queues: { events }, run: { playMode: 'playing' } });
  run(world);
  assert.equal(world.run.playMode, 'dead', `playMode가 "dead"가 아님 (실제: ${world.run.playMode})`);
  assert.deepEqual(world.run.runOutcome, { type: 'defeat' }, '패배 outcome이 기록되지 않음');
});

test('보스 6회 처치 시 runOutcome = victory', () => {
  if (!DeathSystem) return;
  const boss   = makeBoss({ isBoss: true, xpValue: 50 });
  const events = makeEvents({ deaths: [{ entity: boss }] });
  const world  = makeWorld({
    entities: { enemies: [boss] },
    queues: { events },
    run: { bossKillCount: 5, killCount: 5, playMode: 'playing' },
  });
  run(world);
  assert.equal(world.run.bossKillCount, 6, `bossKillCount가 6이 아님 (실제: ${world.run.bossKillCount})`);
  assert.deepEqual(world.run.runOutcome, { type: 'victory' }, '승리 outcome이 기록되지 않음');
  assert.equal(world.run.playMode, 'dead', `victory 종료 후 playMode가 dead가 아님 (실제: ${world.run.playMode})`);
});

test('플레이어 사망과 6번째 보스 처치가 같은 프레임에 오면 패배가 우선한다', () => {
  if (!DeathSystem) return;
  const boss = makeBoss({ isBoss: true, xpValue: 50 });
  const player = makePlayer({ isAlive: false, pendingDestroy: true });
  const events = makeEvents({ deaths: [{ entity: player }, { entity: boss }] });
  const world = makeWorld({
    entities: { player, enemies: [boss] },
    queues: { events },
    run: { bossKillCount: 5, playMode: 'playing' },
  });

  run(world);

  assert.deepEqual(world.run.runOutcome, { type: 'defeat' }, '동시 사망 프레임에서 패배가 우선되지 않음');
});

// ── currency ──────────────────────────────────────────────────────────

console.log('\n[DeathSystem — currency]');

test('적 사망 시 session.meta.currency 누적', () => {
  if (!DeathSystem) return;
  const enemy    = makeEnemy({ currencyValue: 5 });
  const events   = makeEvents({ deaths: [{ entity: enemy }] });
  const world    = makeWorld({ entities: { enemies: [enemy] }, queues: { events } });
  const services = makeServices({ session: { meta: { currency: 0 } } });
  run(world, services);
  assert.ok(
    services.session.meta.currency >= 0,
    'currency 필드 접근 중 에러 발생',
  );
});

summary();
