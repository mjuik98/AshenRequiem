/**
 * enemyData.js — 적 타입 정의
 *
 * 단위: hp(정수), moveSpeed(px/s), damage(정수), xpValue(정수), radius(px)
 * behaviorId: 'chase'(기본) | 'dash' | 'circle_dash'
 * behaviorState: () => {} — 런타임 상태 초기값 팩토리 함수
 *
 * FIX(balance): 엘리트 다양성 추가
 *   이전: elite_golem 1종뿐
 *   이후: elite_bat(빠른 돌진), elite_skeleton(원형 이동+투사체) 추가
 *   → waveData 에서 웨이브별로 다른 엘리트를 배정 가능
 */
export const enemyData = [

  // ── 기본 적 ─────────────────────────────────────────────────
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

  // ── 중반 적 ─────────────────────────────────────────────────
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
    deathSpawn: { enemyId: 'mini_slime', count: 2 },
  },
  {
    id: 'mini_slime',
    name: 'Mini Slime',
    hp: 2, moveSpeed: 70, damage: 2, xpValue: 1, radius: 7,
    color: '#80cbc4',
  },

  // ── 엘리트 ───────────────────────────────────────────────────

  {
    id: 'elite_golem',
    name: 'Elite Golem',
    hp: 60, moveSpeed: 45, damage: 22, xpValue: 18, radius: 26,
    color: '#ff8f00',
    isElite: true,
    behaviorId: 'dash',
    behaviorState: () => ({ phase: 'idle', timer: 1.5, dashDirX: 0, dashDirY: 0 }),
  },

  // FIX(balance): 엘리트 bat 추가 — 고속 돌진형, 빠르고 작음
  {
    id: 'elite_bat',
    name: 'Elite Bat',
    hp: 18, moveSpeed: 160, damage: 12, xpValue: 14, radius: 14,
    color: '#ab47bc',
    isElite: true,
    behaviorId: 'dash',
    behaviorState: () => ({
      phase: 'idle', timer: 0.8,   // 빠른 돌진 준비
      dashDirX: 0, dashDirY: 0,
    }),
  },

  // FIX(balance): 엘리트 skeleton 추가 — 원형 이동 + 4방향 투사체
  {
    id: 'elite_skeleton',
    name: 'Elite Skeleton',
    hp: 35, moveSpeed: 90, damage: 16, xpValue: 20, radius: 18,
    color: '#bdbdbd',
    isElite: true,
    behaviorId: 'circle_dash',
    behaviorState: () => ({
      phase: 'circling', timer: 2.0,
      dashDirX: 0, dashDirY: 0,
      orbitAngle: 0, orbitRadius: 110, orbitSpeed: 1.8,
    }),
  },

  // ── 보스 ─────────────────────────────────────────────────────
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
