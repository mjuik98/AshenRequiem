/**
 * tests/SpawnSystem.test.js — SpawnSystem 단위 테스트
 *
 * CHANGE(P0-B): deprecated SpawnSystem class 제거에 따른 테스트 수정
 *   Before: new SpawnSystem() 사용 → getDebugInfo가 undefined 반환 (2건 FAIL)
 *           실패 원인: deprecated class wrapper의 getDebugInfo 위임 버그
 *   After:  createSpawnSystem() 직접 사용 → 팩토리 함수 인스턴스가 올바른 상태 반환
 */
import assert from 'node:assert/strict';
import { createSpawnSystem } from '../src/systems/spawn/SpawnSystem.js';
import { bossData }          from '../src/data/bossData.js';
import { test, summary }     from './helpers/testRunner.js';
import { makeRng }           from './fixtures/index.js';

const testWave   = [{ from: 0, to: 999, spawnPerSecond: 2, enemyIds: ['zombie'], eliteChance: 0, eliteIds: [] }];
const testPlayer = { isAlive: true, x: 0, y: 0 };

console.log('\n[SpawnSystem]');

test('보스 스폰 시점은 300초 단위로 정확히 6회다', () => {
  assert.deepEqual(
    bossData.map(boss => boss.at),
    [300, 600, 900, 1200, 1500, 1800],
    'bossData의 at 값이 정확한 5분 간격이 아님',
  );
  assert.equal(bossData.length, 6, 'bossData 보스 수가 6개가 아님');
});

test('새 인스턴스는 깨끗한 상태로 시작', () => {
  const sys  = createSpawnSystem();
  const info = sys.getDebugInfo(0);
  assert.equal(info.hasBossSpawned,       false, 'hasBossSpawned가 false여야 함');
  assert.equal(info.isSuppressed,         false, 'isSuppressed가 false여야 함');
  assert.equal(info.bossSpawnedAt,        null,  'bossSpawnedAt이 null이어야 함');
  assert.equal(info.suppressionRemaining, 0,     'suppressionRemaining이 0이어야 함');
});

test('인스턴스 간 상태 격리', () => {
  const sysA   = createSpawnSystem();
  const sysB   = createSpawnSystem();
  const queueA = [];

  // sysA에 보스를 강제 스폰시킨다
  const bossData = [{ at: 0, enemyId: 'boss_lich' }];
  sysA.update({
    world: { elapsedTime: 1, player: testPlayer, spawnQueue: queueA, deltaTime: 1, playMode: 'playing' },
    data:  { waveData: testWave, bossData },
  });

  assert.equal(sysA.getDebugInfo(1).hasBossSpawned, true,  'sysA: 보스 스폰됨');
  assert.equal(sysB.getDebugInfo(1).hasBossSpawned, false, 'sysB: 독립적이어야 함');
});

test('reset() 후 상태가 초기화된다', () => {
  const sys    = createSpawnSystem();
  const queue  = [];
  const bossData = [{ at: 0, enemyId: 'boss_lich' }];

  sys.update({
    world: { elapsedTime: 1, player: testPlayer, spawnQueue: queue, deltaTime: 1, playMode: 'playing' },
    data:  { waveData: testWave, bossData },
  });

  assert.equal(sys.getDebugInfo(1).hasBossSpawned, true, '스폰 후 hasBossSpawned=true');

  sys.reset();
  const info = sys.getDebugInfo(0);
  assert.equal(info.hasBossSpawned, false, 'reset 후 hasBossSpawned=false');
  assert.equal(info.bossSpawnedAt,  null,  'reset 후 bossSpawnedAt=null');
});

test('playMode !== "playing" 이면 스폰하지 않는다', () => {
  const sys   = createSpawnSystem();
  const queue = [];

  sys.update({
    world: { elapsedTime: 10, player: testPlayer, spawnQueue: queue, deltaTime: 1, playMode: 'paused' },
    data:  { waveData: testWave, bossData: [] },
  });

  assert.equal(queue.length, 0, 'paused 상태에서 스폰 발생');
});

test('getDebugInfo suppressionRemaining은 억제 중일 때 양수', () => {
  const sys    = createSpawnSystem();
  const queue  = [];
  const bossData = [{ at: 0, enemyId: 'boss_lich' }];

  sys.update({
    world: { elapsedTime: 1, player: testPlayer, spawnQueue: queue, deltaTime: 1, playMode: 'playing' },
    data:  { waveData: testWave, bossData },
  });

  const info = sys.getDebugInfo(1);
  assert.ok(info.isSuppressed,              '보스 스폰 직후 억제 상태여야 함');
  assert.ok(info.suppressionRemaining > 0,  'suppressionRemaining이 양수여야 함');
});

test('보스 스폰 시 bossSpawned 이벤트를 발행한다', () => {
  const sys = createSpawnSystem();
  const queue = [];
  const events = { bossSpawned: [] };

  sys.update({
    world: { elapsedTime: 1, player: testPlayer, spawnQueue: queue, deltaTime: 1, playMode: 'playing', events },
    data:  {
      waveData: testWave,
      bossData: [{ at: 0, enemyId: 'boss_lich' }],
      enemyData: [{ id: 'boss_lich', name: 'The Lich' }],
    },
  });

  assert.deepEqual(events.bossSpawned, [{ enemyId: 'boss_lich', bossName: 'The Lich' }], 'bossSpawned 이벤트가 발행되지 않음');
});

test('gameplay spawn randomness는 world.rng를 사용해 엘리트 판정을 수행한다', () => {
  const sys = createSpawnSystem();
  const queue = [];
  const rng = makeRng([0.25]);

  sys.update({
    world: {
      elapsedTime: 10,
      player: testPlayer,
      spawnQueue: queue,
      deltaTime: 1,
      playMode: 'playing',
      rng,
    },
    data: {
      waveData: [{
        from: 0,
        to: 999,
        spawnPerSecond: 1,
        enemyIds: ['zombie'],
        eliteChance: 0.5,
        eliteIds: ['elite_bat'],
      }],
      bossData: [],
    },
  });

  assert.ok(rng.calls > 0, 'SpawnSystem이 world.rng를 사용하지 않음');
  assert.equal(queue[0]?.config?.enemyId, 'elite_bat', '주입된 RNG 기준 엘리트 적이 스폰되지 않음');
});

test('wave prop table이 있으면 breakable prop도 같은 spawnQueue를 통해 등장한다', () => {
  const sys = createSpawnSystem();
  const queue = [];
  const rng = makeRng([0.1, 0.1, 0.1]);

  sys.update({
    world: {
      elapsedTime: 10,
      player: testPlayer,
      spawnQueue: queue,
      deltaTime: 10,
      playMode: 'playing',
      rng,
    },
    data: {
      waveData: [{
        from: 0,
        to: 999,
        spawnPerSecond: 0,
        enemyIds: ['zombie'],
        eliteChance: 0,
        eliteIds: [],
        propSpawnPerSecond: 0.2,
        propIds: ['urn_prop'],
      }],
      bossData: [],
    },
  });

  assert.equal(
    queue.some((req) => req.type === 'enemy' && req.config?.enemyId === 'urn_prop'),
    true,
    'breakable prop 스폰 요청이 생성되지 않음',
  );
});

test('player.curse가 높을수록 같은 시간에 더 많은 적을 스폰한다', () => {
  const baseSys = createSpawnSystem();
  const cursedSys = createSpawnSystem();
  const baseQueue = [];
  const cursedQueue = [];

  baseSys.update({
    world: {
      elapsedTime: 10,
      player: { ...testPlayer, curse: 0 },
      spawnQueue: baseQueue,
      deltaTime: 2,
      playMode: 'playing',
      rng: makeRng([0.2, 0.2, 0.2]),
    },
    data: { waveData: [{ ...testWave[0], spawnPerSecond: 2 }], bossData: [] },
  });

  cursedSys.update({
    world: {
      elapsedTime: 10,
      player: { ...testPlayer, curse: 1.0 },
      spawnQueue: cursedQueue,
      deltaTime: 2,
      playMode: 'playing',
      rng: makeRng([0.2, 0.2, 0.2, 0.2]),
    },
    data: { waveData: [{ ...testWave[0], spawnPerSecond: 2 }], bossData: [] },
  });

  assert.ok(cursedQueue.length > baseQueue.length, '저주가 스폰 압력을 증가시키지 않음');
});

summary();
