/**
 * src/entities/createPickup.js
 *
 * ── 개선 이력 ──────────────────────────────────────────────────────
 * Before:
 *   createPickup 와 resetPickup 이 동일 필드를 각각 하드코딩.
 *   constants.js PICKUP_DEFAULTS 와 entityDefaults.js PICKUP_DEFAULTS_SHAPE
 *   두 곳에 기본값이 분산 (xpValue, radius, color 값 불일치 위험).
 *
 * After:
 *   PICKUP_DEFAULTS_SHAPE + applyEntityFields 로 단일 소스 관리.
 *   constants.js PICKUP_DEFAULTS는 magnetSpeed 등 동작 상수 전용으로 분리 유지.
 * ──────────────────────────────────────────────────────────────────
 */

import { generateId }                                from '../utils/ids.js';
import { PICKUP_DEFAULTS_SHAPE, applyEntityFields }  from './entityDefaults.js';

/**
 * createPickup — XP 픽업 엔티티 생성
 *
 * @param {number} [x=0]
 * @param {number} [y=0]
 * @param {number} [xpValue]
 * @returns {object}
 */
export function createPickup(x = 0, y = 0, xpValue) {
  const pickup = {
    id:   generateId(),
    type: 'pickup',
  };
  applyEntityFields(pickup, PICKUP_DEFAULTS_SHAPE, { x, y, xpValue });
  return pickup;
}

/**
 * resetPickup — ObjectPool 반환 후 픽업 재초기화
 *
 * @param {object} obj     풀에서 꺼낸 기존 픽업 객체
 * @param {object} config  새 픽업 설정
 * @returns {object}       obj (체인 편의를 위해 반환)
 */
export function resetPickup(obj, config) {
  obj.id   = generateId();
  obj.type = 'pickup';
  applyEntityFields(obj, PICKUP_DEFAULTS_SHAPE, config);
  return obj;
}

