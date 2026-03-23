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
  projectileSizeMult:   '투사체 크기/범위',
  xpMult:               '경험치 획득',
  critChance:           '크리티컬 확률',
  critMultiplier:       '크리티컬 피해',
  bonusProjectileCount: '추가 투사체',
  invincibleDuration:   '무적 시간',
  currencyMult:         '골드 획득',
  projectileLifetimeMult:'투사체 지속시간',
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
    case 'projectileLifetimeMult':
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
 * 장신구 획득 시 표시할 Lv1 기준 설명.
 *
 * @param {object} accDef
 * @returns {string}
 */
export function buildAccessoryPickupDesc(accDef) {
  if (!accDef?.effects?.length) return accDef?.description ?? '';
  return accDef.effects.map(effect => {
    const label = _STAT_LABELS[effect.stat] ?? effect.stat;
    const value = _calcEffectAtLevel(effect, 1);
    return `${label} ${_formatStatVal(effect.stat, value)}`;
  }).join(', ');
}

/**
 * 장신구 레벨업 시 다음 단계 증가량을 설명한다.
 *
 * @param {object} accDef
 * @returns {string}
 */
export function buildAccessoryUpgradeDesc(accDef) {
  if (!accDef?.effects?.length) return accDef?.description ?? '';
  return accDef.effects.map(effect => {
    const label = _STAT_LABELS[effect.stat] ?? effect.stat;
    const delta = effect.stat === 'damageMult'
      ? (effect.valuePerLevel ?? 0)
      : effect.stat === 'cooldownMult'
      ? -(Math.abs(effect.valuePerLevel ?? 0))
      : (effect.valuePerLevel ?? 0);
    return `${label} ${_formatStatVal(effect.stat, delta)}`;
  }).join(', ');
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

/**
 * 현재 레벨 기준 효과만 간단히 보여준다.
 *
 * 예시: "이동 속도 +30", "데미지 +20%"
 *
 * @param {object} accDef
 * @param {number} currentLevel
 * @returns {string[]}
 */
export function buildAccessoryCurrentDesc(accDef, currentLevel = 1) {
  if (!accDef?.effects?.length) return [accDef?.description ?? ''];

  return accDef.effects.map(effect => {
    const label = _STAT_LABELS[effect.stat] ?? effect.stat;
    const curVal = _calcEffectAtLevel(effect, currentLevel);
    return `${label} ${_formatStatVal(effect.stat, curVal)}`;
  });
}

// ── 장신구 데이터 ─────────────────────────────────────────────────────────────

export const accessoryData = [
  // ── 기존 장신구 ──────────────────────────────────────────────────────────────
  {
    id:          'ring_of_speed',
    name:        '속도의 반지',
    icon:        '💨',
    description: '이동 속도 +10',
    rarity:      'common',
    maxLevel:    5,
    effects:     [{ stat: 'moveSpeed', value: 10, valuePerLevel: 10 }],
  },
  {
    id:          'iron_heart',
    name:        '강철 심장',
    icon:        '❤',
    description: '최대 HP +20',
    rarity:      'common',
    maxLevel:    5,
    effects:     [{ stat: 'maxHp', value: 20, valuePerLevel: 20 }],
  },
  {
    id:          'magnet_stone',
    name:        '자석석',
    icon:        '🧲',
    description: '픽업 흡수 범위 +20',
    rarity:      'common',
    maxLevel:    5,
    effects:     [{ stat: 'magnetRadius', value: 20, valuePerLevel: 20 }],
  },
  {
    id:          'vampiric_amulet',
    name:        '흡혈 부적',
    icon:        '🩸',
    description: '흡혈 +4%, 최대 HP +10',
    rarity:      'rare',
    maxLevel:    5,
    effects:     [
      { stat: 'lifesteal', value: 0.04, valuePerLevel: 0.04 },
      { stat: 'maxHp', value: 10, valuePerLevel: 10 },
    ],
  },
  {
    id:          'tome_of_power',
    name:        '마력의 서',
    icon:        '📘',
    description: '모든 무기 데미지 +10%',
    rarity:      'rare',
    maxLevel:    5,
    effects:     [{ stat: 'damageMult', value: 1.10, valuePerLevel: 0.10 }],
  },
  {
    id:          'shadow_cloak',
    name:        '그림자 망토',
    icon:        '🜚',
    description: '이동 속도 +10, 무적 시간 +0.1초',
    rarity:      'rare',
    maxLevel:    5,
    effects:     [
      { stat: 'moveSpeed', value: 10, valuePerLevel: 10 },
      { stat: 'invincibleDuration', value: 0.1, valuePerLevel: 0.1 },
    ],
  },
  {
    id:          'warrior_belt',
    name:        '전사의 허리띠',
    icon:        '⚔',
    description: '최대 HP +10, 이동 속도 +5',
    rarity:      'common',
    maxLevel:    5,
    effects:     [
      { stat: 'maxHp', value: 10, valuePerLevel: 10 },
      { stat: 'moveSpeed', value: 5, valuePerLevel: 5 },
    ],
  },
  {
    id:          'crystal_lens',
    name:        '수정 렌즈',
    icon:        '🔷',
    description: '픽업 흡수 범위 +10, 흡혈 +2%',
    rarity:      'rare',
    maxLevel:    5,
    effects:     [
      { stat: 'magnetRadius', value: 10, valuePerLevel: 10 },
      { stat: 'lifesteal', value: 0.02, valuePerLevel: 0.02 },
    ],
  },

  // ── 신규 장신구 ──────────────────────────────────────────────────────────────
  {
    id:          'swift_hourglass',
    name:        '쾌속 모래시계',
    icon:        '⌛',
    description: '무기 쿨다운 8% 단축',
    rarity:      'rare',
    maxLevel:    5,
    effects:     [{ stat: 'cooldownMult', value: -0.08, valuePerLevel: -0.08 }],
  },
  {
    id:          'wind_crystal',
    name:        '바람의 수정',
    icon:        '💠',
    description: '투사체 속도 +10%',
    rarity:      'common',
    maxLevel:    5,
    effects:     [{ stat: 'projectileSpeedMult', value: 0.10, valuePerLevel: 0.10 }],
  },
  {
    id:          'arcane_prism',
    name:        '비전 프리즘',
    icon:        '🔮',
    description: '투사체 크기/범위 +10%',
    rarity:      'rare',
    maxLevel:    5,
    effects:     [{ stat: 'projectileSizeMult', value: 0.10, valuePerLevel: 0.10 }],
  },
  {
    id:          'scholars_rune',
    name:        '학자의 룬',
    icon:        '✎',
    description: '경험치 획득 +10%',
    rarity:      'common',
    maxLevel:    5,
    effects:     [{ stat: 'xpMult', value: 0.10, valuePerLevel: 0.10 }],
  },
  {
    id:          'duplicator',
    name:        '복제기',
    icon:        '◌',
    description: '모든 무기 투사체 수 +1',
    rarity:      'rare',
    maxLevel:    5,
    effects:     [{ stat: 'bonusProjectileCount', value: 1, valuePerLevel: 1 }],
  },

  // ── Patch 장신구 ──────────────────────────────────────────────────────────────
  {
    id:          'scattered_shot',
    name:        '산탄 마법진',
    icon:        '✹',
    description: '모든 직선 무기 투사체 +1발',
    rarity:      'rare',
    maxLevel:    5,
    effects:     [{ stat: 'bonusProjectileCount', value: 1, valuePerLevel: 1 }],
  },
  {
    id:          'crit_gem',
    name:        '크리티컬 보석',
    icon:        '💎',
    description: '크리티컬 확률 +5%, 크리티컬 피해 +10%',
    rarity:      'rare',
    maxLevel:    5,
    effects:     [
      { stat: 'critChance', value: 0.05, valuePerLevel: 0.05 },
      { stat: 'critMultiplier', value: 0.10, valuePerLevel: 0.10 },
    ],
  },
  {
    id:          'executioner_ring',
    name:        '처형자의 반지',
    icon:        '☍',
    description: '크리티컬 피해 +10%, HP +10',
    rarity:      'rare',
    maxLevel:    5,
    effects:     [
      { stat: 'critMultiplier', value: 0.10, valuePerLevel: 0.10 },
      { stat: 'maxHp', value: 10, valuePerLevel: 10 },
    ],
  },

  // ── 골드 획득 장신구 (신규) ───────────────────────────────────────────────────
  {
    id:          'coin_pendant',
    name:        '동전 목걸이',
    icon:        '🪙',
    description: '골드 획득량 +10%',
    rarity:      'common',
    maxLevel:    5,
    effects:     [{ stat: 'currencyMult', value: 0.10, valuePerLevel: 0.10 }],
  },
  {
    id:          'greed_amulet',
    name:        '탐욕의 부적',
    icon:        '💰',
    description: '골드 획득량 +10%, 픽업 범위 +10',
    rarity:      'rare',
    maxLevel:    5,
    effects:     [
      { stat: 'currencyMult', value: 0.10, valuePerLevel: 0.10 },
      { stat: 'magnetRadius', value: 10,   valuePerLevel: 10   },
    ],
  },
  {
    id:          'persistence_charm',
    name:        '지속의 부적',
    icon:        '🕰',
    description: '투사체 지속시간 +10%',
    rarity:      'rare',
    maxLevel:    5,
    effects:     [{ stat: 'projectileLifetimeMult', value: 0.10, valuePerLevel: 0.10 }],
  },
];

/** id로 장신구 데이터 조회 */
export function getAccessoryById(id) {
  return accessoryData.find(a => a.id === id) ?? null;
}
