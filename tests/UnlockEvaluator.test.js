import assert from 'node:assert/strict';
import { makeSessionState } from './fixtures/index.js';
import { test, summary } from './helpers/testRunner.js';

let unlockData;
let evaluateUnlocks;
let unlockProgressRuntime;

try {
  ({ unlockData } = await import('../src/data/unlockData.js'));
  ({ evaluateUnlocks } = await import('../src/domain/meta/progression/unlockEvaluator.js'));
  unlockProgressRuntime = await import('../src/domain/meta/progression/unlockProgressRuntime.js');
} catch (e) {
  console.warn('[테스트] unlock evaluator import 실패:', e.message);
}

console.log('\n[UnlockEvaluator]');

test('unlockData has unique ids and supported condition types', () => {
  assert.ok(Array.isArray(unlockData), 'unlockData 배열 없음');
  const ids = unlockData.map(item => item.id);
  assert.equal(new Set(ids).size, ids.length, 'unlockData id 중복 존재');

  const supported = new Set([
    'total_kills_gte',
    'survival_time_gte',
    'boss_kills_gte',
    'weapon_owned_once',
    'weapon_evolved_once',
    'currency_earned_gte',
    'curse_gte',
    'ascension_clear_gte',
    'all_of',
    'any_of',
  ]);

  for (const item of unlockData) {
    assert.ok(supported.has(item.conditionType), `지원하지 않는 conditionType: ${item.conditionType}`);
  }
});

test('unlockData는 holy/ice bolt midgame unlock 계약을 포함한다', () => {
  const holyUnlock = unlockData.find((item) => item.targetType === 'weapon' && item.targetId === 'holy_bolt');
  const iceUnlock = unlockData.find((item) => item.targetType === 'weapon' && item.targetId === 'ice_bolt');

  assert.ok(holyUnlock, 'holy_bolt unlock entry가 없음');
  assert.ok(iceUnlock, 'ice_bolt unlock entry가 없음');
  assert.equal(holyUnlock.conditionType, 'total_kills_gte', 'holy_bolt unlock conditionType 불일치');
  assert.equal(holyUnlock.conditionValue, 850, 'holy_bolt unlock conditionValue 불일치');
  assert.equal(iceUnlock.conditionType, 'survival_time_gte', 'ice_bolt unlock conditionType 불일치');
  assert.equal(iceUnlock.conditionValue, 660, 'ice_bolt unlock conditionValue 불일치');
});

test('evaluateUnlocks awards total kill unlocks once', () => {
  const session = makeSessionState({
    meta: {
      enemyKills: { zombie: 600 },
      unlockedWeapons: ['magic_bolt'],
      unlockedAccessories: [],
      completedUnlocks: [],
      selectedStartWeaponId: 'magic_bolt',
    },
  });

  const result = evaluateUnlocks({
    session,
    runResult: {
      kills: 600,
      survivalTime: 120,
      level: 3,
      weaponsUsed: ['magic_bolt'],
    },
    unlockData,
  });

  assert.ok(result.newlyCompletedUnlocks.length > 0, '해금 달성 결과가 비어 있음');
  assert.ok(result.newlyUnlockedWeapons.includes('boomerang'), '킬 조건 보상 무기 해금이 누락됨');
});

test('evaluateUnlocks ignores already completed unlocks', () => {
  const session = makeSessionState({
    meta: {
      unlockedWeapons: ['magic_bolt', 'boomerang'],
      unlockedAccessories: [],
      completedUnlocks: ['unlock_boomerang'],
      selectedStartWeaponId: 'magic_bolt',
    },
  });

  const result = evaluateUnlocks({
    session,
    runResult: {
      kills: 9999,
      survivalTime: 1200,
      level: 10,
      weaponsUsed: ['magic_bolt'],
    },
    unlockData,
  });

  assert.equal(result.newlyCompletedUnlocks.includes('unlock_boomerang'), false, '이미 완료한 해금이 다시 반환됨');
});

test('evaluateUnlocks awards expanded weapon and accessory rewards', () => {
  const session = makeSessionState({
    meta: {
      enemyKills: { zombie: 1200, skeleton: 400 },
      killedBosses: ['boss_lich', 'boss_warden'],
      weaponsUsedAll: ['magic_bolt', 'holy_aura', 'boomerang'],
      evolvedWeapons: ['arcane_nova'],
      unlockedWeapons: ['magic_bolt'],
      unlockedAccessories: [],
      completedUnlocks: [],
      selectedStartWeaponId: 'magic_bolt',
    },
  });

  const result = evaluateUnlocks({
    session,
    runResult: {
      kills: 1600,
      survivalTime: 720,
      level: 9,
      weaponsUsed: ['magic_bolt', 'holy_aura', 'boomerang'],
    },
    unlockData,
  });

  assert.ok(result.newlyUnlockedWeapons.includes('chain_lightning'), '확장 무기 해금 보상이 누락됨');
  assert.ok(result.newlyUnlockedAccessories.includes('coin_pendant'), '확장 장신구 해금 보상이 누락됨');
});

test('unlock progress runtime은 compute/apply 경계를 분리해 계산 단계에서 session을 직접 mutate하지 않는다', () => {
  assert.equal(typeof unlockProgressRuntime.computeUnlockProgress, 'function', 'computeUnlockProgress helper가 없음');
  assert.equal(typeof unlockProgressRuntime.applyUnlockProgress, 'function', 'applyUnlockProgress helper가 없음');

  const session = makeSessionState({
    meta: {
      enemyKills: { zombie: 600 },
      unlockedWeapons: ['magic_bolt'],
      unlockedAccessories: [],
      completedUnlocks: [],
    },
  });
  const before = JSON.stringify(session.meta);

  const progress = unlockProgressRuntime.computeUnlockProgress(session, {
    kills: 600,
    survivalTime: 120,
    level: 3,
    weaponsUsed: ['magic_bolt'],
  }, unlockData);

  assert.equal(JSON.stringify(session.meta), before, 'compute 단계가 session을 직접 mutate하면 안 됨');
  assert.ok(progress.nextUnlockedWeapons.includes('boomerang'), 'compute 단계가 다음 해금 결과를 계산하지 못함');

  unlockProgressRuntime.applyUnlockProgress(session, progress);
  assert.ok(session.meta.unlockedWeapons.includes('boomerang'), 'apply 단계가 계산된 해금 결과를 session에 반영하지 못함');
});

test('evaluateUnlocks는 런 재화 획득량, 저주 수치, Ascension 클리어 조건을 처리한다', () => {
  const session = makeSessionState({
    meta: {
      unlockedWeapons: ['magic_bolt'],
      unlockedAccessories: [],
      completedUnlocks: [],
      highestAscensionCleared: 2,
      selectedStartWeaponId: 'magic_bolt',
    },
  });

  const result = evaluateUnlocks({
    session,
    runResult: {
      kills: 300,
      survivalTime: 420,
      level: 7,
      weaponsUsed: ['magic_bolt'],
      currencyEarned: 180,
      highestCurse: 1.25,
      ascensionCleared: 2,
    },
    unlockData: [
      {
        id: 'unlock_currency_test',
        targetType: 'accessory',
        targetId: 'coin_pendant',
        conditionType: 'currency_earned_gte',
        conditionValue: 150,
      },
      {
        id: 'unlock_curse_test',
        targetType: 'accessory',
        targetId: 'ominous_relic',
        conditionType: 'curse_gte',
        conditionValue: 1.0,
      },
      {
        id: 'unlock_ascension_test',
        targetType: 'weapon',
        targetId: 'chain_lightning',
        conditionType: 'ascension_clear_gte',
        conditionValue: 2,
      },
    ],
  });

  assert.deepEqual(
    result.newlyCompletedUnlocks.sort(),
    ['unlock_currency_test', 'unlock_curse_test', 'unlock_ascension_test'].sort(),
    '확장 unlock condition이 모두 평가되지 않음',
  );
  assert.ok(result.newlyUnlockedAccessories.includes('coin_pendant'), 'currency_earned_gte 보상이 누락됨');
  assert.ok(result.newlyUnlockedAccessories.includes('ominous_relic'), 'curse_gte 보상이 누락됨');
  assert.ok(result.newlyUnlockedWeapons.includes('chain_lightning'), 'ascension_clear_gte 보상이 누락됨');
});

test('evaluateUnlocks는 composite all_of / any_of 조건을 처리한다', () => {
  const session = makeSessionState({
    meta: {
      unlockedWeapons: ['magic_bolt'],
      unlockedAccessories: [],
      completedUnlocks: [],
      highestAscensionCleared: 3,
      recentRuns: [{ currencyEarned: 160, highestCurse: 0.9 }],
    },
  });

  const result = evaluateUnlocks({
    session,
    runResult: {
      kills: 300,
      survivalTime: 420,
      level: 7,
      weaponsUsed: ['magic_bolt'],
      currencyEarned: 160,
      highestCurse: 0.9,
      ascensionCleared: 3,
    },
    unlockData: [
      {
        id: 'unlock_all_test',
        targetType: 'accessory',
        targetId: 'ominous_relic',
        conditionType: 'all_of',
        conditions: [
          { conditionType: 'currency_earned_gte', conditionValue: 150 },
          { conditionType: 'curse_gte', conditionValue: 0.8 },
        ],
      },
      {
        id: 'unlock_any_test',
        targetType: 'accessory',
        targetId: 'swift_hourglass',
        conditionType: 'any_of',
        conditions: [
          { conditionType: 'survival_time_gte', conditionValue: 1200 },
          { conditionType: 'ascension_clear_gte', conditionValue: 3 },
        ],
      },
    ],
  });

  assert.deepEqual(
    result.newlyCompletedUnlocks.sort(),
    ['unlock_all_test', 'unlock_any_test'].sort(),
    'composite unlock condition이 평가되지 않음',
  );
});

summary();
