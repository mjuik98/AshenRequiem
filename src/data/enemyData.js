/**
 * enemyData.js — 적 타입 정의
 *
 * PATCH:
 *   [refactor] knockbackResist 필드 추가 (0.0~1.0).
 *     golem/보스 계열은 1.0(완전 무시), 기본값 0(미정의 시 createEnemy 에서 0 적용).
 *   [refactor] elite_skeleton 에 projectileConfig 추가.
 *     EliteBehaviorSystem 하드코딩 제거 후 데이터에서 참조.
 *   [balance]  기존 엘리트 다양성 유지 (elite_golem, elite_bat, elite_skeleton).
 */
export const enemyData = [

  // ── 기본 적 ─────────────────────────────────────────────────
  {
    id: 'zombie',
    name: 'Zombie',
    hp: 3, moveSpeed: 60, damage: 3, xpValue: 1, radius: 12,
    color: '#8bc34a',
    // PATCH(balance): damage 5 → 3 (초반 생존성 개선)
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
    knockbackResist: 0.8,   // PATCH: golem은 넉백에 강함
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
    knockbackResist: 1.0,   // PATCH: 엘리트 골렘은 넉백 완전 무시
    behaviorId: 'dash',
    behaviorState: () => ({ phase: 'idle', timer: 1.5, dashDirX: 0, dashDirY: 0 }),
  },

  {
    id: 'elite_bat',
    name: 'Elite Bat',
    hp: 18, moveSpeed: 160, damage: 12, xpValue: 14, radius: 14,
    color: '#ab47bc',
    isElite: true,
    behaviorId: 'dash',
    behaviorState: () => ({
      phase: 'idle', timer: 0.8,
      dashDirX: 0, dashDirY: 0,
    }),
  },

  {
    id: 'elite_skeleton',
    name: 'Elite Skeleton',
    hp: 35, moveSpeed: 90, damage: 10, xpValue: 16, radius: 16,
    color: '#b0bec5',
    isElite: true,
    behaviorId: 'circle_dash',
    behaviorState: () => ({
      phase: 'circling',
      timer: 3.0,
      orbitAngle: 0,
      orbitRadius: 180,
      orbitSpeed: 1.4,
      dashDirX: 0, dashDirY: 0,
    }),
    // PATCH(refactor): 투사체 config 를 data 로 이동 (EliteBehaviorSystem 하드코딩 제거)
    projectileConfig: {
      damage: 8,
      speed: 220,
      radius: 7,
      color: '#e0e0e0',
      pierce: 1,
    },
  },

  // ── 보스 ─────────────────────────────────────────────────────
  {
    id: 'boss_lich',
    name: 'Lich King',
    hp: 500, moveSpeed: 55, damage: 25, xpValue: 100, radius: 32,
    color: '#7c4dff',
    isBoss: true,
    knockbackResist: 1.0,
    behaviorId: 'circle_dash',
    behaviorState: () => ({
      phase: 'circling',
      timer: 2.5,
      orbitAngle: 0,
      orbitRadius: 200,
      orbitSpeed: 1.2,
      dashDirX: 0, dashDirY: 0,
    }),
    projectileConfig: {
      damage: 14,
      speed: 260,
      radius: 9,
      color: '#7c4dff',
      pierce: 2,
    },
  },
];

/** id로 적 데이터 조회 */
export function getEnemyDataById(id) {
  return enemyData.find(e => e.id === id) ?? null;
}
