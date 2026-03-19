/**
 * weaponData.js — 무기 정의
 *
 * BUGFIX:
 *   BUG-6: 오라형 무기(holy_aura, frost_nova)에 orbitsPlayer: true 추가
 *
 *     Before (버그): 오라 무기 투사체가 발사 위치에 고정 → 이동 중 공백 발생
 *     After (수정):  orbitsPlayer: true → ProjectileSystem이 매 프레임 위치 동기화
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
    // FIX(BUG-6): 오라형 무기는 플레이어 위치를 따라가야 함
    orbitsPlayer: true,
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
    // FIX(BUG-6): frost_nova도 플레이어 주변 오라이므로 orbitsPlayer 적용
    // NOTE: 단발 폭발형이므로 orbitsPlayer 없이 고정 위치도 가능하나
    //       짧은 지속시간(0.6s) 동안 이동 중에도 피해가 유지되도록 true 설정
    orbitsPlayer: true,
  },
  {
    id: 'boomerang', name: '부메랑',
    description: '가까운 적을 향해 발사되며 돌아오는 관통 부메랑',
    damage: 8, cooldown: 1.4, projectileSpeed: 280, range: 400,
    radius: 10, pierce: 3, maxRange: 600, projectileColor: '#ffd54f',
    behaviorId: 'boomerang', maxLevel: 5,
  },
  {
    id: 'chain_lightning', name: '연쇄 번개',
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
