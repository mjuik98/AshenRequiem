/**
 * src/data/constants/combat.js — 전투 관련 상수
 *
 * FIX: SEPARATION_CELL_SIZE 누락 추가
 *
 *   Before: EnemyMovementSystem에서 COMBAT.SEPARATION_CELL_SIZE ?? 60 으로 폴백
 *           → 상수가 실제로 없어서 항상 폴백값 60 사용 (의도가 코드에 드러나지 않음)
 *   After:  명시적으로 60 선언 → 인텐트가 상수 파일에서 관리됨
 */

export const COMBAT = {
  /** 플레이어 피격 후 무적 시간 (s) */
  PLAYER_INVINCIBLE_DURATION: 0.5,
  /** 적 넉백 지속 시간 (s) */
  KNOCKBACK_DURATION: 0.15,
  /** 넉백 강도 기본값 (px/s) */
  KNOCKBACK_BASE_FORCE: 320,
  /** 경험치 픽업 자석 기본 반지름 (px) */
  DEFAULT_MAGNET_RADIUS: 60,
  /** 경험치 픽업 이동 속도 (px/s) */
  PICKUP_MAGNET_SPEED: 400,
  /** 투사체 최대 수명 (s) — 무한 pierce 투사체 안전장치 */
  PROJECTILE_MAX_LIFETIME: 10,
  /** Separation 강도 (EnemyMovementSystem) */
  SEPARATION_STRENGTH: 0.35,
  /** Separation SpatialGrid 셀 크기 (px) — FIX: 이전에 누락됨 */
  SEPARATION_CELL_SIZE: 60,
};

/** @deprecated COMBAT 객체 내 필드로 이전 예정 — 하위 호환용 */
export const KNOCKBACK = {
  speed:    320,
  duration: 0.18,
};

export const COLLISION_CULL_MARGIN = 600;

export const ELITE_BEHAVIOR = {
  DASH_SPEED:        520,
  CIRCLE_DASH_SPEED: 480,
};
