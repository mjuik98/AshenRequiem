/**
 * src/data/constants/entities.js — 엔티티 기본값 상수
 *
 * REFACTOR: constants.js God File 분리
 *   PLAYER_DEFAULTS, PICKUP_DEFAULTS 영역 추출
 *
 * BUGFIX: PICKUP_DEFAULTS.radius 불일치 수정
 *   Before: constants.js → radius: 6, entityDefaults.js → radius: 8
 *   After:  radius: 8 으로 통일 (entityDefaults.js 가 실제 createPickup 에 사용되므로 8이 정확)
 *   Impact: drawPickup.js 의 fallback `pickup.radius || 6` 도 더 이상 불일치 없음
 *
 * NOTE: PICKUP_DEFAULTS.magnetSpeed 는 동작 상수 (위치·크기가 아님).
 *       entityDefaults.js 의 PICKUP_DEFAULTS_SHAPE 은 엔티티 필드 초기화에 사용.
 *       두 객체는 역할이 다르므로 병합하지 않음 — 값만 통일.
 */

export const PLAYER_DEFAULTS = {
  hp:           100,
  maxHp:        100,
  moveSpeed:    200,
  radius:       16,
  magnetRadius: 60,
  color:        '#4fc3f7',
};

export const PICKUP_DEFAULTS = {
  xpValue:     1,
  radius:      8,      // FIX: 6 → 8 (entityDefaults.js 와 통일)
  color:       '#66bb6a',
  magnetSpeed: 400,
};
