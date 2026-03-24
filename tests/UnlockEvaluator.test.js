import assert from 'node:assert/strict';
import { makeSessionState } from './fixtures/index.js';
import { test, summary } from './helpers/testRunner.js';

let unlockData;
let evaluateUnlocks;
let unlockProgressRuntime;

try {
  ({ unlockData } = await import('../src/data/unlockData.js'));
  ({ evaluateUnlocks } = await import('../src/progression/unlockEvaluator.js'));
  unlockProgressRuntime = await import('../src/progression/unlockProgressRuntime.js');
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

summary();
