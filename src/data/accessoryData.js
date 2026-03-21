/**
 * accessoryData.js — 장신구 정의
 *
 * CHANGE: coin_pendant 추가 — 골드 획득량 +30% (rare)
 * CHANGE: buildAccessoryLevelDesc / buildAccessoryShortDesc 헬퍼 추가
 *   뱀파이어 서바이버 스타일로 레벨별 효과를 표시한다.
 */

// ── 레벨별 설명 생성 내부 유틸 ───────────────────────────────────────────────

const _STAT_LABELS = {
  moveSpeed:            '이동 속도',
  maxHp:                '최대 HP',
  lifesteal:            '흡혈',
  magnetRadius:         '자석 범위',
  damageMult:           '데미지',
  cooldownMult:         '쿨다운 단축',
  projectileSpeedMult:  '투사체 속도',
  projectileSizeMult:   '투사체 크기',
  xpMult:               '경험치 획득',
  critChance:           '크리티컬 확률',
  critMultiplier:       '크리티컬 피해',
  bonusProjectileCount: '추가 투사체',
  invincibleDuration:   '무적 시간',
  currencyMult:         '골드 획득',
};

function _formatStatVal(stat, value) {
  switch (stat) {
    case 'damageMult':
      return `+${Math.round(value * 100)}%`;
    case 'cooldownMult':
      return `-${Math.round(Math.abs(value) * 100)}%`;
    case 'lifesteal':
    case 'critChance':
    case 'critMultiplier':
    case 'projectileSpeedMult':
    case 'projectileSizeMult':
    case 'xpMult':
    case 'currencyMult':
      return `+${Math.round(value * 100)}%`;
    case 'bonusProjectileCount':
      return `+${value}발`;
    case 'invincibleDuration':
      return `+${value.toFixed(1)}초`;
    default:
      return `+${Math.round(value)}`;
  }
}

function _calcEffectAtLevel(effect, level) {
  const perLv = effect.valuePerLevel ?? 0;
  if (effect.stat === 'damageMult') {
    return (effect.value - 1) + perLv * (level - 1);
  }
  if (effect.stat === 'cooldownMult') {
    return Math.abs(effect.value) + Math.abs(perLv) * (level - 1);
  }
  return effect.value + perLv * (level - 1);
}

/**
 * 장신구의 레벨별 효과 전체 설명 문자열 반환.
 *
 * 예시: "이동 속도  Lv1 +30 → Lv2 +36 → Lv3 +42 → Lv4 +48 → Lv5 +54"
 *
 * @param {object} accDef  accessoryData 항목
 * @returns {string[]}  효과별 라인 배열
 */
export function buildAccessoryLevelDesc(accDef) {
  if (!accDef?.effects?.length) return [accDef?.description ?? ''];

  const maxLevel = accDef.maxLevel ?? 5;
  return accDef.effects.map(effect => {
    const label = _STAT_LABELS[effect.stat] ?? effect.stat;
    const parts = [];
    for (let lv = 1; lv <= maxLevel; lv++) {
      const val = _calcEffectAtLevel(effect, lv);
      parts.push(`Lv${lv} ${_formatStatVal(effect.stat, val)}`);
    }
    return `${label}  ${parts.join(' → ')}`;
  });
}

/**
 * 현재 레벨 기준 "현재 → 다음 레벨" 간단 설명 반환.
 * PauseView 카드의 한 줄 설명에 사용.
 *
 * 예시 (Lv1):  "이동 속도 +30 → Lv2: +36"
 * 예시 (MAX):  "이동 속도 +54 (MAX)"
 *
 * @param {object} accDef
 * @param {number} currentLevel  1-based
 * @returns {string[]}  효과별 라인 배열
 */
export function buildAccessoryShortDesc(accDef, currentLevel = 1) {
  if (!accDef?.effects?.length) return [accDef?.description ?? ''];

  const maxLevel = accDef.maxLevel ?? 5;
  return accDef.effects.map(effect => {
    const label  = _STAT_LABELS[effect.stat] ?? effect.stat;
    const curVal = _calcEffectAtLevel(effect, currentLevel);
    const curStr = _formatStatVal(effect.stat, curVal);

    if (currentLevel >= maxLevel) {
      return `${label}  ${curStr} (MAX)`;
    }
    const nxtVal = _calcEffectAtLevel(effect, currentLevel + 1);
    const nxtStr = _formatStatVal(effect.stat, nxtVal);
    return `${label}  ${curStr} → Lv${currentLevel + 1}: ${nxtStr}`;
  });
}

// ── 장신구 데이터 ─────────────────────────────────────────────────────────────

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
