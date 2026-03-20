/**
 * accessoryData.js — 장신구 정의
 *
 * 슬롯 제한: 플레이어당 최대 2개
 * rarity: 'common' | 'rare'
 * effects: 배열로 복합 효과 지원
 *
 * 지원 stat:
 *   moveSpeed          — 이동 속도 (flat 가산)
 *   maxHp              — 최대 HP (flat 가산)
 *   lifesteal          — 흡혈 (0~1, flat 가산)
 *   magnetRadius       — 픽업 흡수 범위 (flat 가산)
 *   invincibleDuration — 무적 시간 (flat 가산)
 *   damageMult         — 모든 무기 데미지 배율 (곱연산, 1.2 = +20%)
 *   cooldownMult       — 무기 쿨다운 배율 (flat 감산, -0.2 = 20% 단축)
 *   projectileSpeedMult — 투사체 속도 배율 (flat 가산, 0.3 = +30%)
 *   projectileSizeMult  — 투사체 크기 배율 (flat 가산, 0.25 = +25%)
 *   xpMult             — 경험치 획득 배율 (flat 가산, 0.3 = +30%)
 */
export const accessoryData = [
  // ── 기존 장신구 ──────────────────────────────────────────────────────────────
  {
    id:          'ring_of_speed',
    name:        '속도의 반지',
    description: '이동 속도 +30',
    rarity:      'common',
    maxCount:    1,
    effects:     [{ stat: 'moveSpeed', value: 30 }],
  },
  {
    id:          'iron_heart',
    name:        '강철 심장',
    description: '최대 HP +40',
    rarity:      'common',
    maxCount:    1,
    effects:     [{ stat: 'maxHp', value: 40 }],
  },
  {
    id:          'magnet_stone',
    name:        '자석석',
    description: '픽업 흡수 범위 +50',
    rarity:      'common',
    maxCount:    1,
    effects:     [{ stat: 'magnetRadius', value: 50 }],
  },
  {
    id:          'vampiric_amulet',
    name:        '흡혈 부적',
    description: '흡혈 +8%, 최대 HP +20',
    rarity:      'rare',
    maxCount:    1,
    effects:     [
      { stat: 'lifesteal', value: 0.08 },
      { stat: 'maxHp', value: 20 },
    ],
  },
  {
    id:          'tome_of_power',
    name:        '마력의 서',
    description: '모든 무기 데미지 +20%',
    rarity:      'rare',
    maxCount:    1,
    effects:     [{ stat: 'damageMult', value: 1.20 }],
  },
  {
    id:          'shadow_cloak',
    name:        '그림자 망토',
    description: '이동 속도 +20, 무적 시간 +0.3초',
    rarity:      'rare',
    maxCount:    1,
    effects:     [
      { stat: 'moveSpeed', value: 20 },
      { stat: 'invincibleDuration', value: 0.3 },
    ],
  },
  {
    id:          'warrior_belt',
    name:        '전사의 허리띠',
    description: '최대 HP +25, 이동 속도 +10',
    rarity:      'common',
    maxCount:    1,
    effects:     [
      { stat: 'maxHp', value: 25 },
      { stat: 'moveSpeed', value: 10 },
    ],
  },
  {
    id:          'crystal_lens',
    name:        '수정 렌즈',
    description: '픽업 흡수 범위 +30, 흡혈 +4%',
    rarity:      'rare',
    maxCount:    1,
    effects:     [
      { stat: 'magnetRadius', value: 30 },
      { stat: 'lifesteal', value: 0.04 },
    ],
  },

  // ── 신규 장신구 ──────────────────────────────────────────────────────────────
  {
    id:          'swift_hourglass',
    name:        '쾌속 모래시계',
    description: '무기 쿨다운 20% 단축',
    rarity:      'rare',
    maxCount:    1,
    effects:     [{ stat: 'cooldownMult', value: -0.20 }],
  },
  {
    id:          'wind_crystal',
    name:        '바람의 수정',
    description: '투사체 속도 +30%',
    rarity:      'common',
    maxCount:    1,
    effects:     [{ stat: 'projectileSpeedMult', value: 0.30 }],
  },
  {
    id:          'arcane_prism',
    name:        '비전 프리즘',
    description: '투사체 크기 +25%',
    rarity:      'rare',
    maxCount:    1,
    effects:     [{ stat: 'projectileSizeMult', value: 0.25 }],
  },
  {
    id:          'scholars_rune',
    name:        '학자의 룬',
    description: '경험치 획득 +30%',
    rarity:      'common',
    maxCount:    1,
    effects:     [{ stat: 'xpMult', value: 0.30 }],
  },
];

/** id로 장신구 데이터 조회 */
export function getAccessoryById(id) {
  return accessoryData.find(a => a.id === id) ?? null;
}

