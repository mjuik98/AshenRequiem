export const CURSE_SCALING = Object.freeze({
  spawnRatePerPoint: 0.35,
  enemyHpPerPoint: 0.55,
  enemyXpPerPoint: 0.35,
});

export function normalizeCurseValue(value) {
  return Math.max(0, Number(value) || 0);
}

export function buildCurseSnapshot(curseValue = 0) {
  const curse = normalizeCurseValue(curseValue);
  return {
    value: curse,
    spawnRateMult: 1 + curse * CURSE_SCALING.spawnRatePerPoint,
    enemyHpMult: 1 + curse * CURSE_SCALING.enemyHpPerPoint,
    enemyXpMult: 1 + curse * CURSE_SCALING.enemyXpPerPoint,
  };
}
