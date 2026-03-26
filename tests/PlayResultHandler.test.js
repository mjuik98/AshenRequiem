import assert from 'node:assert/strict';
import { makePlayer, makeSessionState, makeWorld } from './fixtures/index.js';
import { test, summary } from './helpers/testRunner.js';
import {
  PlayResultHandler,
  createPlayResultHandler,
  processPlayResult,
} from '../src/scenes/play/PlayResultHandler.js';

console.log('\n[PlayResultHandler]');

test('PlayResult runtime helper는 요약 계산과 세션 커밋 경계를 노출한다', async () => {
  const playResultRuntime = await import('../src/scenes/play/playResultRuntime.js');

  assert.equal(typeof playResultRuntime.buildPlayResultSummary, 'function', 'buildPlayResultSummary helper가 없음');
  assert.equal(typeof playResultRuntime.commitPlayResultSession, 'function', 'commitPlayResultSession helper가 없음');
});

test('PlayResultHandler facade는 thin helper export를 함께 노출한다', () => {
  const session = makeSessionState();
  const world = makeWorld({ entities: { player: makePlayer({ weapons: [] }) } });

  const handler = createPlayResultHandler(session);

  assert.equal(handler instanceof PlayResultHandler, true, 'factory helper가 PlayResultHandler를 반환하지 않음');
  assert.equal(typeof processPlayResult(session, world), 'object', 'function facade가 결과 객체를 반환하지 않음');
});

test('런 종료 시 신규 해금을 세션 메타에 반영한다', () => {
  const session = makeSessionState({
    meta: {
      enemyKills: { zombie: 1200, skeleton: 400 },
      killedBosses: ['boss_lich', 'boss_warden'],
      weaponsUsedAll: ['magic_bolt', 'holy_aura', 'boomerang'],
      evolvedWeapons: ['arcane_nova'],
      unlockedWeapons: ['magic_bolt'],
      unlockedAccessories: [],
      completedUnlocks: [],
      currency: 0,
    },
  });
  const world = makeWorld({
    run: { killCount: 42, elapsedTime: 650, runOutcome: { type: 'victory' } },
    entities: { player: makePlayer({
      level: 7,
      weapons: [
        { id: 'magic_bolt', level: 3, currentCooldown: 0 },
        { id: 'holy_aura', level: 1, currentCooldown: 0 },
      ],
    }) },
  });

  const handler = new PlayResultHandler(session);
  const result = handler.process(world);

  assert.deepEqual(
    session.meta.completedUnlocks.sort(),
    [
      'unlock_arcane_prism',
      'unlock_boomerang',
      'unlock_chain_lightning',
      'unlock_coin_pendant',
      'unlock_crystal_shard',
      'unlock_flame_zone',
      'unlock_lightning_ring',
      'unlock_persistence_charm',
      'unlock_piercing_spear',
      'unlock_solar_ray',
      'unlock_wind_crystal',
    ].sort(),
    '달성한 해금 ID가 세션에 반영되지 않음',
  );
  [
    'magic_bolt',
    'holy_aura',
    'frost_nova',
    'boomerang',
    'lightning_ring',
    'chain_lightning',
    'solar_ray',
    'piercing_spear',
    'flame_zone',
    'crystal_shard',
  ].forEach((weaponId) => {
    assert.equal(
      session.meta.unlockedWeapons.includes(weaponId),
      true,
      `무기 해금 보상이 세션에 반영되지 않음: ${weaponId}`,
    );
  });
  [
    'ring_of_speed',
    'duplicator',
    'arcane_prism',
    'coin_pendant',
    'persistence_charm',
    'wind_crystal',
  ].forEach((accessoryId) => {
    assert.equal(
      session.meta.unlockedAccessories.includes(accessoryId),
      true,
      `장신구 해금 보상이 세션에 반영되지 않음: ${accessoryId}`,
    );
  });
  assert.equal(result.outcome, 'victory', '런 결과 반환값이 유지되지 않음');
  assert.equal(session.last.kills, 42, '기존 결과 저장 경로가 끊김');
});

test('승리 런도 totalRuns를 1 증가시킨다', () => {
  const session = makeSessionState({ meta: { totalRuns: 3 } });
  const world = makeWorld({
    run: { runOutcome: { type: 'victory' } },
    entities: { player: makePlayer({ level: 4, weapons: [] }) },
  });

  const handler = new PlayResultHandler(session);
  handler.process(world);

  assert.equal(session.meta.totalRuns, 4, '승리 런이 totalRuns에 반영되지 않음');
});

test('패배 런도 totalRuns를 1 증가시킨다', () => {
  const session = makeSessionState({ meta: { totalRuns: 7 } });
  const world = makeWorld({
    run: { runOutcome: { type: 'defeat' } },
    entities: { player: makePlayer({ level: 2, weapons: [] }) },
  });

  const handler = new PlayResultHandler(session);
  handler.process(world);

  assert.equal(session.meta.totalRuns, 8, '패배 런이 totalRuns에 반영되지 않음');
});

test('런 결과는 이전 최고 기록과 무기/해금 요약을 함께 반환한다', () => {
  const session = makeSessionState({
    best: { kills: 30, survivalTime: 120, level: 4 },
    meta: {
      currency: 100,
      enemyKills: { zombie: 900 },
      completedUnlocks: [],
      unlockedWeapons: ['magic_bolt'],
      unlockedAccessories: [],
    },
  });
  const world = makeWorld({
    run: { killCount: 45, elapsedTime: 600, runCurrencyEarned: 12, runOutcome: { type: 'defeat' } },
    entities: { player: makePlayer({
      level: 6,
      weapons: [
        { id: 'magic_bolt', name: 'Magic Bolt', level: 3, isEvolved: false },
        { id: 'holy_aura', name: 'Holy Aura', level: 2, isEvolved: true },
      ],
    }) },
  });

  const handler = new PlayResultHandler(session);
  const result = handler.process(world);

  assert.equal(result.bestTime, 120, '이전 최고 생존 시간이 반환되지 않음');
  assert.equal(result.bestLevel, 4, '이전 최고 레벨이 반환되지 않음');
  assert.equal(result.bestKills, 30, '이전 최고 킬 수가 반환되지 않음');
  assert.deepEqual(
    result.weapons,
    [
      { name: 'Magic Bolt', level: 3, isEvolved: false },
      { name: 'Holy Aura', level: 2, isEvolved: true },
    ],
    '사용 무기 요약이 결과에 포함되지 않음',
  );
  assert.deepEqual(
    result.newUnlocks.sort(),
    [
      '관통 창 해금',
      '바람의 수정 해금',
      '부메랑 해금',
      '비전 프리즘 해금',
      '지속의 부적 해금',
      '태양 광선 해금',
    ].sort(),
    '이번 런 신규 해금 rewardText가 결과에 포함되지 않음',
  );
  assert.equal(result.currencyEarned, 12, 'world.runCurrencyEarned 기반 획득 재화가 유지되지 않음');
});

test('PlayResult runtime helper는 요약 계산과 세션 커밋을 독립적으로 수행한다', async () => {
  const { buildPlayResultSummary, commitPlayResultSession } = await import('../src/scenes/play/playResultRuntime.js');
  const session = makeSessionState({
    best: { kills: 30, survivalTime: 120, level: 4 },
    meta: {
      totalRuns: 5,
      currency: 100,
      enemyKills: { zombie: 900 },
      completedUnlocks: [],
      unlockedWeapons: ['magic_bolt'],
      unlockedAccessories: [],
    },
  });
  const world = makeWorld({
    run: { killCount: 45, elapsedTime: 600, runCurrencyEarned: 12, runOutcome: { type: 'defeat' } },
    entities: { player: makePlayer({
      level: 6,
      weapons: [
        { id: 'magic_bolt', name: 'Magic Bolt', level: 3, isEvolved: false },
        { id: 'holy_aura', name: 'Holy Aura', level: 2, isEvolved: true },
      ],
    }) },
  });

  const summaryResult = buildPlayResultSummary(world, session, {
    startCurrency: 88,
    prevBestTime: 120,
    prevBestLevel: 4,
    prevBestKills: 30,
    newUnlockRewardTexts: ['지속의 부적 해금'],
  });

  assert.equal(summaryResult.totalCurrency, 100, '요약 계산 단계가 현재 세션 재화를 유지하지 않음');
  assert.equal(summaryResult.currencyEarned, 12, '요약 계산 단계가 획득 재화를 잘못 계산함');
  assert.equal(session.meta.totalRuns, 5, '요약 계산 단계에서 세션을 mutate하면 안 됨');

  commitPlayResultSession(session, {
    runResult: {
      kills: 45,
      survivalTime: 600,
      level: 6,
      weaponsUsed: ['magic_bolt', 'holy_aura'],
    },
    unlockResult: {
      newUnlockRewardTexts: ['지속의 부적 해금'],
      completedUnlockIds: ['unlock_persistence_charm'],
      unlockedWeaponIds: [],
      unlockedAccessoryIds: ['persistence_charm'],
    },
  }, {
    persistSessionImpl: () => {},
  });

  assert.equal(session.meta.totalRuns, 6, '세션 커밋 단계가 totalRuns를 증가시키지 않음');
  assert.equal(session.meta.completedUnlocks.includes('unlock_persistence_charm'), true, '세션 커밋 단계가 해금을 반영하지 않음');
});

summary();
