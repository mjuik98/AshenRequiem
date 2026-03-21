/**
 * upgradeData.js — 업그레이드 선택지 정의
 *
 * CHANGE: 골드 획득 장신구 2종 추가
 *   - acc_coin_pendant    : 동전 목걸이 획득
 *   - acc_greed_amulet   : 탐욕의 부적 획득
 *   - up_coin_pendant    : 동전 목걸이 강화
 *   - up_greed_amulet    : 탐욕의 부적 강화
 */
export const upgradeData = [
  // ── 신규 무기 ────────────────────────────────────────────────────────────────
  { id: 'get_holy_aura',      type: 'weapon_new',     weaponId: 'holy_aura',      name: '성스러운 오라',      description: '주변에 신성한 오라 발동' },
  { id: 'get_lightning_ring', type: 'weapon_new',     weaponId: 'lightning_ring', name: '번개의 고리', description: '회전하는 전기 구체 획득' },
  { id: 'get_frost_nova',     type: 'weapon_new',     weaponId: 'frost_nova',     name: '냉기 폭발',     description: '냉기 폭발 획득' },
  { id: 'get_boomerang',      type: 'weapon_new',     weaponId: 'boomerang',      name: '부메랑',      description: '관통 부메랑 획득' },
  { id: 'get_chain_lightning',type: 'weapon_new',     weaponId: 'chain_lightning',name: '연쇄 번개',       description: '연쇄 번개 획득' },

  // ── 무기 강화 ────────────────────────────────────────────────────────────────
  {
    id: 'up_magic_bolt', type: 'weapon_upgrade', weaponId: 'magic_bolt',
    name: '마법탄 +', description: '마법탄 데미지 +1, 쿨다운 감소',
    damageDelta: 1, cooldownMult: 0.92,
  },
  {
    id: 'up_holy_aura', type: 'weapon_upgrade', weaponId: 'holy_aura',
    name: '성스러운 오라 +', description: '오라 데미지 +1, 범위 확대',
    damageDelta: 1, cooldownMult: 0.92, orbitRadiusDelta: 8,
  },
  {
    id: 'up_lightning_ring', type: 'weapon_upgrade', weaponId: 'lightning_ring',
    name: '번개의 고리 +', description: '전기 구체 데미지 +1',
    damageDelta: 1, cooldownMult: 0.95,
  },
  {
    id: 'up_frost_nova', type: 'weapon_upgrade', weaponId: 'frost_nova',
    name: '냉기 폭발 +', description: '냉기 폭발 데미지 +2',
    damageDelta: 2, cooldownMult: 0.92,
  },
  {
    id: 'up_boomerang', type: 'weapon_upgrade', weaponId: 'boomerang',
    name: '부메랑 +', description: '부메랑 데미지 +1, 관통 +1',
    damageDelta: 1, cooldownMult: 0.95, pierceDelta: 1,
  },
  {
    id: 'up_chain_lightning', type: 'weapon_upgrade', weaponId: 'chain_lightning',
    name: '연쇄 번개 +', description: '번개 데미지 +2, 연쇄 +1',
    damageDelta: 2, cooldownMult: 0.93,
  },

  // ── 다중 투사체 강화 ─────────────────────────────────────────────────────────
  {
    id: 'up_magic_bolt_multishot', type: 'weapon_upgrade', weaponId: 'magic_bolt',
    name: '마법탄 다중 발사',
    description: '마법탄 동시 발사 수 +1 (최대 3발)',
    damageDelta: 0, cooldownMult: 1.0,
    projectileCountDelta: 1,
    skipLevelUp: true,
    maxCount: 2,
  },
  {
    id: 'up_boomerang_multishot', type: 'weapon_upgrade', weaponId: 'boomerang',
    name: 'Boomerang 다중 투척',
    description: '부메랑 동시 투척 수 +1 (최대 2개)',
    damageDelta: 0, cooldownMult: 1.0,
    projectileCountDelta: 1,
    skipLevelUp: true,
    maxCount: 1,
  },

  // ── 진화 무기 강화 ───────────────────────────────────────────────────────────
  {
    id: 'up_arcane_nova_plus', type: 'weapon_upgrade', weaponId: 'arcane_nova',
    name: '비전 폭발 +', description: 'Nova 데미지 +2, 발사 수 +2',
    damageDelta: 2, cooldownMult: 0.92,
    projectileCountDelta: 2,
  },
  {
    id: 'up_storm_crown_plus', type: 'weapon_upgrade', weaponId: 'storm_crown',
    name: '폭풍의 왕관 +', description: 'Storm Crown 데미지 +2',
    damageDelta: 2, cooldownMult: 0.95,
  },
  {
    id: 'up_divine_shield_plus', type: 'weapon_upgrade', weaponId: 'divine_shield',
    name: '신성한 방패 +', description: 'Shield 데미지 +3, 범위 확대',
    damageDelta: 3, cooldownMult: 0.92, orbitRadiusDelta: 12,
  },
  {
    id: 'up_infinity_blade_plus', type: 'weapon_upgrade', weaponId: 'infinity_blade',
    name: '무한의 칼날 +', description: 'Blade 데미지 +5, 관통 +3',
    damageDelta: 5, cooldownMult: 0.92, pierceDelta: 3,
  },
  {
    id: 'up_blizzard_nova_plus', type: 'weapon_upgrade', weaponId: 'blizzard_nova',
    name: '블리자드 노바 +', description: 'Nova 데미지 +2, 범위 확대',
    damageDelta: 2, cooldownMult: 0.92, orbitRadiusDelta: 15,
  },

  // ── HP 회복 (폴백 전용) ──────────────────────────────────────────────────────
  { id: 'stat_heal', type: 'stat', name: 'HP 회복', description: '현재 HP +25 즉시 회복', effect: { stat: 'hp', value: 25 } },

  // ── 장신구 획득 ────────────────────────────────────────────────────────────────
  { id: 'acc_ring_of_speed',   type: 'accessory', accessoryId: 'ring_of_speed',   name: '속도의 반지',   description: '이동 속도 +30' },
  { id: 'acc_iron_heart',      type: 'accessory', accessoryId: 'iron_heart',      name: '강철 심장',     description: '최대 HP +40' },
  { id: 'acc_magnet_stone',    type: 'accessory', accessoryId: 'magnet_stone',    name: '자석석',        description: '픽업 흡수 범위 +50' },
  { id: 'acc_vampiric_amulet', type: 'accessory', accessoryId: 'vampiric_amulet', name: '흡혈 부적',     description: '흡혈 +8%, 최대 HP +20' },
  { id: 'acc_tome_of_power',   type: 'accessory', accessoryId: 'tome_of_power',   name: '마력의 서',     description: '모든 무기 데미지 +20%' },
  { id: 'acc_shadow_cloak',    type: 'accessory', accessoryId: 'shadow_cloak',    name: '그림자 망토',   description: '이동 속도 +20, 무적 시간 +0.3초' },
  { id: 'acc_warrior_belt',    type: 'accessory', accessoryId: 'warrior_belt',    name: '전사의 허리띠', description: '최대 HP +25, 이동 속도 +10' },
  { id: 'acc_crystal_lens',    type: 'accessory', accessoryId: 'crystal_lens',    name: '수정 렌즈',     description: '픽업 흡수 범위 +30, 흡혈 +4%' },

  // ── Phase 4 장신구 ───────────────────────────────────────────────────────────
  { id: 'acc_swift_hourglass', type: 'accessory', accessoryId: 'swift_hourglass', name: '쾌속 모래시계',  description: '무기 쿨다운 20% 단축' },
  { id: 'acc_wind_crystal',    type: 'accessory', accessoryId: 'wind_crystal',    name: '바람의 수정',    description: '투사체 속도 +30%' },
  { id: 'acc_arcane_prism',    type: 'accessory', accessoryId: 'arcane_prism',    name: '비전 프리즘',    description: '투사체 크기 +25%' },
  { id: 'acc_scholars_rune',   type: 'accessory', accessoryId: 'scholars_rune',   name: '학자의 룬',      description: '경험치 획득 +30%' },
  { id: 'acc_duplicator',      type: 'accessory', accessoryId: 'duplicator',      name: '복제기',        description: '모든 무기 투사체 수 +1' },

  // ── Patch 장신구 ─────────────────────────────────────────────────────────────
  { id: 'acc_scattered_shot',  type: 'accessory', accessoryId: 'scattered_shot',  name: '산탄 마법진',   description: '모든 직선 무기 투사체 +1발' },
  { id: 'acc_crit_gem',        type: 'accessory', accessoryId: 'crit_gem',        name: '크리티컬 보석', description: '크리티컬 확률 +10%, 크리티컬 피해 +30%' },
  { id: 'acc_executioner_ring',type: 'accessory', accessoryId: 'executioner_ring',name: '처형자의 반지', description: '크리티컬 피해 +50%, HP +15' },

  // ── 골드 획득 장신구 (신규) ───────────────────────────────────────────────────
  { id: 'acc_coin_pendant',   type: 'accessory', accessoryId: 'coin_pendant',   name: '동전 목걸이',  description: '골드 획득량 +30%' },
  { id: 'acc_greed_amulet',   type: 'accessory', accessoryId: 'greed_amulet',   name: '탐욕의 부적', description: '골드 획득량 +50%, 픽업 범위 +20' },

  // ── 장신구 강화 ────────────────────────────────────────────────────────────────
  { id: 'up_ring_of_speed',    type: 'accessory_upgrade', accessoryId: 'ring_of_speed',    name: '속도의 반지 +',    description: '효과 강화' },
  { id: 'up_iron_heart',       type: 'accessory_upgrade', accessoryId: 'iron_heart',       name: '강철 심장 +',      description: '효과 강화' },
  { id: 'up_magnet_stone',     type: 'accessory_upgrade', accessoryId: 'magnet_stone',     name: '자석석 +',         description: '효과 강화' },
  { id: 'up_vampiric_amulet',  type: 'accessory_upgrade', accessoryId: 'vampiric_amulet',  name: '흡혈 부적 +',      description: '효과 강화' },
  { id: 'up_tome_of_power',    type: 'accessory_upgrade', accessoryId: 'tome_of_power',    name: '마력의 서 +',      description: '효과 강화' },
  { id: 'up_shadow_cloak',     type: 'accessory_upgrade', accessoryId: 'shadow_cloak',     name: '그림자 망토 +',    description: '효과 강화' },
  { id: 'up_warrior_belt',     type: 'accessory_upgrade', accessoryId: 'warrior_belt',     name: '전사의 허리띠 +',  description: '효과 강화' },
  { id: 'up_crystal_lens',     type: 'accessory_upgrade', accessoryId: 'crystal_lens',     name: '수정 렌즈 +',      description: '효과 강화' },
  { id: 'up_swift_hourglass',  type: 'accessory_upgrade', accessoryId: 'swift_hourglass',  name: '쾌속 모래시계 +',  description: '효과 강화' },
  { id: 'up_wind_crystal',     type: 'accessory_upgrade', accessoryId: 'wind_crystal',     name: '바람의 수정 +',    description: '효과 강화' },
  { id: 'up_arcane_prism',     type: 'accessory_upgrade', accessoryId: 'arcane_prism',     name: '비전 프리즘 +',    description: '효과 강화' },
  { id: 'up_scholars_rune',    type: 'accessory_upgrade', accessoryId: 'scholars_rune',    name: '학자의 룬 +',      description: '효과 강화' },
  { id: 'up_duplicator',       type: 'accessory_upgrade', accessoryId: 'duplicator',       name: '복제기 +',        description: '효과 강화' },
  { id: 'up_scattered_shot',   type: 'accessory_upgrade', accessoryId: 'scattered_shot',   name: '산탄 마법진 +',    description: '효과 강화' },
  { id: 'up_crit_gem',         type: 'accessory_upgrade', accessoryId: 'crit_gem',         name: '크리티컬 보석 +',  description: '효과 강화' },
  { id: 'up_executioner_ring', type: 'accessory_upgrade', accessoryId: 'executioner_ring', name: '처형자의 반지 +',  description: '효과 강화' },
  // 골드 장신구 강화
  { id: 'up_coin_pendant',     type: 'accessory_upgrade', accessoryId: 'coin_pendant',     name: '동전 목걸이 +',    description: '효과 강화' },
  { id: 'up_greed_amulet',     type: 'accessory_upgrade', accessoryId: 'greed_amulet',     name: '탐욕의 부적 +',   description: '효과 강화' },
];
