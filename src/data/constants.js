/**
 * src/data/constants.js — 게임 상수 정의
 *
 * CHANGE(P2-②): GLOW_THRESHOLD를 RenderSystem 하드코딩에서 이 파일로 이동
 *   Before: RenderSystem.js 최상단에 const GLOW_THRESHOLD = 50 하드코딩
 *   After:  constants.js RENDER 네임스페이스 아래에서 중앙 관리
 *
 * CHANGE(P2-④): EVENT_TYPES 상수 추가
 *   Before: createWorld.js와 EventRegistry.clearAll()에서 수동 동기화
 *   After:  EVENT_TYPES 배열에서 단일 관리
 *           createWorld.js:  events 객체를 EVENT_TYPES.reduce()로 생성
 *           EventRegistry:   EVENT_TYPES.forEach()로 clearAll() 루프
 *
 * 단위 규약:
 *   cooldown: 초 / moveSpeed: px/s / projectileSpeed: px/s
 *   range: px / radius: px / rotationSpeed: rad/s / spawnPerSecond: 개/s
 */

// ── 플레이어 기본값 ───────────────────────────────────────────────────
export const PLAYER_DEFAULTS = {
  hp:           100,
  maxHp:        100,
  moveSpeed:    200,
  radius:       16,
  magnetRadius: 60,
  color:        '#4fc3f7',
};

// ── XP 테이블 ─────────────────────────────────────────────────────────
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

export function getXpForLevel(level) {
  if (level < XP_TABLE.length) return XP_TABLE[level];
  return XP_TABLE[XP_TABLE.length - 1] + (level - XP_TABLE.length + 1) * 50;
}

// ── 픽업 기본값 ───────────────────────────────────────────────────────
export const PICKUP_DEFAULTS = {
  xpValue:     1,
  radius:      6,
  color:       '#66bb6a',
  magnetSpeed: 400,
};

// ── 이펙트 기본값 ─────────────────────────────────────────────────────
export const EFFECT_DEFAULTS = {
  duration:           0.4,
  burstDuration:      0.45,
  levelFlashDuration: 0.6,
};

// ── 데미지 텍스트 ─────────────────────────────────────────────────────
export const DAMAGE_TEXT = {
  MAX_PER_FRAME: 12,
  COLOR_ENEMY:   '#ef5350',
  COLOR_PLAYER:  '#ffffff',
  DURATION:      0.5,
};

// ── 넉백 ─────────────────────────────────────────────────────────────
export const KNOCKBACK = {
  speed:    320,
  duration: 0.18,
};

// ── 충돌 컬링 ─────────────────────────────────────────────────────────
export const COLLISION_CULL_MARGIN = 600;

// ── 엘리트 행동 ───────────────────────────────────────────────────────
export const ELITE_BEHAVIOR = {
  DASH_SPEED:        520,
  CIRCLE_DASH_SPEED: 480,
};

// ── 렌더링 상수 ───────────────────────────────────────────────────────
// CHANGE(P2-②): GLOW_THRESHOLD 이전 (RenderSystem.js 하드코딩 제거)
export const RENDER = {
  /** 투사체 수가 이 값을 초과하면 글로우 비활성화 (lowQuality 모드) */
  GLOW_THRESHOLD:     50,
  /** 화면 밖 엔티티 렌더 스킵 마진 (px) */
  CULL_MARGIN:        80,
};

// ── 이벤트 타입 목록 ─────────────────────────────────────────────────
// CHANGE(P2-④): 단일 진실의 원천 — createWorld.js, EventRegistry 모두 이 배열 사용
//
// 사용 방법:
//   // createWorld.js
//   import { EVENT_TYPES } from '../data/constants.js';
//   events: EVENT_TYPES.reduce((acc, t) => ({ ...acc, [t]: [] }), {})
//
//   // EventRegistry.clearAll(events)
//   import { EVENT_TYPES } from '../../data/constants.js';
//   export function clearAll(events) {
//     for (const type of EVENT_TYPES) {
//       if (events[type]) events[type].length = 0;
//     }
//   }
//
// 새 이벤트 타입 추가 = 이 배열에 1줄 추가만 하면 됨.
export const EVENT_TYPES = [
  'hits',
  'deaths',
  'pickupCollected',
  'levelUpRequested',
  'statusApplied',
  'bossPhaseChanged',
  'spawnRequested',
];
