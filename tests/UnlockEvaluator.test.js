import assert from 'node:assert/strict';
import { makeSessionState } from './fixtures/index.js';
import { test, summary } from './helpers/testRunner.js';

let unlockData;
let evaluateUnlocks;

try {
  ({ unlockData } = await import('../src/data/unlockData.js'));
  ({ evaluateUnlocks } = await import('../src/systems/progression/unlockEvaluator.js'));
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
  ]);

  for (const item of unlockData) {
    assert.ok(supported.has(item.conditionType), `지원하지 않는 conditionType: ${item.conditionType}`);
  }
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

summary();
