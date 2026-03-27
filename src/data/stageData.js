export const stageData = [
  {
    id: 'ash_plains',
    name: 'Ash Plains',
    description: '균형 잡힌 전장입니다. 기본 규칙을 유지한 채 빌드 실험에 적합합니다.',
    enemyHpMult: 1.0,
    enemySpeedMult: 1.0,
    spawnRateMult: 1.0,
    rewardMult: 1.0,
    eliteChanceBonus: 0.0,
    background: {
      fillStyle: '#0d1117',
      gridColor: 'rgba(255,255,255,0.04)',
      accentColor: 'rgba(199,163,93,0.06)',
    },
    gimmicks: [],
  },
  {
    id: 'moon_crypt',
    name: 'Moon Crypt',
    description: '적 이동과 엘리트 압박이 강화됩니다. 재화 보상도 약간 증가합니다.',
    enemyHpMult: 1.05,
    enemySpeedMult: 1.12,
    spawnRateMult: 1.08,
    rewardMult: 1.1,
    eliteChanceBonus: 0.03,
    background: {
      fillStyle: '#11101c',
      gridColor: 'rgba(196,210,255,0.05)',
      accentColor: 'rgba(112,124,182,0.08)',
    },
    gimmicks: [
      {
        id: 'grave_call',
        type: 'enemy_ring',
        startAt: 75,
        interval: 55,
        enemyId: 'elite_skeleton',
        count: 3,
        ringRadius: 210,
        announceText: 'Moon Crypt stirs the dead.',
        effectColor: '#d5dcff',
      },
      {
        id: 'grave_barrage',
        type: 'projectile_barrage',
        startAt: 135,
        interval: 85,
        count: 5,
        ringRadius: 170,
        projectileSpeed: 190,
        damage: 10,
        color: '#b9c8ff',
        announceText: 'Moon Crypt rains spectral fire.',
        effectColor: '#d5dcff',
      },
    ],
  },
  {
    id: 'ember_hollow',
    name: 'Ember Hollow',
    description: '더 단단한 적이 몰려들지만 보상이 큽니다. 후반 압박이 크게 올라갑니다.',
    enemyHpMult: 1.16,
    enemySpeedMult: 1.04,
    spawnRateMult: 1.14,
    rewardMult: 1.18,
    eliteChanceBonus: 0.05,
    background: {
      fillStyle: '#160d0d',
      gridColor: 'rgba(255,214,170,0.05)',
      accentColor: 'rgba(255,112,67,0.09)',
    },
    gimmicks: [
      {
        id: 'ember_cache',
        type: 'pickup_cluster',
        startAt: 60,
        interval: 70,
        count: 4,
        radius: 110,
        pickupType: 'gold',
        currencyValue: 5,
        color: '#ffb35c',
        announceText: 'Embers crack open hidden spoils.',
      },
      {
        id: 'ember_ring',
        type: 'hazard_ring',
        startAt: 165,
        interval: 95,
        count: 4,
        ringRadius: 150,
        projectileSpeed: 210,
        damage: 11,
        color: '#ff9f68',
        effectColor: '#ffd1a3',
        announceText: 'Ember Hollow brands the arena rim.',
      },
      {
        id: 'cultist_ambush',
        type: 'enemy_ring',
        startAt: 110,
        interval: 90,
        enemyId: 'cultist',
        count: 4,
        ringRadius: 230,
        announceText: 'Ember Hollow calls in ash cultists.',
        effectColor: '#ff8a65',
      },
    ],
  },
  {
    id: 'frost_harbor',
    name: 'Frost Harbor',
    description: '서늘한 항만에서 교차 탄막과 정예 압박이 이어집니다. 보상도 높지만 실수가 크게 벌어집니다.',
    enemyHpMult: 1.12,
    enemySpeedMult: 1.09,
    spawnRateMult: 1.1,
    rewardMult: 1.15,
    eliteChanceBonus: 0.04,
    background: {
      fillStyle: '#0b1322',
      gridColor: 'rgba(180,214,255,0.05)',
      accentColor: 'rgba(114,180,255,0.09)',
    },
    gimmicks: [
      {
        id: 'harbor_crossfire',
        type: 'cross_barrage',
        startAt: 95,
        interval: 70,
        ringRadius: 150,
        projectileSpeed: 220,
        damage: 10,
        color: '#92c9ff',
        effectColor: '#d2ebff',
        announceText: 'Frost Harbor seals the lanes with crossfire.',
      },
      {
        id: 'harbor_watch',
        type: 'enemy_ring',
        startAt: 145,
        interval: 80,
        enemyId: 'ember_mage',
        count: 4,
        ringRadius: 220,
        announceText: 'Frozen sentries emerge from the piers.',
        effectColor: '#9ed7ff',
      },
    ],
  },
];

const DEFAULT_STAGE = Object.freeze({ ...stageData[0] });

export function normalizeStageId(stageId = null) {
  if (typeof stageId !== 'string' || stageId.length === 0) {
    return DEFAULT_STAGE.id;
  }
  return stageData.some((stage) => stage.id === stageId) ? stageId : DEFAULT_STAGE.id;
}

export function getStageById(stageId = null) {
  const normalizedId = normalizeStageId(stageId);
  return stageData.find((stage) => stage.id === normalizedId) ?? DEFAULT_STAGE;
}

export function getStageChoices() {
  return stageData.map((stage) => ({ ...stage }));
}
