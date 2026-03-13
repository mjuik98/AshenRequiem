/**
 * enemyData.js — 적 타입 정의
 *
 * 단위: hp(정수), moveSpeed(px/s), damage(정수), xpValue(정수), radius(px)
 */
export const enemyData = [
  {
    id: 'zombie',
    name: 'Zombie',
    hp: 3,
    moveSpeed: 60,
    damage: 5,
    xpValue: 1,
    radius: 12,
    color: '#8bc34a',
  },
  {
    id: 'skeleton',
    name: 'Skeleton',
    hp: 5,
    moveSpeed: 80,
    damage: 8,
    xpValue: 2,
    radius: 12,
    color: '#e0e0e0',
  },
  {
    id: 'bat',
    name: 'Bat',
    hp: 2,
    moveSpeed: 120,
    damage: 3,
    xpValue: 1,
    radius: 8,
    color: '#7e57c2',
  },
];

/** id로 적 데이터 조회 */
export function getEnemyDataById(id) {
  return enemyData.find(e => e.id === id) || null;
}
