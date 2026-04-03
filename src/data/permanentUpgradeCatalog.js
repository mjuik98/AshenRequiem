export const permanentUpgradeData = [

  // ── 기본 스탯 ──────────────────────────────────────────────────────────────
  {
    id:           'perm_hp',
    name:         '강인한 체질',
    description:  '최대 HP +10',
    icon:         '❤',
    maxLevel:     10,
    costPerLevel: (level) => 10 + level * 5,
    effect:       { stat: 'maxHp', valuePerLevel: 10 },
  },
  {
    id:           'perm_speed',
    name:         '민첩한 발걸음',
    description:  '이동 속도 +5',
    icon:         '💨',
    maxLevel:     8,
    costPerLevel: (level) => 15 + level * 8,
    effect:       { stat: 'moveSpeed', valuePerLevel: 5 },
  },
  {
    id:           'perm_damage',
    name:         '전투 숙련',
    description:  '모든 무기 데미지 +5%',
    icon:         '⚔',
    maxLevel:     5,
    costPerLevel: (level) => 30 + level * 15,
    effect:       { stat: 'damageMult', valuePerLevel: 0.05 },
  },
  {
    id:           'perm_magnet',
    name:         '넓은 손',
    description:  '픽업 흡수 범위 +15',
    icon:         '🧲',
    maxLevel:     6,
    costPerLevel: (level) => 12 + level * 6,
    effect:       { stat: 'magnetRadius', valuePerLevel: 15 },
  },
  {
    id:           'perm_lifesteal',
    name:         '흡혈 각성',
    description:  '흡혈 +3%',
    icon:         '🩸',
    maxLevel:     5,
    costPerLevel: (level) => 25 + level * 12,
    effect:       { stat: 'lifesteal', valuePerLevel: 0.03 },
  },

  // ── 크리티컬 ──────────────────────────────────────────────────────────────
  {
    id:           'perm_crit_chance',
    name:         '예리한 감각',
    description:  '크리티컬 확률 +2%',
    icon:         '🎯',
    maxLevel:     8,
    costPerLevel: (level) => 20 + level * 10,
    effect:       { stat: 'critChance', valuePerLevel: 0.02 },
  },
  {
    id:           'perm_crit_multi',
    name:         '치명적 일격',
    description:  '크리티컬 피해 배율 +15%',
    icon:         '💥',
    maxLevel:     6,
    costPerLevel: (level) => 28 + level * 14,
    effect:       { stat: 'critMultiplier', valuePerLevel: 0.15 },
  },

  // ── 투사체 ────────────────────────────────────────────────────────────────
  {
    id:           'perm_proj_speed',
    name:         '가속의 마법진',
    description:  '투사체 속도 +5%',
    icon:         '🔵',
    maxLevel:     6,
    costPerLevel: (level) => 18 + level * 9,
    effect:       { stat: 'projectileSpeedMult', valuePerLevel: 0.05 },
  },
  {
    id:           'perm_proj_size',
    name:         '확장의 룬',
    description:  '투사체 크기/범위 +5%',
    icon:         '🌊',
    maxLevel:     6,
    costPerLevel: (level) => 18 + level * 9,
    effect:       { stat: 'projectileSizeMult', valuePerLevel: 0.05 },
  },

  // ── 배율 스탯 ────────────────────────────────────────────────────────────
  {
    id:           'perm_cooldown',
    name:         '빠른 손놀림',
    description:  '무기 쿨다운 -4%',
    icon:         '⚡',
    maxLevel:     8,
    costPerLevel: (level) => 22 + level * 11,
    effect:       { stat: 'cooldownMult', valuePerLevel: -0.04 },
  },
  {
    id:           'perm_xp',
    name:         '지식 흡수',
    description:  '경험치 획득 +10%',
    icon:         '📚',
    maxLevel:     6,
    costPerLevel: (level) => 15 + level * 7,
    effect:       { stat: 'xpMult', valuePerLevel: 0.10 },
  },

  // ── 골드 ─────────────────────────────────────────────────────────────────
  {
    id:           'perm_currency',
    name:         '탐욕의 기운',
    description:  '골드 획득량 +10%',
    icon:         '💰',
    maxLevel:     8,
    costPerLevel: (level) => 18 + level * 9,
    effect:       { stat: 'currencyMult', valuePerLevel: 0.10 },
  },
  {
    id:           'perm_curse',
    name:         '불길한 계약',
    description:  '저주 +10%',
    icon:         '☠',
    maxLevel:     10,
    costPerLevel: (level) => 26 + level * 14,
    effect:       { stat: 'curse', valuePerLevel: 0.10 },
  },
  {
    id:           'perm_projectile_lifetime',
    name:         '시간 연장',
    description:  '투사체 지속시간 +10%',
    icon:         '⌛',
    maxLevel:     5,
    costPerLevel: (level) => 24 + level * 12,
    effect:       { stat: 'projectileLifetimeMult', valuePerLevel: 0.10 },
  },

  // ── 슬롯 확장 ──────────────────────────────────────────────────────────────
  {
    id:           'perm_weapon_slot',
    name:         '무기 슬롯 확장',
    description:  '최대 보유 가능 무기 수 +1',
    icon:         '⚔',
    maxLevel:     3,
    costPerLevel: (level) => 100 + level * 100,
    effect:       { stat: 'maxWeaponSlots', valuePerLevel: 1 },
  },
  {
    id:           'perm_accessory_slot',
    name:         '장신구 슬롯 확장',
    description:  '최대 보유 가능 장신구 수 +1',
    icon:         '💍',
    maxLevel:     3,
    costPerLevel: (level) => 80 + level * 80,
    effect:       { stat: 'maxAccessorySlots', valuePerLevel: 1 },
  },
  {
    id:           'perm_projectile_count',
    name:         '투사체 증가',
    description:  '모든 무기의 투사체 개수 +1',
    icon:         '🍀',
    maxLevel:     2,
    costPerLevel: (level) => 500 + level * 500,
    effect:       { stat: 'bonusProjectileCount', valuePerLevel: 1 },
  },
  {
    id:           'reroll_charge',
    name:         '전술 재편',
    description:  '레벨업 보상에서 카드 1장을 다시 뽑을 수 있는 횟수 +1',
    icon:         '🔁',
    maxLevel:     10,
    costPerLevel: (level) => 45 + level * 20,
    effect:       { stat: 'rerollCharge', valuePerLevel: 1 },
  },
  {
    id:           'banish_charge',
    name:         '추방의 인장',
    description:  '레벨업 보상에서 카드 1종을 이번 런 전체에서 봉인할 수 있는 횟수 +1',
    icon:         '🚫',
    maxLevel:     10,
    costPerLevel: (level) => 55 + level * 24,
    effect:       { stat: 'banishCharge', valuePerLevel: 1 },
  },
];

export function getPermanentUpgradeById(id) {
  return permanentUpgradeData.find((upgrade) => upgrade.id === id) ?? null;
}
