export const ascensionData = [
  {
    level: 0,
    name: '밤의 시작',
    description: '기본 전투 강도입니다.',
    enemyHpMult: 1.0,
    enemyDamageMult: 1.0,
    enemySpeedMult: 1.0,
    enemyXpMult: 1.0,
    spawnRateMult: 1.0,
    eliteChanceBonus: 0.0,
    rewardMult: 1.0,
  },
  {
    level: 1,
    name: '핏빛 장막',
    description: '적이 조금 더 빠르게 몰려들고 보상도 약간 늘어납니다.',
    enemyHpMult: 1.12,
    enemyDamageMult: 1.08,
    enemySpeedMult: 1.04,
    enemyXpMult: 1.04,
    spawnRateMult: 1.10,
    eliteChanceBonus: 0.02,
    rewardMult: 1.08,
  },
  {
    level: 2,
    name: '재의 기류',
    description: '후반 압박이 뚜렷해지고 엘리트 출현이 빨라집니다.',
    enemyHpMult: 1.24,
    enemyDamageMult: 1.14,
    enemySpeedMult: 1.06,
    enemyXpMult: 1.08,
    spawnRateMult: 1.20,
    eliteChanceBonus: 0.04,
    rewardMult: 1.16,
  },
  {
    level: 3,
    name: '사신의 서약',
    description: '전장 밀도가 크게 오르고 실수가 더 치명적이 됩니다.',
    enemyHpMult: 1.38,
    enemyDamageMult: 1.22,
    enemySpeedMult: 1.08,
    enemyXpMult: 1.12,
    spawnRateMult: 1.32,
    eliteChanceBonus: 0.06,
    rewardMult: 1.24,
  },
  {
    level: 4,
    name: '심연의 계약',
    description: '보스와 엘리트가 더 단단해지고 웨이브 간격이 좁아집니다.',
    enemyHpMult: 1.55,
    enemyDamageMult: 1.30,
    enemySpeedMult: 1.12,
    enemyXpMult: 1.16,
    spawnRateMult: 1.45,
    eliteChanceBonus: 0.08,
    rewardMult: 1.34,
  },
  {
    level: 5,
    name: '종말의 성가',
    description: '최종 시험 단계입니다. 전투 압력은 크게 오르지만 보상도 가장 높습니다.',
    enemyHpMult: 1.75,
    enemyDamageMult: 1.38,
    enemySpeedMult: 1.16,
    enemyXpMult: 1.22,
    spawnRateMult: 1.60,
    eliteChanceBonus: 0.10,
    rewardMult: 1.45,
  },
];

const DEFAULT_ASCENSION = Object.freeze({ ...ascensionData[0] });

export function getAscensionByLevel(level = 0) {
  return ascensionData.find((entry) => entry.level === level) ?? DEFAULT_ASCENSION;
}

export function normalizeAscensionLevel(level = 0) {
  const numericLevel = Number.isFinite(level) ? Math.trunc(level) : Number.parseInt(level ?? '0', 10);
  if (!Number.isFinite(numericLevel)) return 0;
  const maxLevel = ascensionData.at(-1)?.level ?? 0;
  return Math.min(Math.max(numericLevel, 0), maxLevel);
}

export function getAscensionChoices() {
  return ascensionData.map((entry) => ({
    ...entry,
    pressureLabel: `적 체력 x${entry.enemyHpMult.toFixed(2)} · 스폰 x${entry.spawnRateMult.toFixed(2)}`,
    rewardLabel: `보상 x${entry.rewardMult.toFixed(2)}`,
  }));
}
