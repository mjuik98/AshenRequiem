/**
 * constants.js — 기본 수치 / 상수 정의
 *
 * 단위 규약:
 * - cooldown: 초
 * - moveSpeed: 초당 픽셀
 * - projectileSpeed: 초당 픽셀
 * - range: 픽셀
 * - radius: 픽셀
 */

/** 플레이어 기본값 */
export const PLAYER_DEFAULTS = {
  hp: 100,
  maxHp: 100,
  moveSpeed: 200,       // px/s
  radius: 16,
  magnetRadius: 60,     // 경험치 흡수 반경
  color: '#4fc3f7',
};

/** XP → 레벨업 테이블 (인덱스 = 레벨, 값 = 다음 레벨 도달에 필요한 누적 XP) */
export const XP_TABLE = [
  0,    // Lv0 → Lv1 (사용 안 함)
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
 */
export function getXpForLevel(level) {
  if (level < XP_TABLE.length) return XP_TABLE[level];
  // 테이블 초과 시 선형 증가
  return XP_TABLE[XP_TABLE.length - 1] + (level - XP_TABLE.length + 1) * 50;
}

/** 픽업 기본값 */
export const PICKUP_DEFAULTS = {
  xpValue: 1,
  radius: 6,
  color: '#66bb6a',
  magnetSpeed: 400,   // 흡수 시 이동 속도
};

/** 이펙트 기본값 */
export const EFFECT_DEFAULTS = {
  duration: 0.4,      // 초
};
