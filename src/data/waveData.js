/** waveData.js — 시간대별 스폰 규칙 */
export const waveData = [
  { from: 0,   to: 30,       spawnPerSecond: 0.9, enemyIds: ['zombie'],                                       eliteChance: 0.00, eliteIds: [] },
  { from: 30,  to: 60,       spawnPerSecond: 1.4, enemyIds: ['zombie', 'bat'],                                eliteChance: 0.00, eliteIds: [] },
  { from: 60,  to: 90,       spawnPerSecond: 2.0, enemyIds: ['zombie', 'bat', 'skeleton'],                    eliteChance: 0.03, eliteIds: ['elite_golem'] },
  { from: 90,  to: 120,      spawnPerSecond: 2.7, enemyIds: ['zombie', 'bat', 'skeleton', 'ghost'],           eliteChance: 0.04, eliteIds: ['elite_golem', 'elite_bat'] },
  { from: 120, to: 180,      spawnPerSecond: 3.4, enemyIds: ['bat', 'skeleton', 'ghost', 'slime'],            eliteChance: 0.06, eliteIds: ['elite_golem', 'elite_bat'] },
  { from: 180, to: 240,      spawnPerSecond: 4.2, enemyIds: ['bat', 'skeleton', 'ghost', 'slime', 'golem'],   eliteChance: 0.08, eliteIds: ['elite_golem', 'elite_bat', 'elite_skeleton'] },
  { from: 240, to: 300,      spawnPerSecond: 5.0, enemyIds: ['skeleton', 'ghost', 'slime', 'golem'],          eliteChance: 0.10, eliteIds: ['elite_golem', 'elite_bat', 'elite_skeleton'] },
  { from: 300, to: 420,      spawnPerSecond: 5.8, enemyIds: ['ghost', 'slime', 'golem', 'skeleton'],          eliteChance: 0.11, eliteIds: ['elite_golem', 'elite_bat', 'elite_skeleton'] },
  { from: 420, to: 600,      spawnPerSecond: 6.6, enemyIds: ['ghost', 'slime', 'golem', 'mini_slime'],        eliteChance: 0.13, eliteIds: ['elite_golem', 'elite_bat', 'elite_skeleton'] },
  { from: 600, to: 900,      spawnPerSecond: 7.4, enemyIds: ['ghost', 'golem', 'slime', 'mini_slime'],        eliteChance: 0.15, eliteIds: ['elite_golem', 'elite_bat', 'elite_skeleton'] },
  { from: 900, to: 1200,     spawnPerSecond: 8.3, enemyIds: ['golem', 'ghost', 'slime', 'mini_slime'],        eliteChance: 0.17, eliteIds: ['elite_golem', 'elite_bat', 'elite_skeleton'] },
  { from: 1200, to: Infinity,spawnPerSecond: 9.2, enemyIds: ['golem', 'ghost', 'slime', 'skeleton', 'mini_slime'], eliteChance: 0.20, eliteIds: ['elite_golem', 'elite_bat', 'elite_skeleton'] },
];
