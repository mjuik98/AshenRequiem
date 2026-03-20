/**
 * src/data/constants/spawn.js — 스폰 / 풀 관련 상수
 *
 * REFACTOR: constants.js God File 분리
 *   SPAWN 영역 추출
 */

export const SPAWN = {
  /** 스폰 시작 웨이브 인터벌 (s) */
  WAVE_INTERVAL_INITIAL: 5,
  /** 웨이브당 최소 추가 스폰 수 */
  WAVE_ENEMY_MIN: 3,
  /** 웨이브당 최대 추가 스폰 수 */
  WAVE_ENEMY_MAX: 8,
  /** 플레이어 주변 스폰 금지 반지름 (px) */
  SPAWN_SAFE_RADIUS: 300,
  /** 스폰 가능 최대 반지름 (px) */
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
