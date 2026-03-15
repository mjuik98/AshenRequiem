/**
 * weaponData.js — 무기 정의
 *
 * PATCH:
 *   [bug]  burstDuration 필드 추가 (areaBurst 무기 전용).
 *          WeaponSystem 의 maxLifetime: 0.3 하드코딩 제거.
 *          holy_aura / frost_nova 가 쿨다운에 맞는 지속시간을 갖도록 수정.
 *   [balance] holy_aura: damage 1 → 2, cooldown 1.0 → 0.8 (단독 실용 수준 향상).
 *   [balance] orbit lifetime 계수는 WeaponSystem 에서 1.02 로 수정 (orbit 공백 제거).
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
    // PATCH(balance): damage 1 → 2, cooldown 1.0 → 0.8, burstDuration 추가
    damage: 2, cooldown: 0.8, range: 80, radius: 80,
    projectileSpeed: 0, pierce: 999, projectileColor: '#ffd54f',
    behaviorId: 'areaBurst', maxLevel: 5,
    burstDuration: 0.5,   // PATCH: 시각적 지속 시간
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
    // orbit lifetime 계수는 WeaponSystem 에서 cooldown * 1.02 로 계산
  },
  {
    id: 'frost_nova',
    name: 'Frost Nova',
    description: '주변에 냉기 폭발 — 적을 얼린다',
    damage: 2, cooldown: 2.0, range: 100, radius: 100,
    projectileSpeed: 0, pierce: 999, projectileColor: '#80deea',
    behaviorId: 'areaBurst', maxLevel: 5,
    burstDuration: 0.6,   // PATCH: 2.0s 쿨다운에 걸맞는 지속 시간
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
  return weaponData.find(w => w.id === id) ?? null;
}
