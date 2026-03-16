/**
 * constants.js — 게임 상수 정의
 *
 * 단위 규약:
 *   cooldown: 초 / moveSpeed: px/s / projectileSpeed: px/s
 *   range: px / radius: px / rotationSpeed: rad/s / spawnPerSecond: 개/s
 */

/** 플레이어 기본값 */
export const PLAYER_DEFAULTS = {
  hp:           100,
  maxHp:        100,
  moveSpeed:    200,
  radius:       16,
  magnetRadius: 60,
  color:        '#4fc3f7',
};

/** XP → 레벨업 테이블 (인덱스 = 현재 레벨, 값 = 다음 레벨에 필요한 XP) */
export const XP_TABLE = [
  0,    // Lv0 (미사용)
  5,    // Lv1 → Lv2
  12,   // Lv2 → Lv3
  22,   // Lv3 → Lv4
  35,   // Lv4 → Lv5
  50,   // Lv5 → Lv6
  70,   // Lv6 → Lv7
  95,   // Lv7 → Lv8
  125,  // Lv8 → Lv9
  160,  // Lv9 → Lv10
  200,  // Lv10+
];

/**
 * 특정 레벨에서 다음 레벨업에 필요한 XP
 * @param {number} level
 * @returns {number}
 */
export function getXpForLevel(level) {
  if (level < XP_TABLE.length) return XP_TABLE[level];
  return XP_TABLE[XP_TABLE.length - 1] + (level - XP_TABLE.length + 1) * 50;
}

/** 픽업 기본값 */
export const PICKUP_DEFAULTS = {
  xpValue:     1,
  radius:      6,
  color:       '#66bb6a',
  magnetSpeed: 400,
};

/**
 * 이펙트 기본값
 * FIX(bug): levelFlashDuration / burstDuration 추가 (undefined 방지)
 */
export const EFFECT_DEFAULTS = {
  duration:           0.4,
  burstDuration:      0.45,
  levelFlashDuration: 0.6,
};

/**
 * 데미지 텍스트 설정
 * PERF: 프레임당 최대 이펙트 수 상한
 */
export const DAMAGE_TEXT = {
  MAX_PER_FRAME: 12,
  COLOR_ENEMY:   '#ef5350',
  COLOR_PLAYER:  '#ffffff',
  DURATION:      0.5,
};

/** 넉백 설정 */
export const KNOCKBACK = {
  speed:    320,
  duration: 0.18,
};

/**
 * 충돌 컬링 마진 (픽셀)
 * PERF: 화면 밖 적 필터링 기준
 */
export const COLLISION_CULL_MARGIN = 600;

/** 엘리트 행동 설정 */
export const ELITE_BEHAVIOR = {
  DASH_SPEED:        520,
  CIRCLE_DASH_SPEED: 480,
};

/** 렌더링 컬링 마진 (픽셀) — 화면 밖 엔티티 스킵 */
export const RENDER_CULL_MARGIN = 80;
