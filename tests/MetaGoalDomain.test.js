import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { makeSessionState } from './fixtures/index.js';

console.log('\n[MetaGoalDomain]');

const { test, summary } = createRunner('MetaGoalDomain');

test('meta goal domain은 unlock, 영구 업그레이드, 도감, 데일리 목표를 하나의 roadmap으로 묶는다', async () => {
  const { buildMetaGoalRoadmap } = await import('../src/domain/meta/progression/metaGoalDomain.js');

  const roadmap = buildMetaGoalRoadmap({
    session: makeSessionState({
      best: {
        survivalTime: 220,
        level: 8,
      },
      meta: {
        currency: 22,
        completedUnlocks: [],
        unlockedWeapons: ['magic_bolt'],
        unlockedAccessories: ['iron_heart'],
        weaponsUsedAll: ['magic_bolt'],
        accessoriesOwnedAll: ['iron_heart'],
        enemyKills: { zombie: 180 },
        dailyChallengeStreak: 2,
        bestDailyChallengeStreak: 2,
      },
    }),
    gameData: {
      unlockData: [
        {
          id: 'unlock_boomerang',
          targetType: 'weapon',
          targetId: 'boomerang',
          conditionType: 'total_kills_gte',
          conditionValue: 500,
          title: '곡예의 각성',
          rewardText: '부메랑 해금',
        },
      ],
      permanentUpgradeData: [
        {
          id: 'perm_hp',
          name: '강인한 체질',
          maxLevel: 10,
          costPerLevel: () => 10,
          effect: { stat: 'maxHp', valuePerLevel: 10 },
        },
      ],
      enemyData: [{ id: 'zombie' }, { id: 'skeleton' }],
      weaponData: [{ id: 'magic_bolt' }, { id: 'boomerang' }],
      accessoryData: [{ id: 'iron_heart' }, { id: 'tome_of_power' }],
    },
    limit: 4,
  });

  assert.equal(roadmap.length, 4, 'meta roadmap가 4개 목표를 반환하지 않음');
  assert.equal(roadmap.some((entry) => entry.kind === 'unlock'), true, 'meta roadmap가 unlock 목표를 포함하지 않음');
  assert.equal(roadmap.some((entry) => entry.kind === 'meta_upgrade'), true, 'meta roadmap가 영구 업그레이드 목표를 포함하지 않음');
  assert.equal(roadmap.some((entry) => entry.kind === 'codex'), true, 'meta roadmap가 도감 목표를 포함하지 않음');
  assert.equal(roadmap.some((entry) => entry.kind === 'daily'), true, 'meta roadmap가 데일리 목표를 포함하지 않음');
});

await summary();
