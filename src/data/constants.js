export const PLAYER_DEFAULTS = {
  hp: 100,
  maxHp: 100,
  moveSpeed: 200,       // px/s
  radius: 16,
  magnetRadius: 60,     // 경험치 흡수 반경
  color: '#4fc3f7',
};

/**
 * XP → 레벨업 테이블 (인덱스 = 레벨, 값 = 다음 레벨 도달에 필요한 누적 XP)
 *
 * FIX(balance): 레벨 10 이후 선형 +50 → 지수 증가로 교체.
 */
export const XP_TABLE = [
  0,    // Lv0 → Lv1 (사용 안 함)
  5,    // Lv1 → Lv2
  12,   // Lv2 → Lv3
  22,   // Lv3 → Lv4
  35,   // Lv4 → Lv5
  52,   // Lv5 → Lv6
  74,   // Lv6 → Lv7
  102,  // Lv7 → Lv8
  138,  // Lv8 → Lv9
  184,  // Lv9 → Lv10
  240,  // Lv10 → Lv11
];

/**
 * 특정 레벨에서 다음 레벨업에 필요한 XP
 *
 * FIX(balance): 테이블 초과 시 지수 증가 적용 (기존 선형 +50 제거)
 * 공식: base * 1.18^(level - tableLength) — 약 18% 지수 증가
 */
export function getXpForLevel(level) {
  if (level < XP_TABLE.length) return XP_TABLE[level];
  const base = XP_TABLE[XP_TABLE.length - 1]; // 240
  const excess = level - (XP_TABLE.length - 1);
  return Math.round(base * Math.pow(1.18, excess));
}

/** 픽업 기본값 */
export const PICKUP_DEFAULTS = {
  xpValue: 1,
  radius: 6,
  color: '#66bb6a',
  magnetSpeed: 400,   // 흡수 시 이동 속도
};

/**
 * 이펙트 기본값
 *
 * FIX(bug): levelFlashDuration 상수 추가.
 */
export const EFFECT_DEFAULTS = {
  duration:           0.4,  // 기본 이펙트 지속 시간 (초)
  levelFlashDuration: 0.6,  // 레벨업 플래시 지속 시간 (초)
  burstDuration:      0.3,  // 사망 burst 이펙트 지속 시간 (초)
};

/**
 * 넉백 물리 상수
 *
 * FIX(refactor): DamageSystem 내 하드코딩 제거 → 여기서 관리.
 */
export const KNOCKBACK = {
  speed:    180,  // px/s — 넉백 이동 속도
  duration: 0.10, // 초  — 넉백 지속 시간
};

/**
 * CollisionSystem 화면 외곽 컬링 마진 (px)
 *
 * PERF: 700 → 480 으로 축소.
 *   후반 고밀도 웨이브에서 충돌 체크 대상을 줄여 CPU 부하를 낮춤.
 */
export const COLLISION_CULL_MARGIN = 480;

/**
 * 데미지 텍스트 이펙트 상수
 *
 * REF(refactor): DamageSystem 내 하드코딩 제거.
 *   이전: color, duration 이 DamageSystem 에 직접 리터럴로 존재.
 *   이후: 여기서 일괄 관리 → 튜닝 시 한 곳만 수정.
 */
export const DAMAGE_TEXT = {
  duration:     0.5,       // 이펙트 표시 지속 시간 (초)
  playerColor:  '#ef5350', // 플레이어 피격 시 텍스트 색상 (빨간색)
  enemyColor:   '#ffffff', // 적 피격 시 텍스트 색상 (흰색)
};
