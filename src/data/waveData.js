/**
 * waveData.js — 시간대별 스폰 규칙
 *
 * from/to: 초, spawnPerSecond: 초당 스폰 수, enemyIds: 소환 가능한 적 id 배열
 */
export const waveData = [
  {
    from: 0,
    to: 30,
    spawnPerSecond: 0.5,
    enemyIds: ['zombie'],
  },
  {
    from: 30,
    to: 60,
    spawnPerSecond: 1.0,
    enemyIds: ['zombie', 'bat'],
  },
  {
    from: 60,
    to: 120,
    spawnPerSecond: 1.5,
    enemyIds: ['zombie', 'bat', 'skeleton'],
  },
  {
    from: 120,
    to: 180,
    spawnPerSecond: 2.5,
    enemyIds: ['zombie', 'bat', 'skeleton'],
  },
  {
    from: 180,
    to: Infinity,
    spawnPerSecond: 3.5,
    enemyIds: ['skeleton', 'bat'],
  },
];
