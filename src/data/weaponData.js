/**
 * weaponData.js — 무기 정의
 *
 * 단위: cooldown(초), damage(정수), projectileSpeed(px/s), range(px), radius(px)
 * statusEffectId: statusEffectData.js의 id (없으면 null)
 * statusEffectChance: 0.0~1.0 (발동 확률)
 */
export const weaponData = [
  {
    id: 'magic_bolt',
    name: 'Magic Bolt',
    description: '가장 가까운 적을 향해 마법탄 발사',
    damage: 2,
    cooldown: 0.8,
    projectileSpeed: 350,
    range: 400,
    radius: 5,
    pierce: 1,
    projectileColor: '#ffee58',
    behaviorId: 'targetProjectile',
    maxLevel: 5,
    statusEffectId: 'slow',
    statusEffectChance: 0.3,      // 30% 확률로 슬로우
  },
  {
    id: 'holy_aura',
    name: 'Holy Aura',
    description: '주변 적에게 지속 데미지',
    damage: 1,
    cooldown: 1.0,
    range: 80,
    radius: 80,
    projectileSpeed: 0,
    pierce: 999,
    projectileColor: '#ffd54f',
    behaviorId: 'areaBurst',
    maxLevel: 5,
    statusEffectId: 'poison',
    statusEffectChance: 0.2,      // 20% 확률로 독
  },
];

/** id로 무기 데이터 조회 */
export function getWeaponDataById(id) {
  return weaponData.find(w => w.id === id) || null;
}
