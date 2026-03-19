/**
 * src/data/constants/combat.js — 전투 관련 상수
 *
 * REFACTOR: constants.js God File 분리
 *   COMBAT, KNOCKBACK, COLLISION_CULL_MARGIN, ELITE_BEHAVIOR 영역 추출
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
  /** Separation SpatialGrid 셀 크기 (px) */
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
