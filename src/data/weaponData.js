/**
 * weaponData.js — 무기 정의
 *
 * PATCH(이전):
 *   [bug]  burstDuration 필드 추가 (areaBurst 무기 전용).
 *   [balance] holy_aura: damage 1 → 2, cooldown 1.0 → 0.8 (단독 실용 수준 향상).
 *   [balance] orbit lifetime 계수 0.97 → 1.02 (오브 교체 공백 제거).
 *
 * BAL(balance): magic_bolt slow 발동 확률 조정.
 *   이전: statusEffectChance 0.3 (30%) — 초반 적 이동을 과도하게 제한,
 *         쿨다운 업그레이드 시 slow 유지율이 높아져 난이도 급락.
 *   이후: statusEffectChance 0.15 (15%) — 초반 감각적 위협 유지, 업그레이드 시 과도함 완화.
 *
 * BAL(balance): boomerang 수치 조정.
 *   이전: damage 4, pierce 5, cooldown 1.4 — magic_bolt 대비 damage 2배 + pierce 5배,
 *         획득 즉시 다른 무기 선택 동기가 사라짐.
 *   이후: damage 3, pierce 3, cooldown 1.6 — 차별점 유지하되 과도한 효율 완화.
 *
 * BAL(balance): holy_aura burstDuration 조정.
 *   이전: burstDuration 0.5, cooldown 0.8 → 0.3s 공백 → 시각적 깜빡임.
 *   이후: burstDuration 0.85 (cooldown * 1.06) — orbit 과 동일한 접근으로 공백 제거.
 */
export const weaponData = [
  {
    id: 'magic_bolt',
    name: 'Magic Bolt',
    description: '가장 가까운 적을 향해 마법탄 발사',
    damage: 2, cooldown: 0.8, projectileSpeed: 350, range: 400,
    radius: 5, pierce: 1, projectileColor: '#ffee58',
    behaviorId: 'targetProjectile', maxLevel: 5,
    // BAL: slow 확률 0.3 → 0.15 (초반 난이도 완화, 업그레이드 후 과도함 방지)
    statusEffectId: 'slow', statusEffectChance: 0.15,
  },
  {
    id: 'holy_aura',
    name: 'Holy Aura',
    description: '주변 적에게 지속 데미지',
    damage: 2, cooldown: 0.8, range: 80, radius: 80,
    projectileSpeed: 0, pierce: 999, projectileColor: '#ffd54f',
    behaviorId: 'areaBurst', maxLevel: 5,
    // BAL: burstDuration 0.5 → 0.85 (cooldown 0.8 * 1.06 — 시각적 공백 제거)
    burstDuration: 0.85,
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
    burstDuration: 0.6,
    statusEffectId: 'stun', statusEffectChance: 0.6,
  },
  {
    id: 'boomerang',
    name: 'Boomerang',
    description: '가까운 적을 향해 느리지만 관통력 높은 부메랑 발사',
    // BAL: damage 4 → 3, pierce 5 → 3, cooldown 1.4 → 1.6
    // 투자 대비 효율 완화 — magic_bolt 와의 차별점은 pierce 와 사정거리로 유지
    damage: 3, cooldown: 1.6, projectileSpeed: 240, range: 450,
    radius: 8, pierce: 3,
    projectileColor: '#ffab40',
    behaviorId: 'targetProjectile', maxLevel: 5,
    statusEffectId: null, statusEffectChance: 0,
  },
];

/** id로 무기 데이터 조회 */
export function getWeaponDataById(id) {
  return weaponData.find(w => w.id === id) ?? null;
}
