/**
 * weaponData.js — 무기 정의
 *
 * MERGED:
 *   - Phase 2 Final: projectileCount 필드 추가, 진화 무기 5종 추가
 *   - Phase 4: orbitsPlayer 속성 등 버그 수정 사항 유지
 */
export const weaponData = [
  // ── 기본 무기 ──────────────────────────────────────────────────────────────
  {
    id: 'magic_bolt', name: 'Magic Bolt',
    description: '가장 가까운 적을 향해 마법탄 발사',
    damage: 2, cooldown: 0.8, projectileSpeed: 350, range: 400,
    radius: 5, pierce: 1, projectileColor: '#ffee58',
    projectileCount: 1,
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
    orbitsPlayer: true,
  },
  {
    id: 'boomerang', name: '부메랑',
    description: '가까운 적을 향해 발사되며 돌아오는 관통 부메랑',
    damage: 8, cooldown: 1.4, projectileSpeed: 280, range: 400,
    radius: 10, pierce: 3, maxRange: 600, projectileColor: '#ffd54f',
    projectileCount: 1,
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

  // ── 진화 무기 (isEvolved: true — WeaponEvolutionSystem에서만 획득 가능) ───────
  {
    id: 'arcane_nova', name: 'Arcane Nova',
    description: '360도 전방향 마법 폭발 — Magic Bolt의 최종 진화',
    damage: 8, cooldown: 1.2, projectileSpeed: 340, range: 460,
    radius: 7, pierce: 2, projectileColor: '#e040fb',
    projectileCount: 8,
    behaviorId: 'omnidirectional', maxLevel: 5,
    statusEffectId: 'slow', statusEffectChance: 0.35,
    isEvolved: true,
  },
  {
    id: 'storm_crown', name: 'Storm Crown',
    description: '5개 고속 번개 구체 회전 — Lightning Ring의 최종 진화',
    damage: 6, cooldown: 2.5, radius: 11, pierce: 999,
    projectileColor: '#00e5ff',
    behaviorId: 'orbit', maxLevel: 5,
    orbitCount: 5, orbitRadius: 92, orbitSpeed: 4.8,
    statusEffectId: 'stun', statusEffectChance: 0.4,
    isEvolved: true,
  },
  {
    id: 'divine_shield', name: 'Divine Shield',
    description: '광역 신성 방패 — Holy Aura의 최종 진화',
    damage: 5, cooldown: 0.5, range: 130, radius: 130,
    projectileSpeed: 0, pierce: 999, projectileColor: '#ffffff',
    behaviorId: 'areaBurst', maxLevel: 5,
    burstDuration: 1.1,
    statusEffectId: 'poison', statusEffectChance: 0.45,
    orbitsPlayer: true,
    isEvolved: true,
  },
  {
    id: 'infinity_blade', name: 'Infinity Blade',
    description: '무한 관통 흡혈 부메랑 — Boomerang의 최종 진화',
    damage: 18, cooldown: 0.9, projectileSpeed: 360, range: 500,
    radius: 14, pierce: 10, maxRange: 900, projectileColor: '#ff1744',
    projectileCount: 1,
    behaviorId: 'boomerang', maxLevel: 5,
    isEvolved: true,
  },
  {
    id: 'blizzard_nova', name: 'Blizzard Nova',
    description: '초광역 빙하 폭풍 — Frost Nova의 최종 진화',
    damage: 6, cooldown: 1.4, range: 160, radius: 160,
    projectileSpeed: 0, pierce: 999, projectileColor: '#b3e5fc',
    behaviorId: 'areaBurst', maxLevel: 5,
    burstDuration: 0.9,
    statusEffectId: 'stun', statusEffectChance: 0.75,
    orbitsPlayer: true,
    isEvolved: true,
  },
];

/** id로 무기 데이터 조회 */
export function getWeaponDataById(id) {
  return weaponData.find(w => w.id === id) ?? null;
}
