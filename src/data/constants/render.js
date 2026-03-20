/**
 * src/data/constants/render.js — 렌더링 관련 상수
 *
 * REFACTOR: constants.js God File 분리
 *   RENDER, DAMAGE_TEXT, EFFECT_DEFAULTS 영역 추출
 */

export const RENDER = {
  /** 투사체 수가 이 값 초과 시 글로우 효과 비활성화 (성능) */
  GLOW_THRESHOLD: 60,
  /** 데미지 텍스트 부유 높이 (px) */
  DAMAGE_TEXT_RISE: 28,
  /** 데미지 텍스트 최대 수명 (s) */
  DAMAGE_TEXT_LIFETIME: 0.8,
  /** 체력바 너비 (px) */
  HP_BAR_WIDTH: 32,
  /** 체력바 높이 (px) */
  HP_BAR_HEIGHT: 4,
  /** 체력바 위치 오프셋 (px) */
  HP_BAR_OFFSET_Y: 8,
  /** 레벨업 플래시 수명 (s) */
  LEVEL_FLASH_LIFETIME: 0.5,
  /** 글로우 임계값 (렌더용 별칭) */
  GLOW_THRESHOLD_RENDER: 50,
  /** 화면 밖 엔티티 렌더 스킵 마진 (px) */
  CULL_MARGIN: 80,
  /** 카메라 부드러움 계수 (0~1, 1 = 즉시) */
  CAMERA_LERP: 0.12,
};

export const DAMAGE_TEXT = {
  MAX_PER_FRAME: 12,
  COLOR_ENEMY:   '#ef5350',
  COLOR_PLAYER:  '#ffffff',
  COLOR_CRIT:    '#ffd740',   // 크리티컬 피해 — 황금색
  DURATION:      0.5,
};

export const EFFECT_DEFAULTS = {
  duration:           0.5,
  burstDuration:      0.45,
  levelFlashDuration: 0.6,
};
