/** waveData.js — 시간대별 스폰 규칙 */
export const waveData = [
  { from: 0,   to: 20,       spawnPerSecond: 0.8, enemyIds: ['zombie'],                              eliteChance: 0,    eliteIds: [] },
  { from: 20,  to: 60,       spawnPerSecond: 1.3, enemyIds: ['zombie', 'bat'],                       eliteChance: 0,    eliteIds: [] },
  { from: 60,  to: 120,      spawnPerSecond: 2.0, enemyIds: ['zombie', 'bat', 'skeleton'],           eliteChance: 0.04, eliteIds: ['elite_golem'] },
  { from: 120, to: 180,      spawnPerSecond: 2.8, enemyIds: ['zombie', 'bat', 'skeleton', 'ghost'],  eliteChance: 0.06, eliteIds: ['elite_golem', 'elite_bat'] },
  { from: 180, to: 240,      spawnPerSecond: 3.5, enemyIds: ['bat', 'skeleton', 'ghost', 'slime'],   eliteChance: 0.07, eliteIds: ['elite_golem', 'elite_bat', 'elite_skeleton'] },
  { from: 240, to: 300,      spawnPerSecond: 4.2, enemyIds: ['skeleton', 'ghost', 'slime', 'golem'], eliteChance: 0.09, eliteIds: ['elite_golem', 'elite_bat', 'elite_skeleton'] },
  { from: 300, to: Infinity, spawnPerSecond: 5.0, enemyIds: ['ghost', 'slime', 'golem', 'skeleton'], eliteChance: 0.11, eliteIds: ['elite_golem', 'elite_bat', 'elite_skeleton'] },
];
