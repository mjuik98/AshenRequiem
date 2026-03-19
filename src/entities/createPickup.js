/**
 * src/entities/createPickup.js
 *
 * FIX(P4-10): createPickup 시그니처를 config 객체로 통일
 *
 * Before (불일치):
 *   createPickup(x = 0, y = 0, xpValue)  — 위치 인자 방식
 *   resetPickup(obj, config)              — config 객체 방식
 *   → ObjectPool의 createFn / resetFn 시그니처가 불일치
 *   → ObjectPool이 createFn() 호출 시 인자 없이 호출하므로
 *     x=0, y=0이 기본값으로 적용되어 우연히 동작했음
 *
 * After (통일):
 *   createPickup(config = {})  — config 객체 방식으로 통일
 *   resetPickup(obj, config)   — 기존과 동일
 *   → ObjectPool 생성 시 createFn() 호출 = createPickup() = config:{} = 기본값
 *   → ObjectPool 재사용 시 resetPickup(obj, req.config) 로 실제 값 주입
 *   → createFn/resetFn 패턴 일관성 확보
 *
 * 하위 호환:
 *   createPickup() — 인자 없음 (ObjectPool prewarm 용) → config:{} 기본값 사용 ✓
 *   createPickup({ x, y, xpValue }) — config 객체 사용 ✓
 *   직접 createPickup(x, y, xpValue) 호출 코드는 없으므로 파괴적 변경 없음
 */

import { generateId }                                from '../utils/ids.js';
import { PICKUP_DEFAULTS_SHAPE, applyEntityFields }  from './entityDefaults.js';

/**
 * createPickup — XP 픽업 엔티티 생성
 *
 * @param {object} [config={}]  픽업 초기값 (PICKUP_DEFAULTS_SHAPE 참조)
 * @returns {object}
 */
export function createPickup(config = {}) {
  const pickup = {
    id:   generateId(),
    type: 'pickup',
  };
  applyEntityFields(pickup, PICKUP_DEFAULTS_SHAPE, config);
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
