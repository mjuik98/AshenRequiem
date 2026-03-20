/**
 * src/data/constants/progression.js — 성장 / 보스 / 디버그 관련 상수
 *
 * REFACTOR: constants.js God File 분리
 *   PROGRESSION, BOSS, DEBUG, XP_TABLE, getXpForLevel 영역 추출
 */

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

export const BOSS = {
  /** 첫 보스 등장 시간 (s) */
  FIRST_BOSS_TIME: 120,
  /** 보스 재등장 인터벌 (s) */
  BOSS_INTERVAL: 180,
  /** 보스 체력 배율 */
  BOSS_HP_MULTIPLIER: 30,
  /** 보스 데미지 배율 */
  BOSS_DAMAGE_MULTIPLIER: 2.5,
};

export const DEBUG = {
  /** PipelineProfiler 경고 임계값 (프레임 예산 대비 비율, 0~1) */
  PROFILER_WARN_THRESHOLD: 0.35,
  /** 프로파일 시뮬레이션 기본 프레임 수 */
  PROFILER_FRAME_COUNT: 300,
};

export const XP_TABLE = [0, 5, 12, 22, 35, 50, 70, 95, 125, 160, 200];

export function getXpForLevel(level) {
  if (level < XP_TABLE.length) return XP_TABLE[level];
  return XP_TABLE[XP_TABLE.length - 1] + (level - XP_TABLE.length + 1) * 50;
}
