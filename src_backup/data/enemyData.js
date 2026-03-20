/**
 * enemyData.js — 적 타입 정의
 */
export const enemyData = [
  // ── 기본 적 ─────────────────────────────────────────────────
  { id: 'zombie',    name: 'Zombie',    hp: 3,  moveSpeed: 60,  damage: 3,  xpValue: 1, radius: 12, color: '#8bc34a' },
  { id: 'skeleton',  name: 'Skeleton',  hp: 5,  moveSpeed: 80,  damage: 6,  xpValue: 2, radius: 12, color: '#e0e0e0' },
  { id: 'bat',       name: 'Bat',       hp: 2,  moveSpeed: 120, damage: 3,  xpValue: 1, radius: 8,  color: '#7e57c2' },

  // ── 중반 적 ─────────────────────────────────────────────────
  { id: 'ghost',     name: 'Ghost',     hp: 8,  moveSpeed: 160, damage: 6,  xpValue: 3, radius: 10, color: '#b0bec5' },
  { id: 'golem',     name: 'Golem',     hp: 20, moveSpeed: 35,  damage: 15, xpValue: 5, radius: 20, color: '#795548', knockbackResist: 0.8 },
  {
    id: 'slime', name: 'Slime',
    hp: 6, moveSpeed: 50, damage: 4, xpValue: 3, radius: 14, color: '#26a69a',
    deathSpawn: { enemyId: 'mini_slime', count: 2 },
  },
  { id: 'mini_slime', name: 'Mini Slime', hp: 2, moveSpeed: 70, damage: 2, xpValue: 1, radius: 7, color: '#80cbc4' },

  // ── 엘리트 ───────────────────────────────────────────────────
  {
    id: 'elite_golem', name: 'Elite Golem',
    hp: 60, moveSpeed: 45, damage: 22, xpValue: 18, radius: 26, color: '#ff8f00',
    isElite: true, knockbackResist: 1.0,
    behaviorId: 'dash',
    behaviorState: () => ({ phase: 'idle', timer: 1.5, dashDirX: 0, dashDirY: 0 }),
  },
  {
    id: 'elite_bat', name: 'Elite Bat',
    hp: 18, moveSpeed: 160, damage: 12, xpValue: 14, radius: 14, color: '#ab47bc',
    isElite: true,
    behaviorId: 'dash',
    behaviorState: () => ({ phase: 'idle', timer: 0.8, dashDirX: 0, dashDirY: 0 }),
  },
  {
    id: 'elite_skeleton', name: 'Elite Skeleton',
    hp: 35, moveSpeed: 90, damage: 10, xpValue: 16, radius: 16, color: '#eeeeee',
    isElite: true,
    behaviorId: 'circle_dash',
    behaviorState: () => ({ phase: 'idle', timer: 1.2, orbitAngle: 0, dashDirX: 0, dashDirY: 0 }),
    projectileConfig: { damage: 6, speed: 200, radius: 6, color: '#e0e0e0', pierce: 1 },
  },

  // ── 보스 ──────────────────────────────────────────────────────
  {
    id: 'boss_lich', name: 'The Lich',
    hp: 300, moveSpeed: 55, damage: 20, xpValue: 60, radius: 32, color: '#b39ddb',
    isBoss: true, knockbackResist: 1.0,
    behaviorId: 'circle_dash',
    behaviorState: () => ({ phase: 'idle', timer: 2.0, orbitAngle: 0, dashDirX: 0, dashDirY: 0 }),
    projectileConfig: { damage: 12, speed: 240, radius: 8, color: '#b39ddb', pierce: 2 },
  },
];

/** id로 적 데이터 조회 */
export function getEnemyDataById(id) {
  return enemyData.find(e => e.id === id) ?? null;
}
