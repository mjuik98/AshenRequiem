const DAILY_REWARD_HISTORY_LIMIT = 30;
const DAILY_STREAK_MILESTONE_INTERVAL = 3;

function parseDailySeedDay(seedLabel = '') {
  const match = /^daily-(\d{4})-(\d{2})-(\d{2})$/.exec(seedLabel);
  if (!match) return null;
  const [, year, month, day] = match;
  return Date.UTC(Number(year), Number(month) - 1, Number(day));
}

function isNextDailySeed(previousSeed = '', nextSeed = '') {
  const previousDay = parseDailySeedDay(previousSeed);
  const nextDay = parseDailySeedDay(nextSeed);
  if (previousDay == null || nextDay == null) return false;
  return nextDay - previousDay === 24 * 60 * 60 * 1000;
}

function getNextMilestone(streak = 0) {
  const target = Math.max(
    DAILY_STREAK_MILESTONE_INTERVAL,
    Math.ceil((Math.max(1, streak) + 1) / DAILY_STREAK_MILESTONE_INTERVAL) * DAILY_STREAK_MILESTONE_INTERVAL,
  );
  return {
    target,
    remaining: Math.max(0, target - streak),
  };
}

export function buildDailyRewardResult(runResult = {}, meta = {}) {
  const seedMode = runResult.seedMode ?? 'none';
  const seedLabel = runResult.seedLabel ?? '';
  const eligible = seedMode === 'daily' && Boolean(seedLabel);
  const claimedSeeds = Array.isArray(meta?.claimedDailyRewardSeeds)
    ? meta.claimedDailyRewardSeeds
    : [];
  const alreadyClaimed = eligible && claimedSeeds.includes(seedLabel);
  const isVictory = runResult.outcome === 'victory';
  const previousStreak = Math.max(0, Number(meta?.dailyChallengeStreak) || 0);
  const streak = eligible && isVictory && !alreadyClaimed
    ? (isNextDailySeed(meta?.lastDailyRewardSeed, seedLabel) ? previousStreak + 1 : 1)
    : previousStreak;
  const streakBonus = eligible ? Math.max(0, streak - 1) * 5 : 0;
  const milestoneBonus = eligible && streak > 0 && streak % DAILY_STREAK_MILESTONE_INTERVAL === 0 ? 20 : 0;
  const amount = eligible
    ? 40 + Math.max(0, Number(runResult.ascensionLevel) || 0) * 10 + streakBonus + milestoneBonus
    : 0;

  return {
    eligible,
    awarded: eligible && isVictory && !alreadyClaimed && amount > 0,
    alreadyClaimed,
    amount,
    seedLabel,
    streak,
    streakBonus,
    milestoneBonus,
    nextMilestone: getNextMilestone(streak),
  };
}

export function applyDailyRewardToSession(session, reward = {}) {
  if (!reward.awarded) {
    reward.streak ??= Math.max(0, Number(session?.meta?.dailyChallengeStreak) || 0);
    reward.nextMilestone ??= getNextMilestone(reward.streak);
    return reward;
  }

  const claimedSeeds = Array.isArray(session?.meta?.claimedDailyRewardSeeds)
    ? session.meta.claimedDailyRewardSeeds
    : [];
  session.meta.claimedDailyRewardSeeds = [
    reward.seedLabel,
    ...claimedSeeds.filter((seed) => seed !== reward.seedLabel),
  ].slice(0, DAILY_REWARD_HISTORY_LIMIT);
  session.meta.dailyChallengeStreak = reward.streak ?? 0;
  session.meta.bestDailyChallengeStreak = Math.max(
    reward.streak ?? 0,
    session.meta.bestDailyChallengeStreak ?? 0,
  );
  session.meta.lastDailyRewardSeed = reward.seedLabel ?? '';
  session.meta.currency = Math.max(0, (session.meta.currency ?? 0) + (reward.amount ?? 0));
  return reward;
}
