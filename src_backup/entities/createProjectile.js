/**
 * src/entities/createProjectile.js
 *
 * ── 개선 이력 ──────────────────────────────────────────────────────
 * Before:
 *   createProjectile 과 resetProjectile 이 18개 필드를 각각 수동 나열.
 *   필드 1개 추가·변경 시 두 함수를 모두 수정해야 하는 유지보수 부담.
 *   예) orbitSpeed 필드 추가 당시 reset에 누락될 위험.
 *
 * After:
 *   PROJECTILE_DEFAULTS + applyEntityFields 활용.
 *   - createProjectile: 불변 필드(id, type, hitCount, hitTargets) + applyEntityFields
 *   - resetProjectile:  불변 필드(id, type) 갱신 + hitTargets.clear() + applyEntityFields
 *   필드 변경은 entityDefaults.js 의 PROJECTILE_DEFAULTS 한 곳만 수정.
 * ──────────────────────────────────────────────────────────────────
 */

import { generateId }                              from '../utils/ids.js';
import { PROJECTILE_DEFAULTS, applyEntityFields }  from './entityDefaults.js';

/**
 * createProjectile — 투사체 엔티티 생성
 *
 * @param {Partial<typeof PROJECTILE_DEFAULTS>} config
 * @returns {object}
 */
export function createProjectile(config = {}) {
  const proj = {
    id:        generateId(),
    type:      'projectile',
    hitCount:  0,
    hitTargets: new Set(),
  };
  applyEntityFields(proj, PROJECTILE_DEFAULTS, config);
  return proj;
}

/**
 * resetProjectile — ObjectPool 리셋 함수
 *
 * createProjectile 과 PROJECTILE_DEFAULTS 를 공유하므로
 * 필드 목록이 자동으로 동기화된다.
 *
 * @param {object} obj  풀에서 꺼낸 기존 투사체
 * @param {object} cfg  새 설정
 */
export function resetProjectile(obj, cfg) {
  obj.id   = generateId();
  obj.type = 'projectile';
  obj.hitCount = 0;
  obj.hitTargets.clear();          // Set 재사용 (GC 절약)
  applyEntityFields(obj, PROJECTILE_DEFAULTS, cfg);
}

