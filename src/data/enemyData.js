/**
 * enemyData.js — 적 타입 정의
 *
 * 단위: hp(정수), moveSpeed(px/s), damage(정수), xpValue(정수), radius(px)
 * behaviorId: 'chase'(기본) | 'dash' | 'circle_dash'
 * behaviorState: () => {} — 런타임 상태 초기값 팩토리 함수
 */
export const enemyData = [
  // ── 기본 적 ─────────────────────────────────────────────
  {
    id: 'zombie',
    name: 'Zombie',
    hp: 3, moveSpeed: 60, damage: 5, xpValue: 1, radius: 12,
    color: '#8bc34a',
  },
  {
    id: 'skeleton',
    name: 'Skeleton',
    hp: 5, moveSpeed: 80, damage: 8, xpValue: 2, radius: 12,
    color: '#e0e0e0',
  },
  {
    id: 'bat',
    name: 'Bat',
    hp: 2, moveSpeed: 120, damage: 3, xpValue: 1, radius: 8,
    color: '#7e57c2',
  },

  // ── 중반 적 ─────────────────────────────────────────────
  {
    id: 'ghost',
    name: 'Ghost',
    hp: 2, moveSpeed: 160, damage: 6, xpValue: 2, radius: 10,
    color: '#b0bec5',
  },
  {
    id: 'golem',
    name: 'Golem',
    hp: 20, moveSpeed: 35, damage: 15, xpValue: 5, radius: 20,
    color: '#795548',
  },
  {
    id: 'slime',
    name: 'Slime',
    hp: 6, moveSpeed: 50, damage: 4, xpValue: 3, radius: 14,
    color: '#26a69a',
    // 사망 시 mini_slime 2마리 분열
    deathSpawn: { enemyId: 'mini_slime', count: 2 },
  },
  {
    id: 'mini_slime',
    name: 'Mini Slime',
    hp: 2, moveSpeed: 70, damage: 2, xpValue: 1, radius: 7,
    color: '#80cbc4',
  },

  // ── 엘리트 ───────────────────────────────────────────────
  {
    id: 'elite_golem',
    name: 'Elite Golem',
    hp: 60, moveSpeed: 45, damage: 22, xpValue: 18, radius: 26,
    color: '#ff8f00',
    isElite: true,
    behaviorId: 'dash',
    behaviorState: () => ({ phase: 'idle', timer: 1.5, dashDirX: 0, dashDirY: 0 }),
  },

  // ── 보스 ─────────────────────────────────────────────────
  {
    id: 'boss_lich',
    name: 'Lich King',
    hp: 250, moveSpeed: 70, damage: 18, xpValue: 50, radius: 30,
    color: '#ce93d8',
    isBoss: true,
    behaviorId: 'circle_dash',
    behaviorState: () => ({
      phase: 'circling', timer: 2.8, dashDirX: 0, dashDirY: 0,
      orbitAngle: 0, orbitRadius: 130, orbitSpeed: 1.4,
    }),
  },
  {
    id: 'boss_vampire',
    name: 'Vampire Lord',
    hp: 500, moveSpeed: 95, damage: 25, xpValue: 100, radius: 26,
    color: '#ef5350',
    isBoss: true,
    behaviorId: 'circle_dash',
    behaviorState: () => ({
      phase: 'circling', timer: 2.0, dashDirX: 0, dashDirY: 0,
      orbitAngle: 0, orbitRadius: 100, orbitSpeed: 2.2,
    }),
  },
];

/** id로 적 데이터 조회 */
export function getEnemyDataById(id) {
  return enemyData.find(e => e.id === id) || null;
}
