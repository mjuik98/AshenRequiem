/**
 * waveData.js — 시간대별 스폰 규칙
 *
 * from/to: 초
 * spawnPerSecond: 초당 스폰 수
 * enemyIds: 일반 적 풀
 * eliteChance: 스폰 1회당 엘리트로 교체될 확률 (0~1)
 * eliteIds: 엘리트 적 id 풀
 *
 * FIX(balance): 엘리트 다양성
 *   이전: 60초~끝까지 모든 구간 eliteIds: ['elite_golem'] 1종
 *   이후: 웨이브가 진행될수록 다른 종류의 엘리트가 추가 등장
 *         - 60s:  elite_golem (느린 돌진)
 *         - 120s: + elite_bat (빠른 고속 돌진)
 *         - 180s: + elite_skeleton (원형+투사체)
 *         - 240s: 세 종류 모두 등장
 */
export const waveData = [
  {
    from: 0, to: 20,
    spawnPerSecond: 0.8,
    enemyIds: ['zombie'],
    eliteChance: 0, eliteIds: [],
  },
  {
    from: 20, to: 60,
    spawnPerSecond: 1.3,
    enemyIds: ['zombie', 'bat'],
    eliteChance: 0, eliteIds: [],
  },
  {
    from: 60, to: 120,
    spawnPerSecond: 2.0,
    enemyIds: ['zombie', 'bat', 'skeleton'],
    // FIX: elite_golem 단독
    eliteChance: 0.04, eliteIds: ['elite_golem'],
  },
  {
    from: 120, to: 180,
    spawnPerSecond: 2.8,
    enemyIds: ['zombie', 'bat', 'skeleton', 'ghost'],
    // FIX: elite_golem + elite_bat 추가
    eliteChance: 0.06, eliteIds: ['elite_golem', 'elite_bat'],
  },
  {
    from: 180, to: 240,
    spawnPerSecond: 3.5,
    enemyIds: ['bat', 'skeleton', 'ghost', 'slime'],
    // FIX: elite_skeleton 추가 (세 종류)
    eliteChance: 0.07, eliteIds: ['elite_golem', 'elite_bat', 'elite_skeleton'],
  },
  {
    from: 240, to: 300,
    spawnPerSecond: 4.2,
    enemyIds: ['skeleton', 'ghost', 'slime', 'golem'],
    eliteChance: 0.09, eliteIds: ['elite_golem', 'elite_bat', 'elite_skeleton'],
  },
  {
    from: 300, to: Infinity,
    spawnPerSecond: 5.0,
    enemyIds: ['ghost', 'slime', 'golem', 'skeleton'],
    eliteChance: 0.11, eliteIds: ['elite_golem', 'elite_bat', 'elite_skeleton'],
  },
];
