import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';

console.log('\n[RunAnalyticsDomain]');

const { test, summary } = createRunner('RunAnalyticsDomain');

test('run analytics는 stage weakness와 archetype 기록을 계산한다', async () => {
  const { buildRunAnalytics } = await import('../src/domain/meta/progression/runAnalyticsDomain.js');

  const analytics = buildRunAnalytics({
    claimedDailyRewardSeeds: ['daily-2026-03-25', 'daily-2026-03-26'],
    dailyChallengeStreak: 2,
    bestDailyChallengeStreak: 4,
    recentRuns: [
      { stageId: 'moon_crypt', stageName: 'Moon Crypt', outcome: 'defeat', survivalTime: 240, archetypeId: 'vanguard' },
      { stageId: 'moon_crypt', stageName: 'Moon Crypt', outcome: 'defeat', survivalTime: 220, archetypeId: 'vanguard' },
      { stageId: 'ash_plains', stageName: 'Ash Plains', outcome: 'victory', survivalTime: 600, archetypeId: 'spellweaver' },
      { stageId: 'ash_plains', stageName: 'Ash Plains', outcome: 'victory', survivalTime: 580, archetypeId: 'spellweaver' },
    ],
  });

  assert.equal(analytics.dailyStats.claimedRewards, 2);
  assert.equal(analytics.dailyStats.streak, 2);
  assert.equal(analytics.dailyStats.bestStreak, 4);
  assert.equal(analytics.stageWeakness.stageId, 'moon_crypt');
  assert.equal(analytics.stageWeakness.winRate, 0);
  assert.equal(analytics.archetypeRecords[0].archetypeId, 'spellweaver');
});

test('run recommendation domain은 취약 스테이지와 패배 원인을 기반으로 조정 추천을 만든다', async () => {
  const { buildRunRecommendations } = await import('../src/domain/meta/progression/runRecommendationDomain.js');

  const recommendations = buildRunRecommendations({
    analytics: {
      stageWeakness: {
        stageId: 'moon_crypt',
        stageName: 'Moon Crypt',
        winRate: 0,
        defeats: 3,
      },
      deathCauseSummary: [{ deathCause: 'elite_skeleton', count: 3 }],
      archetypeRecords: [{ archetypeId: 'vanguard', winRate: 20, runs: 5 }],
      dailyStats: { streak: 2, bestStreak: 4 },
    },
  });

  assert.equal(recommendations.length >= 2, true);
  assert.equal(recommendations.some((entry) => entry.title.includes('Moon Crypt')), true);
  assert.equal(recommendations.some((entry) => entry.description.includes('elite_skeleton')), true);
});

summary();
