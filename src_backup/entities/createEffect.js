/**
 * src/entities/createEffect.js
 *
 * ── 개선 이력 ──────────────────────────────────────────────────────
 * Before:
 *   createEffect 와 resetEffect 가 동일 필드 목록을 각각 하드코딩.
 *   constants.js의 EFFECT_DEFAULTS.duration 과 entityDefaults.js의
 *   EFFECT_DEFAULTS_SHAPE.maxLifetime 두 곳에 기본값이 분산되어 있었음.
 *
 * After:
 *   EFFECT_DEFAULTS_SHAPE + applyEntityFields 로 단일 소스 관리.
 *   duration → maxLifetime 매핑은 config 전처리 단계에서 1회 처리.
 * ──────────────────────────────────────────────────────────────────
 */

import { generateId }                                from '../utils/ids.js';
import { EFFECT_DEFAULTS_SHAPE, applyEntityFields }  from './entityDefaults.js';

/**
 * createEffect — 시각 이펙트 엔티티 생성
 *
 * @param {object} config
 * @param {number} [config.duration]  maxLifetime 별칭 (하위 호환)
 * @returns {object}
 */
export function createEffect(config = {}) {
  // duration → maxLifetime 별칭 정규화 (하위 호환 유지)
  const normalized = config.duration !== undefined
    ? { ...config, maxLifetime: config.duration }
    : config;

  const effect = {
    id:   generateId(),
    type: 'effect',
  };
  applyEntityFields(effect, EFFECT_DEFAULTS_SHAPE, normalized);
  return effect;
}

/**
 * resetEffect — ObjectPool 리셋 함수
 *
 * @param {object} obj  풀에서 꺼낸 기존 이펙트
 * @param {object} cfg  새 설정
 */
export function resetEffect(obj, cfg = {}) {
  const normalized = cfg.duration !== undefined
    ? { ...cfg, maxLifetime: cfg.duration }
    : cfg;

  obj.id   = generateId();
  obj.type = 'effect';
  applyEntityFields(obj, EFFECT_DEFAULTS_SHAPE, normalized);
}

