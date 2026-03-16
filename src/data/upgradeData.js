/**
 * upgradeData.js — 업그레이드 선택지 정의
 *
 * weapon_upgrade 타입은 damageDelta / cooldownMult 필드로
 * 강화 수치를 데이터에 명시한다 (UpgradeSystem 하드코딩 제거).
 */
export const upgradeData = [
  // ── 신규 무기 ────────────────────────────────────────────────
  { id: 'get_holy_aura',      type: 'weapon_new',     weaponId: 'holy_aura',      name: 'Holy Aura',      description: '주변에 신성한 오라 발동' },
  { id: 'get_lightning_ring', type: 'weapon_new',     weaponId: 'lightning_ring', name: 'Lightning Ring', description: '회전하는 전기 구체 획득' },
  { id: 'get_frost_nova',     type: 'weapon_new',     weaponId: 'frost_nova',     name: 'Frost Nova',     description: '냉기 폭발 획득' },
  { id: 'get_boomerang',      type: 'weapon_new',     weaponId: 'boomerang',      name: 'Boomerang',      description: '관통 부메랑 획득' },

  // ── 무기 강화 ────────────────────────────────────────────────
  // damageDelta: 레벨업 시 damage 증가량
  // cooldownMult: 레벨업 시 cooldown 곱연산 (0.92 = 8% 감소)
  // orbitRadiusDelta: orbit 무기 전용 반경 증가량
  // pierceDelta: pierce 증가량 (orbit/areaBurst 제외)
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

  // ── 스탯 업그레이드 ──────────────────────────────────────────
  { id: 'stat_speed',     type: 'stat', name: '이동 속도 +',  description: '이동 속도 +20',        effect: { stat: 'moveSpeed',    value: 20   }, maxCount: 5 },
  { id: 'stat_maxhp',     type: 'stat', name: '최대 HP +',    description: '최대 HP +20',          effect: { stat: 'maxHp',        value: 20   }, maxCount: 5 },
  { id: 'stat_magnet',    type: 'stat', name: '자석 반경 +',  description: '픽업 흡수 범위 +30',  effect: { stat: 'magnetRadius', value: 30   }, maxCount: 4 },
  { id: 'stat_lifesteal', type: 'stat', name: '흡혈 +',       description: '공격 피해의 5% 회복', effect: { stat: 'lifesteal',    value: 0.05 }, maxCount: 4 },
  { id: 'stat_heal',      type: 'stat', name: 'HP 회복',      description: '현재 HP +25 즉시 회복', effect: { stat: 'hp',          value: 25   } },
];
