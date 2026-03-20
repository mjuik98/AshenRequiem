/**
 * upgradeData.js — 업그레이드 선택지 정의
 *
 * CHANGE: 새 능력치 스탯 4종 추가
 *   - stat_cooldown    : 무기 쿨다운 감소
 *   - stat_projspeed   : 투사체 속도 증가
 *   - stat_projsize    : 투사체 크기(범위) 증가
 *   - stat_xpgain      : 경험치 획득량 증가
 *
 * CHANGE: 모든 stat maxCount를 5로 통일
 * CHANGE: 신규 장신구 4종 항목 추가
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

  // ── 스탯 업그레이드 ──────────────────────────────────────────────────────────
  {
    id: 'stat_speed',     type: 'stat', name: '이동 속도 +',
    description: '이동 속도 +20',
    effect: { stat: 'moveSpeed', value: 20 },
    maxCount: 5,
  },
  {
    id: 'stat_maxhp',     type: 'stat', name: '최대 HP +',
    description: '최대 HP +20',
    effect: { stat: 'maxHp', value: 20 },
    maxCount: 5,
  },
  {
    id: 'stat_magnet',    type: 'stat', name: '자석 반경 +',
    description: '픽업 흡수 범위 +30',
    effect: { stat: 'magnetRadius', value: 30 },
    maxCount: 5,
  },
  {
    id: 'stat_lifesteal', type: 'stat', name: '흡혈 +',
    description: '공격 피해의 5% 회복',
    effect: { stat: 'lifesteal', value: 0.05 },
    maxCount: 5,
  },
  {
    id: 'stat_heal',      type: 'stat', name: 'HP 회복',
    description: '현재 HP +25 즉시 회복',
    effect: { stat: 'hp', value: 25 },
  },

  // ── 신규 스탯 업그레이드 ─────────────────────────────────────────────────────
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

  // ── 장신구 ──────────────────────────────────────────────────────────────────
  { id: 'acc_ring_of_speed',   type: 'accessory', accessoryId: 'ring_of_speed',   name: '속도의 반지',    description: '이동 속도 +30' },
  { id: 'acc_iron_heart',      type: 'accessory', accessoryId: 'iron_heart',      name: '강철 심장',      description: '최대 HP +40' },
  { id: 'acc_magnet_stone',    type: 'accessory', accessoryId: 'magnet_stone',    name: '자석석',         description: '픽업 흡수 범위 +50' },
  { id: 'acc_vampiric_amulet', type: 'accessory', accessoryId: 'vampiric_amulet', name: '흡혈 부적',      description: '흡혈 +8%, 최대 HP +20' },
  { id: 'acc_tome_of_power',   type: 'accessory', accessoryId: 'tome_of_power',   name: '마력의 서',      description: '모든 무기 데미지 +20%' },
  { id: 'acc_shadow_cloak',    type: 'accessory', accessoryId: 'shadow_cloak',    name: '그림자 망토',    description: '이동 속도 +20, 무적 시간 +0.3초' },
  { id: 'acc_warrior_belt',    type: 'accessory', accessoryId: 'warrior_belt',    name: '전사의 허리띠',  description: '최대 HP +25, 이동 속도 +10' },
  { id: 'acc_crystal_lens',    type: 'accessory', accessoryId: 'crystal_lens',    name: '수정 렌즈',      description: '픽업 흡수 범위 +30, 흡혈 +4%' },
  // 신규
  { id: 'acc_swift_hourglass', type: 'accessory', accessoryId: 'swift_hourglass', name: '쾌속 모래시계',  description: '무기 쿨다운 20% 단축' },
  { id: 'acc_wind_crystal',    type: 'accessory', accessoryId: 'wind_crystal',    name: '바람의 수정',    description: '투사체 속도 +30%' },
  { id: 'acc_arcane_prism',    type: 'accessory', accessoryId: 'arcane_prism',    name: '비전 프리즘',    description: '투사체 크기 +25%' },
  { id: 'acc_scholars_rune',   type: 'accessory', accessoryId: 'scholars_rune',   name: '학자의 룬',      description: '경험치 획득 +30%' },
];

