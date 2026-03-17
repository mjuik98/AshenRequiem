/**
 * weaponData.js — 무기 정의
 */
export const weaponData = [
  {
    id: 'magic_bolt', name: 'Magic Bolt',
    description: '가장 가까운 적을 향해 마법탄 발사',
    damage: 2, cooldown: 0.8, projectileSpeed: 350, range: 400,
    radius: 5, pierce: 1, projectileColor: '#ffee58',
    behaviorId: 'targetProjectile', maxLevel: 5,
    statusEffectId: 'slow', statusEffectChance: 0.15,
  },
  {
    id: 'holy_aura', name: 'Holy Aura',
    description: '주변 적에게 지속 데미지',
    damage: 2, cooldown: 0.8, range: 80, radius: 80,
    projectileSpeed: 0, pierce: 999, projectileColor: '#ffd54f',
    behaviorId: 'areaBurst', maxLevel: 5,
    burstDuration: 0.85,
    statusEffectId: 'poison', statusEffectChance: 0.2,
  },
  {
    id: 'lightning_ring', name: 'Lightning Ring',
    description: '플레이어 주위를 회전하는 전기 구체',
    damage: 3, cooldown: 3.5, radius: 9, pierce: 999,
    projectileColor: '#40c4ff',
    behaviorId: 'orbit', maxLevel: 5,
    orbitCount: 3, orbitRadius: 72, orbitSpeed: 2.8,
    statusEffectId: 'stun', statusEffectChance: 0.25,
  },
  {
    id: 'frost_nova', name: 'Frost Nova',
    description: '주변에 냉기 폭발 — 적을 얼린다',
    damage: 2, cooldown: 2.0, range: 100, radius: 100,
    projectileSpeed: 0, pierce: 999, projectileColor: '#80deea',
    behaviorId: 'areaBurst', maxLevel: 5,
    burstDuration: 0.6,
    statusEffectId: 'stun', statusEffectChance: 0.6,
  },
  {
    id: 'weapon_boomerang', name: '부메랑',
    description: '가까운 적을 향해 발사되며 돌아오는 관통 부메랑',
    damage: 8, cooldown: 1.4, projectileSpeed: 280, range: 400,
    radius: 10, pierce: 3, maxRange: 600, projectileColor: '#ffd54f',
    behaviorId: 'boomerang', maxLevel: 5,
  },
  {
    id: 'weapon_chain_lightning', name: '연쇄 번개',
    description: '가장 가까운 적에게 번개를 쏘아 연쇄적으로 타격',
    damage: 12, cooldown: 2.0, range: 350,
    chainCount: 3, chainRange: 120, radius: 12,
    projectileColor: '#b388ff',
    behaviorId: 'chainLightning', maxLevel: 5,
  },
];

/** id로 무기 데이터 조회 */
export function getWeaponDataById(id) {
  return weaponData.find(w => w.id === id) ?? null;
}
