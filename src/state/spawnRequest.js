/**
 * src/state/spawnRequest.js — SpawnRequest 팩토리 함수 (R-15)
 *
 * BUGFIX(P0): spawnEffect 시그니처 계약 불일치 수정
 *
 *   Before (계약 불일치):
 *     spawnEffect({ effectId, x, y, config }) — effectId 기반 시그니처
 *     DeathSystem은 effectType, color, radius, duration을 직접 전달
 *     → spawnEffect가 받는 필드와 DeathSystem이 보내는 필드가 다름
 *     → effectType 등이 무시되어 burst 이펙트가 올바른 설정으로 생성되지 않음
 *
 *   After (통일):
 *     spawnEffect({ effectType, x, y, config }) — effectType 기반으로 변경
 *     나머지 세부 설정은 config 객체로 위임
 *     → DeathSystem 호출부도 함께 수정 (DeathSystem.js 참조)
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
 * 이펙트 스폰 요청 생성.
 *
 * BUGFIX(P0): effectId → effectType 으로 시그니처 변경
 *   세부 설정(color, radius, duration 등)은 config 객체로 전달한다.
 *
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
