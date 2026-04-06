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
  {
    id: 'cultist', name: 'Ash Cultist',
    hp: 14, moveSpeed: 78, damage: 8, xpValue: 5, radius: 12, color: '#ce93d8',
    behaviorId: 'rangedChase',
    behaviorState: () => ({ shootTimer: 0.9 }),
    projectileConfig: {
      damage: 8,
      speed: 230,
      radius: 6,
      color: '#ffcc80',
      pierce: 1,
      projectileVisualId: 'magic_bolt',
      impactEffectType: 'magic_bolt_impact',
      impactEffectVisualId: 'magic_bolt_impact',
    },
  },
  {
    id: 'grave_hound', name: 'Grave Hound',
    hp: 12, moveSpeed: 118, damage: 10, xpValue: 4, radius: 11, color: '#aed581',
    behaviorId: 'dash',
    behaviorState: () => ({ phase: 'idle', timer: 1.1, dashDirX: 0, dashDirY: 0 }),
  },
  {
    id: 'ember_mage', name: 'Ember Mage',
    hp: 18, moveSpeed: 72, damage: 11, xpValue: 6, radius: 13, color: '#ff8a65',
    behaviorId: 'rangedChase',
    behaviorState: () => ({ shootTimer: 1.3 }),
    projectileConfig: {
      damage: 10,
      speed: 250,
      radius: 7,
      color: '#ffab91',
      pierce: 1,
      projectileVisualId: 'fire_bolt',
      impactEffectType: 'fire_bolt_impact',
      impactEffectVisualId: 'fire_bolt_impact',
    },
  },

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
    projectileConfig: {
      damage: 6,
      speed: 200,
      radius: 6,
      color: '#e0e0e0',
      pierce: 1,
      projectileVisualId: 'holy_bolt',
      impactEffectType: 'holy_bolt_impact',
      impactEffectVisualId: 'holy_bolt_impact',
    },
  },
  {
    id: 'elite_cultist', name: 'Elite Cultist',
    hp: 42, moveSpeed: 84, damage: 14, xpValue: 18, radius: 15, color: '#f48fb1',
    isElite: true,
    behaviorId: 'rangedChase',
    behaviorState: () => ({ shootTimer: 0.7 }),
    projectileConfig: {
      damage: 12,
      speed: 250,
      radius: 7,
      color: '#ffe082',
      pierce: 1,
      projectileVisualId: 'holy_bolt_upgrade',
      impactEffectType: 'holy_bolt_upgrade_impact',
      impactEffectVisualId: 'holy_bolt_upgrade_impact',
    },
  },

  // ── 보스 ──────────────────────────────────────────────────────
  {
    id: 'boss_lich', name: 'The Lich',
    hp: 300, moveSpeed: 55, damage: 20, xpValue: 60, radius: 32, color: '#b39ddb',
    isBoss: true, knockbackResist: 1.0,
    behaviorId: 'circle_dash',
    behaviorState: () => ({ phase: 'idle', timer: 2.0, orbitAngle: 0, dashDirX: 0, dashDirY: 0 }),
    projectileConfig: {
      damage: 12,
      speed: 240,
      radius: 8,
      color: '#b39ddb',
      pierce: 2,
      projectileVisualId: 'arcane_nova',
      impactEffectType: 'arcane_nova_impact',
      impactEffectVisualId: 'arcane_nova_impact',
    },
  },
  {
    id: 'boss_warden', name: 'Iron Warden',
    hp: 420, moveSpeed: 48, damage: 24, xpValue: 72, radius: 34, color: '#ffb74d',
    isBoss: true, knockbackResist: 1.0,
    behaviorId: 'dash',
    behaviorState: () => ({ phase: 'idle', timer: 1.6, dashDirX: 0, dashDirY: 0 }),
    projectileConfig: {
      damage: 14,
      speed: 220,
      radius: 10,
      color: '#ffb74d',
      pierce: 2,
      projectileVisualId: 'fire_bolt_upgrade',
      impactEffectType: 'fire_bolt_upgrade_impact',
      impactEffectVisualId: 'fire_bolt_upgrade_impact',
    },
  },
  {
    id: 'boss_broodmother', name: 'Broodmother',
    hp: 360, moveSpeed: 72, damage: 18, xpValue: 76, radius: 30, color: '#ab47bc',
    isBoss: true, knockbackResist: 0.95,
    behaviorId: 'swarm',
  },
  {
    id: 'boss_titan', name: 'Grave Titan',
    hp: 560, moveSpeed: 30, damage: 30, xpValue: 84, radius: 42, color: '#8d6e63',
    isBoss: true, knockbackResist: 1.0,
    behaviorId: 'charge',
  },
  {
    id: 'boss_seraph', name: 'Fallen Seraph',
    hp: 390, moveSpeed: 64, damage: 22, xpValue: 88, radius: 31, color: '#fff176',
    isBoss: true, knockbackResist: 1.0,
    behaviorId: 'keepDistance',
    projectileConfig: {
      damage: 15,
      speed: 250,
      radius: 9,
      color: '#fff176',
      pierce: 2,
      projectileVisualId: 'holy_bolt_upgrade',
      impactEffectType: 'holy_bolt_upgrade_impact',
      impactEffectVisualId: 'holy_bolt_upgrade_impact',
    },
  },
  {
    id: 'boss_abyss_eye', name: 'Abyss Eye',
    hp: 460, moveSpeed: 58, damage: 26, xpValue: 92, radius: 36, color: '#4dd0e1',
    isBoss: true, knockbackResist: 1.0,
    behaviorId: 'circle',
    projectileConfig: {
      damage: 16,
      speed: 230,
      radius: 10,
      color: '#4dd0e1',
      pierce: 3,
      projectileVisualId: 'ice_bolt_upgrade',
      impactEffectType: 'ice_bolt_upgrade_impact',
      impactEffectVisualId: 'ice_bolt_upgrade_impact',
    },
  },

  // ── 파괴 가능한 장식물 ───────────────────────────────────────────────
  {
    id: 'urn_prop', name: 'Cracked Urn',
    hp: 10, moveSpeed: 0, damage: 0, xpValue: 0, radius: 14, color: '#a1887f',
    isProp: true,
    propShape: 'urn',
    propDropTableId: 'urn_basic',
  },
];

/** id로 적 데이터 조회 */
export function getEnemyDataById(id) {
  return enemyData.find(e => e.id === id) ?? null;
}
