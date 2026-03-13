import { generateId } from '../utils/ids.js';
import { getEnemyDataById } from '../data/enemyData.js';

/**
 * createEnemy — 적 엔티티 생성
 * @param {string} enemyId — enemyData의 id
 * @param {number} x
 * @param {number} y
 */
export function createEnemy(enemyId, x, y) {
  const data = getEnemyDataById(enemyId);
  if (!data) {
    console.warn(`Unknown enemy id: ${enemyId}`);
    return null;
  }

  return {
    id: generateId(),
    type: 'enemy',
    enemyDataId: data.id,
    x,
    y,
    hp: data.hp,
    maxHp: data.hp,
    moveSpeed: data.moveSpeed,
    damage: data.damage,
    xpValue: data.xpValue,
    radius: data.radius,
    color: data.color,

    // 피격 플래시
    hitFlashTimer: 0,

    isAlive: true,
    pendingDestroy: false,
  };
}
