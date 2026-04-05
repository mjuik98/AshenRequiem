/**
 * src/domain/play/state/spawnRequest.js — SpawnRequest 팩토리 함수
 */

export function spawnEnemy({ enemyId, x, y, level = 1, config = {} } = {}) {
  return {
    type: 'enemy',
    config: { enemyId, x, y, level, ...config },
  };
}

export function spawnPickup({ type, x, y, value = 1, xpValue, config = {} } = {}) {
  return {
    type: 'pickup',
    config: { type, x, y, value, xpValue, ...config },
  };
}

/**
 * @param {{ effectType?: string, x: number, y: number, config?: object }} param
 */
export function spawnEffect({ effectType = 'burst', x, y, config = {} } = {}) {
  return {
    type: 'effect',
    config: { effectType, x, y, ...config },
  };
}

export function spawnProjectile({ weapon, x, y, angle, config = {} } = {}) {
  return {
    type: 'projectile',
    config: { weapon, x, y, angle, ...config },
  };
}
