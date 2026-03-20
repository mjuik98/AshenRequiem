/**
 * src/state/spawnRequest.js — SpawnRequest 팩토리 함수 (R-15)
 *
 * REFACTOR: 리터럴 직접 작성을 방지하고 일관된 필드 구성을 보장한다.
 */

export function spawnEnemy({ enemyId, x, y, level = 1, config = {} } = {}) {
  return {
    type: 'enemy',
    config: { enemyId, x, y, level, ...config },
  };
}

export function spawnPickup({ type, x, y, value = 1, config = {} } = {}) {
  return {
    type: 'pickup',
    config: { type, x, y, value, ...config },
  };
}

export function spawnEffect({ effectId, x, y, config = {} } = {}) {
  return {
    type: 'effect',
    config: { effectId, x, y, ...config },
  };
}

export function spawnProjectile({ weapon, x, y, angle, config = {} } = {}) {
  return {
    type: 'projectile',
    config: { weapon, x, y, angle, ...config },
  };
}
