/**
 * src/data/constants/entities.js — 엔티티 기본값 상수
 *
 * REFACTOR(P2): PICKUP_DEFAULTS 분리 정리
 */

export const PLAYER_DEFAULTS = {
  hp:           100,
  maxHp:        100,
  moveSpeed:    200,
  radius:       16,
  magnetRadius: 60,
  color:        '#4fc3f7',
};

/**
 * 픽업 동작 상수.
 * 엔티티 필드 초기값은 entityDefaults.js의 PICKUP_DEFAULTS_SHAPE 참조.
 *
 * @since P2 리팩터링
 */
export const PICKUP_BEHAVIOR = {
  /** 픽업 자석 이동 속도 (px/s) */
  magnetSpeed: 400,
};

/**
 * @deprecated PICKUP_BEHAVIOR + entityDefaults.PICKUP_DEFAULTS_SHAPE 로 분리됨.
 *
 * 하위 호환을 위해 유지. 신규 코드는 PICKUP_BEHAVIOR 사용.
 */
export const PICKUP_DEFAULTS = {
  xpValue:     1,
  radius:      8,
  color:       '#66bb6a',
  magnetSpeed: 400,
};
