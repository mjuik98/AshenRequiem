/**
 * weaponData.js — 무기 정의
 *
 * 단위: cooldown(초), damage(정수), projectileSpeed(px/s), range(px), radius(px)
 * statusEffectId: statusEffectData.js의 id (없으면 null)
 * statusEffectChance: 0.0~1.0 (발동 확률)
 * behaviorId: 'targetProjectile' | 'areaBurst' | 'orbit'
 */
export const weaponData = [
  {
    id: 'magic_bolt',
    name: 'Magic Bolt',
    description: '가장 가까운 적을 향해 마법탄 발사',
    damage: 2, cooldown: 0.8, projectileSpeed: 350, range: 400,
    radius: 5, pierce: 1, projectileColor: '#ffee58',
    behaviorId: 'targetProjectile', maxLevel: 5,
    statusEffectId: 'slow', statusEffectChance: 0.3,
  },
  {
    id: 'holy_aura',
    name: 'Holy Aura',
    description: '주변 적에게 지속 데미지',
    damage: 1, cooldown: 1.0, range: 80, radius: 80,
    projectileSpeed: 0, pierce: 999, projectileColor: '#ffd54f',
    behaviorId: 'areaBurst', maxLevel: 5,
    statusEffectId: 'poison', statusEffectChance: 0.2,
  },
  {
    id: 'lightning_ring',
    name: 'Lightning Ring',
    description: '플레이어 주위를 회전하는 전기 구체',
    damage: 3, cooldown: 3.5,
    radius: 9, pierce: 999,
    projectileColor: '#40c4ff',
    behaviorId: 'orbit', maxLevel: 5,
    orbitCount: 3,
    orbitRadius: 72,
    orbitSpeed: 2.8,
    statusEffectId: 'stun', statusEffectChance: 0.25,
  },
  {
    id: 'frost_nova',
    name: 'Frost Nova',
    description: '주변에 냉기 폭발 — 적을 얼린다',
    damage: 2, cooldown: 2.0, range: 100, radius: 100,
    projectileSpeed: 0, pierce: 999, projectileColor: '#80deea',
    behaviorId: 'areaBurst', maxLevel: 5,
    statusEffectId: 'stun', statusEffectChance: 0.6,
  },
  {
    id: 'boomerang',
    name: 'Boomerang',
    description: '가까운 적을 향해 느리지만 관통력 높은 부메랑 발사',
    damage: 4, cooldown: 1.4, projectileSpeed: 240, range: 450,
    radius: 8, pierce: 5,
    projectileColor: '#ffab40',
    behaviorId: 'targetProjectile', maxLevel: 5,
    statusEffectId: null, statusEffectChance: 0,
  },
];

/** id로 무기 데이터 조회 */
export function getWeaponDataById(id) {
  return weaponData.find(w => w.id === id) || null;
}
