/**
 * upgradeData.js — 업그레이드 선택지 정의
 *
 * MERGED:
 *   - Phase 2 Final: 슬롯 해금, 다중 투사체, 크리티컬 히트, 진화 무기 강화 추가
 *   - Phase 4: 신규 능력치(쿨다운, 투사체 속도/크기, 경험치 배율) 및 전용 장신구 유지
 */
export const upgradeData = [
  // ── 신규 무기 ────────────────────────────────────────────────────────────────
  { id: 'get_holy_aura',      type: 'weapon_new',     weaponId: 'holy_aura',      name: 'Holy Aura',      description: '주변에 신성한 오라 발동' },
  { id: 'get_lightning_ring', type: 'weapon_new',     weaponId: 'lightning_ring', name: 'Lightning Ring', description: '회전하는 전기 구체 획득' },
  { id: 'get_frost_nova',     type: 'weapon_new',     weaponId: 'frost_nova',     name: 'Frost Nova',     description: '냉기 폭발 획득' },
  { id: 'get_boomerang',      type: 'weapon_new',     weaponId: 'boomerang',      name: 'Boomerang',      description: '관통 부메랑 획득' },
  { id: 'get_chain_lightning',type: 'weapon_new',     weaponId: 'chain_lightning',name: '연쇄 번개',       description: '연쇄 번개 획득' },

  // ── 무기 강화 ────────────────────────────────────────────────────────────────
  {
    id: 'up_magic_bolt', type: 'weapon_upgrade', weaponId: 'magic_bolt',
    name: 'Magic Bolt +', description: '마법탄 데미지 +1, 쿨다운 감소',
    damageDelta: 1, cooldownMult: 0.92,
  },
  {
    id: 'up_holy_aura', type: 'weapon_upgrade', weaponId: 'holy_aura',
    name: 'Holy Aura +', description: '오라 데미지 +1, 범위 확대',
    damageDelta: 1, cooldownMult: 0.92, orbitRadiusDelta: 8,
  },
  {
    id: 'up_lightning_ring', type: 'weapon_upgrade', weaponId: 'lightning_ring',
    name: 'Lightning Ring +', description: '전기 구체 데미지 +1',
    damageDelta: 1, cooldownMult: 0.95,
  },
  {
    id: 'up_frost_nova', type: 'weapon_upgrade', weaponId: 'frost_nova',
    name: 'Frost Nova +', description: '냉기 폭발 데미지 +2',
    damageDelta: 2, cooldownMult: 0.92,
  },
  {
    id: 'up_boomerang', type: 'weapon_upgrade', weaponId: 'boomerang',
    name: 'Boomerang +', description: '부메랑 데미지 +1, 관통 +1',
    damageDelta: 1, cooldownMult: 0.95, pierceDelta: 1,
  },
  {
    id: 'up_chain_lightning', type: 'weapon_upgrade', weaponId: 'chain_lightning',
    name: '연쇄 번개 +', description: '번개 데미지 +2, 연쇄 +1',
    damageDelta: 2, cooldownMult: 0.93,
  },

  // ── 다중 투사체 강화 (Patch) ─────────────────────────────────────────────────
  {
    id: 'up_magic_bolt_multishot', type: 'weapon_upgrade', weaponId: 'magic_bolt',
    name: 'Magic Bolt 다중 발사',
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

  // ── 진화 무기 강화 (Patch) ───────────────────────────────────────────────────
  {
    id: 'up_arcane_nova_plus', type: 'weapon_upgrade', weaponId: 'arcane_nova',
    name: 'Arcane Nova +', description: 'Nova 데미지 +2, 발사 수 +2',
    damageDelta: 2, cooldownMult: 0.92,
    projectileCountDelta: 2,
  },
  {
    id: 'up_storm_crown_plus', type: 'weapon_upgrade', weaponId: 'storm_crown',
    name: 'Storm Crown +', description: 'Storm Crown 데미지 +2',
    damageDelta: 2, cooldownMult: 0.95,
  },
  {
    id: 'up_divine_shield_plus', type: 'weapon_upgrade', weaponId: 'divine_shield',
    name: 'Divine Shield +', description: 'Shield 데미지 +3, 범위 확대',
    damageDelta: 3, cooldownMult: 0.92, orbitRadiusDelta: 12,
  },
  {
    id: 'up_infinity_blade_plus', type: 'weapon_upgrade', weaponId: 'infinity_blade',
    name: 'Infinity Blade +', description: 'Blade 데미지 +5, 관통 +3',
    damageDelta: 5, cooldownMult: 0.92, pierceDelta: 3,
  },
  {
    id: 'up_blizzard_nova_plus', type: 'weapon_upgrade', weaponId: 'blizzard_nova',
    name: 'Blizzard Nova +', description: 'Nova 데미지 +2, 범위 확대',
    damageDelta: 2, cooldownMult: 0.92, orbitRadiusDelta: 15,
  },

  // ── 스탯 업그레이드 ──────────────────────────────────────────────────────────
  { id: 'stat_speed',     type: 'stat', name: '이동 속도 +',  description: '이동 속도 +20',        effect: { stat: 'moveSpeed',    value: 20   }, maxCount: 5 },
  { id: 'stat_maxhp',     type: 'stat', name: '최대 HP +',    description: '최대 HP +20',          effect: { stat: 'maxHp',        value: 20   }, maxCount: 5 },
  { id: 'stat_magnet',    type: 'stat', name: '자석 반경 +',  description: '픽업 흡수 범위 +30',  effect: { stat: 'magnetRadius', value: 30   }, maxCount: 5 },
  { id: 'stat_lifesteal', type: 'stat', name: '흡혈 +',       description: '공격 피해의 5% 회복', effect: { stat: 'lifesteal',    value: 0.05 }, maxCount: 5 },
  { id: 'stat_heal',      type: 'stat', name: 'HP 회복',      description: '현재 HP +25 즉시 회복', effect: { stat: 'hp',          value: 25   } },

  // ── 신규 스탯 업그레이드 (Phase 4 유지) ─────────────────────────────────────────
  {
    id: 'stat_cooldown',  type: 'stat', name: '쿨다운 단축',
    description: '무기 쿨다운 8% 단축',
    effect: { stat: 'cooldownMult', value: -0.08 },
    maxCount: 5,
  },
  {
    id: 'stat_projspeed', type: 'stat', name: '투사체 속도 +',
    description: '투사체 속도 +10%',
    effect: { stat: 'projectileSpeedMult', value: 0.10 },
    maxCount: 5,
  },
  {
    id: 'stat_projsize',  type: 'stat', name: '투사체 크기 +',
    description: '투사체 크기 및 범위 +10%',
    effect: { stat: 'projectileSizeMult', value: 0.10 },
    maxCount: 5,
  },
  {
    id: 'stat_xpgain',    type: 'stat', name: '경험치 획득 +',
    description: '경험치 획득량 +15%',
    effect: { stat: 'xpMult', value: 0.15 },
    maxCount: 5,
  },

  // ── 크리티컬 스탯 강화 (Patch) ────────────────────────────────────────────────
  {
    id: 'stat_crit_chance', type: 'stat', name: '크리티컬 확률 +',
    description: '크리티컬 확률 +5%',
    effect: { stat: 'critChance', value: 0.05 }, maxCount: 5,
  },
  {
    id: 'stat_crit_multi', type: 'stat', name: '크리티컬 피해 +',
    description: '크리티컬 피해 배율 +25%',
    effect: { stat: 'critMultiplier', value: 0.25 }, maxCount: 4,
  },

  // ── 슬롯 해금 (Patch) ────────────────────────────────────────────────────────
  {
    id: 'slot_weapon', type: 'slot', slotType: 'weapon',
    name: '⚔ 무기 슬롯 해금',
    description: '무기 슬롯 +1 (최대 4개)',
    maxCount: 2,
  },
  {
    id: 'slot_accessory', type: 'slot', slotType: 'accessory',
    name: '💍 장신구 슬롯 해금',
    description: '장신구 슬롯 +1 (최대 2개)',
    maxCount: 2,
  },

  // ── 장신구 ────────────────────────────────────────────────────────────────────
  { id: 'acc_ring_of_speed',   type: 'accessory', accessoryId: 'ring_of_speed',   name: '속도의 반지',   description: '이동 속도 +30' },
  { id: 'acc_iron_heart',      type: 'accessory', accessoryId: 'iron_heart',      name: '강철 심장',     description: '최대 HP +40' },
  { id: 'acc_magnet_stone',    type: 'accessory', accessoryId: 'magnet_stone',    name: '자석석',        description: '픽업 흡수 범위 +50' },
  { id: 'acc_vampiric_amulet', type: 'accessory', accessoryId: 'vampiric_amulet', name: '흡혈 부적',     description: '흡혈 +8%, 최대 HP +20' },
  { id: 'acc_tome_of_power',   type: 'accessory', accessoryId: 'tome_of_power',   name: '마력의 서',     description: '모든 무기 데미지 +20%' },
  { id: 'acc_shadow_cloak',    type: 'accessory', accessoryId: 'shadow_cloak',    name: '그림자 망토',   description: '이동 속도 +20, 무적 시간 +0.3초' },
  { id: 'acc_warrior_belt',    type: 'accessory', accessoryId: 'warrior_belt',    name: '전사의 허리띠', description: '최대 HP +25, 이동 속도 +10' },
  { id: 'acc_crystal_lens',    type: 'accessory', accessoryId: 'crystal_lens',    name: '수정 렌즈',     description: '픽업 흡수 범위 +30, 흡혈 +4%' },

  // ── Phase 4 장신구 유지 ───────────────────────────────────────────────────────
  { id: 'acc_swift_hourglass', type: 'accessory', accessoryId: 'swift_hourglass', name: '쾌속 모래시계',  description: '무기 쿨다운 20% 단축' },
  { id: 'acc_wind_crystal',    type: 'accessory', accessoryId: 'wind_crystal',    name: '바람의 수정',    description: '투사체 속도 +30%' },
  { id: 'acc_arcane_prism',    type: 'accessory', accessoryId: 'arcane_prism',    name: '비전 프리즘',    description: '투사체 크기 +25%' },
  { id: 'acc_scholars_rune',   type: 'accessory', accessoryId: 'scholars_rune',   name: '학자의 룬',      description: '경험치 획득 +30%' },

  // ── Patch 장신구 추가 ─────────────────────────────────────────────────────────
  { id: 'acc_scattered_shot',  type: 'accessory', accessoryId: 'scattered_shot',  name: '산탄 마법진',   description: '모든 직선 무기 투사체 +1발' },
  { id: 'acc_crit_gem',        type: 'accessory', accessoryId: 'crit_gem',        name: '크리티컬 보석', description: '크리티컬 확률 +10%, 크리티컬 피해 +30%' },
  { id: 'acc_executioner_ring',type: 'accessory', accessoryId: 'executioner_ring',name: '처형자의 반지', description: '크리티컬 피해 +50%, HP +15' },
];
