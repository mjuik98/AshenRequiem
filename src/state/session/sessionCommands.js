export function updateSessionBest(session, runResult) {
  if (runResult.kills > session.best.kills) session.best.kills = runResult.kills;
  if (runResult.survivalTime > session.best.survivalTime) session.best.survivalTime = runResult.survivalTime;
  if (runResult.level > session.best.level) session.best.level = runResult.level;

  session.last = {
    kills: runResult.kills ?? 0,
    survivalTime: runResult.survivalTime ?? 0,
    level: runResult.level ?? 1,
    weaponsUsed: runResult.weaponsUsed ?? [],
  };
}

export function earnCurrency(session, amount) {
  session.meta.currency = Math.max(0, session.meta.currency + amount);
}

export function purchasePermanentUpgrade(session, upgradeId, cost) {
  if (session.meta.currency < cost) return false;
  session.meta.currency -= cost;
  session.meta.permanentUpgrades[upgradeId] =
    (session.meta.permanentUpgrades[upgradeId] ?? 0) + 1;
  return true;
}
