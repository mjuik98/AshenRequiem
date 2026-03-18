/**
 * src/data/constants.js — 게임 상수 정의 (Merged Expansion Package)
 *
 * 단위 규약:
 *   cooldown: 초 / moveSpeed: px/s / moveSpeed: px/s
 *   range: px / radius: px / rotationSpeed: rad/s / spawnPerSecond: 개/s
 */

// ── 렌더링 ────────────────────────────────────────────────────────────────
export const RENDER = {
  /** 적 수가 이 값 초과 시 글로우 효과 비활성화 (성능) */
  GLOW_THRESHOLD: 60,
  /** 데미지 텍스트 부유 높이 (px) */
  DAMAGE_TEXT_RISE: 28,
  /** 데미지 텍스트 최대 수명 (s) */
  DAMAGE_TEXT_LIFETIME: 0.8,
  /** 체력바 너비 (px) */
  HP_BAR_WIDTH: 32,
  /** 체력바 높이 (px) */
  HP_BAR_HEIGHT: 4,
  /** 체력바 위치 오프셋 (적 반지름 기준, px) */
  HP_BAR_OFFSET_Y: 8,
  /** 레벨업 플래시 수명 (s) */
  LEVEL_FLASH_LIFETIME: 0.5,
  /** 가로등/빛 효과 글로우 임계값 */
  GLOW_THRESHOLD_RENDER: 50,
  /** 화면 밖 엔티티 렌더 스킵 마진 (px) */
  CULL_MARGIN: 80,
  /** 카메라 부드러움 계수 (0~1, 1 = 즉시) */
  CAMERA_LERP: 0.12,
};

// ── 전투 ─────────────────────────────────────────────────────────────────
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

// ── 스폰 ─────────────────────────────────────────────────────────────────
export const SPAWN = {
  /** 스폰 시작 웨이브 인터벌 (s) */
  WAVE_INTERVAL_INITIAL: 5,
  /** 웨이브당 최소 추가 스폰 수 */
  WAVE_ENEMY_MIN: 3,
  /** 웨이브당 최대 추가 스폰 수 */
  WAVE_ENEMY_MAX: 8,
  /** 플레이어 주변 스폰 금지 반지름 (px) */
  SPAWN_SAFE_RADIUS: 300,
  /** 스폰 가능 최대 반지름 (px, 화면 대각선 기준) */
  SPAWN_MAX_RADIUS: 700,
  /** ObjectPool 초기 크기: 적 */
  POOL_ENEMY_INITIAL: 150,
  /** ObjectPool 초기 크기: 투사체 */
  POOL_PROJECTILE_INITIAL: 200,
  /** ObjectPool 초기 크기: 이펙트 */
  POOL_EFFECT_INITIAL: 100,
  /** ObjectPool 초기 크기: 픽업 */
  POOL_PICKUP_INITIAL: 80,
};

// ── 레벨 & 경험치 ─────────────────────────────────────────────────────────
export const PROGRESSION = {
  /** 레벨업 선택지 수 */
  UPGRADE_CHOICES: 3,
  /** 레벨 1→2 기준 XP */
  XP_BASE: 10,
  /** 레벨당 XP 증가 배율 */
  XP_SCALE: 1.4,
  /** 최대 레벨 */
  MAX_LEVEL: 50,
};

// ── 보스 ─────────────────────────────────────────────────────────────────
export const BOSS = {
  /** 첫 보스 등장 시간 (s) */
  FIRST_BOSS_TIME: 120,
  /** 보스 재등장 인터벌 (s) */
  BOSS_INTERVAL: 180,
  /** 보스 체력 배율 (일반 적 대비) */
  BOSS_HP_MULTIPLIER: 30,
  /** 보스 데미지 배율 */
  BOSS_DAMAGE_MULTIPLIER: 2.5,
};

// ── 디버그 ────────────────────────────────────────────────────────────────
export const DEBUG = {
  /** PipelineProfiler 경고 임계값 (프레임 예산 대비 비율, 0~1) */
  PROFILER_WARN_THRESHOLD: 0.35,
  /** 프로파일 시뮬레이션 기본 프레임 수 */
  PROFILER_FRAME_COUNT: 300,
};

// ── 플레이어 기본값 (Legacy Compatibility) ──────────────────────────────
export const PLAYER_DEFAULTS = {
  hp:           100,
  maxHp:        100,
  moveSpeed:    200,
  radius:       16,
  magnetRadius: 60,
  color:        '#4fc3f7',
};

// ── XP 테이블 (Legacy Compatibility) ────────────────────────────────────
export const XP_TABLE = [
  0, 5, 12, 22, 35, 50, 70, 95, 125, 160, 200
];

export function getXpForLevel(level) {
  if (level < XP_TABLE.length) return XP_TABLE[level];
  return XP_TABLE[XP_TABLE.length - 1] + (level - XP_TABLE.length + 1) * 50;
}

// ── 픽업 기본값 (Legacy Compatibility) ──────────────────────────────────
export const PICKUP_DEFAULTS = {
  xpValue:     1,
  radius:      6,
  color:       '#66bb6a',
  magnetSpeed: 400,
};

// ── 이펙트 기본값 (Legacy Compatibility) ────────────────────────────────
export const EFFECT_DEFAULTS = {
  duration:           0.4,
  burstDuration:      0.45,
  levelFlashDuration: 0.6,
};

// ── 데미지 텍스트 (Legacy Compatibility) ────────────────────────────────
export const DAMAGE_TEXT = {
  MAX_PER_FRAME: 12,
  COLOR_ENEMY:   '#ef5350',
  COLOR_PLAYER:  '#ffffff',
  DURATION:      0.5,
};

// ── 넉백 (Legacy Compatibility) ─────────────────────────────────────────
export const KNOCKBACK = {
  speed:    320,
  duration: 0.18,
};

// ── 이벤트 타입 목록 (Single Source of Truth) ───────────────────────────
export const EVENT_TYPES = [
  'hits',
  'deaths',
  'pickupCollected',
  'levelUpRequested',
  'statusApplied',
  'bossPhaseChanged',
  'spawnRequested',
];

export const COLLISION_CULL_MARGIN = 600;
export const ELITE_BEHAVIOR = {
  DASH_SPEED:        520,
  CIRCLE_DASH_SPEED: 480,
};
