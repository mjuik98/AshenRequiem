/**
 * accessoryData.js — 장신구 정의
 *
 * CHANGE: coin_pendant 추가 — 골드 획득량 +30% (rare)
 *   currencyMult stat: 골드 획득 배율 (flat 가산, 0.30 = +30%)
 */
export const accessoryData = [
  // ── 기존 장신구 ──────────────────────────────────────────────────────────────
  {
    id:          'ring_of_speed',
    name:        '속도의 반지',
    description: '이동 속도 +30',
    rarity:      'common',
    maxLevel:    5,
    effects:     [{ stat: 'moveSpeed', value: 30, valuePerLevel: 6 }],
  },
  {
    id:          'iron_heart',
    name:        '강철 심장',
    description: '최대 HP +40',
    rarity:      'common',
    maxLevel:    5,
    effects:     [{ stat: 'maxHp', value: 40, valuePerLevel: 8 }],
  },
  {
    id:          'magnet_stone',
    name:        '자석석',
    description: '픽업 흡수 범위 +50',
    rarity:      'common',
    maxLevel:    5,
    effects:     [{ stat: 'magnetRadius', value: 50, valuePerLevel: 10 }],
  },
  {
    id:          'vampiric_amulet',
    name:        '흡혈 부적',
    description: '흡혈 +8%, 최대 HP +20',
    rarity:      'rare',
    maxLevel:    5,
    effects:     [
      { stat: 'lifesteal', value: 0.08, valuePerLevel: 0.02 },
      { stat: 'maxHp', value: 20, valuePerLevel: 5 },
    ],
  },
  {
    id:          'tome_of_power',
    name:        '마력의 서',
    description: '모든 무기 데미지 +20%',
    rarity:      'rare',
    maxLevel:    5,
    effects:     [{ stat: 'damageMult', value: 1.20, valuePerLevel: 0.05 }],
  },
  {
    id:          'shadow_cloak',
    name:        '그림자 망토',
    description: '이동 속도 +20, 무적 시간 +0.3초',
    rarity:      'rare',
    maxLevel:    5,
    effects:     [
      { stat: 'moveSpeed', value: 20, valuePerLevel: 4 },
      { stat: 'invincibleDuration', value: 0.3, valuePerLevel: 0.05 },
    ],
  },
  {
    id:          'warrior_belt',
    name:        '전사의 허리띠',
    description: '최대 HP +25, 이동 속도 +10',
    rarity:      'common',
    maxLevel:    5,
    effects:     [
      { stat: 'maxHp', value: 25, valuePerLevel: 5 },
      { stat: 'moveSpeed', value: 10, valuePerLevel: 2 },
    ],
  },
  {
    id:          'crystal_lens',
    name:        '수정 렌즈',
    description: '픽업 흡수 범위 +30, 흡혈 +4%',
    rarity:      'rare',
    maxLevel:    5,
    effects:     [
      { stat: 'magnetRadius', value: 30, valuePerLevel: 6 },
      { stat: 'lifesteal', value: 0.04, valuePerLevel: 0.01 },
    ],
  },

  // ── 신규 장신구 ──────────────────────────────────────────────────────────────
  {
    id:          'swift_hourglass',
    name:        '쾌속 모래시계',
    description: '무기 쿨다운 20% 단축',
    rarity:      'rare',
    maxLevel:    5,
    effects:     [{ stat: 'cooldownMult', value: -0.20, valuePerLevel: -0.04 }],
  },
  {
    id:          'wind_crystal',
    name:        '바람의 수정',
    description: '투사체 속도 +30%',
    rarity:      'common',
    maxLevel:    5,
    effects:     [{ stat: 'projectileSpeedMult', value: 0.30, valuePerLevel: 0.06 }],
  },
  {
    id:          'arcane_prism',
    name:        '비전 프리즘',
    description: '투사체 크기 +25%',
    rarity:      'rare',
    maxLevel:    5,
    effects:     [{ stat: 'projectileSizeMult', value: 0.25, valuePerLevel: 0.05 }],
  },
  {
    id:          'scholars_rune',
    name:        '학자의 룬',
    description: '경험치 획득 +30%',
    rarity:      'common',
    maxLevel:    5,
    effects:     [{ stat: 'xpMult', value: 0.30, valuePerLevel: 0.06 }],
  },
  {
    id:          'duplicator',
    name:        '복제기',
    description: '모든 무기 투사체 수 +1',
    rarity:      'rare',
    maxLevel:    5,
    effects:     [{ stat: 'bonusProjectileCount', value: 1.0, valuePerLevel: 0.49 }],
  },

  // ── Patch 장신구 ──────────────────────────────────────────────────────────────
  {
    id:          'scattered_shot',
    name:        '산탄 마법진',
    description: '모든 직선 무기 투사체 +1발',
    rarity:      'rare',
    maxLevel:    5,
    effects:     [{ stat: 'bonusProjectileCount', value: 1, valuePerLevel: 0 }],
  },
  {
    id:          'crit_gem',
    name:        '크리티컬 보석',
    description: '크리티컬 확률 +10%, 크리티컬 피해 +30%',
    rarity:      'rare',
    maxLevel:    5,
    effects:     [
      { stat: 'critChance', value: 0.10, valuePerLevel: 0.02 },
      { stat: 'critMultiplier', value: 0.30, valuePerLevel: 0.06 },
    ],
  },
  {
    id:          'executioner_ring',
    name:        '처형자의 반지',
    description: '크리티컬 피해 +50%, HP +15',
    rarity:      'rare',
    maxLevel:    5,
    effects:     [
      { stat: 'critMultiplier', value: 0.50, valuePerLevel: 0.10 },
      { stat: 'maxHp', value: 15, valuePerLevel: 3 },
    ],
  },

  // ── 골드 획득 장신구 (신규) ───────────────────────────────────────────────────
  {
    id:          'coin_pendant',
    name:        '동전 목걸이',
    description: '골드 획득량 +30%',
    rarity:      'common',
    maxLevel:    5,
    effects:     [{ stat: 'currencyMult', value: 0.30, valuePerLevel: 0.08 }],
  },
  {
    id:          'greed_amulet',
    name:        '탐욕의 부적',
    description: '골드 획득량 +50%, 픽업 범위 +20',
    rarity:      'rare',
    maxLevel:    5,
    effects:     [
      { stat: 'currencyMult', value: 0.50, valuePerLevel: 0.10 },
      { stat: 'magnetRadius', value: 20,   valuePerLevel: 4    },
    ],
  },
];

/** id로 장신구 데이터 조회 */
export function getAccessoryById(id) {
  return accessoryData.find(a => a.id === id) ?? null;
}
