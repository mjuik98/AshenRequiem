import { chase } from './chase.js';
import { charge } from './charge.js';
import { circle } from './circle.js';
import { keepDistance } from './keepDistance.js';
import { swarm } from './swarm.js';

/**
 * enemyBehaviorRegistry — 적 AI 행동 패턴 레지스트리
 *
 * CHANGE(P-②): behaviors/enemyBehaviors/ 하위 파일로 로직 분리
 */

const registry = {
  chase,
  charge,
  circle,
  keepDistance,
  swarm,
};

/**
 * @param {string} [behaviorId]
 * @returns {Function}  handler(enemy, context) → void
 */
export function getEnemyBehavior(behaviorId) {
  return registry[behaviorId] ?? registry.chase;
}

/**
 * 새로운 행동 패턴을 런타임에 등록한다. (테스트 또는 mod 지원용)
 * @param {string}   id
 * @param {Function} handler
 */
export function registerEnemyBehavior(id, handler) {
  if (typeof handler !== 'function') {
    console.warn(`[enemyBehaviorRegistry] handler는 함수여야 합니다: ${id}`);
    return;
  }
  if (registry[id]) {
    console.warn(`[enemyBehaviorRegistry] 이미 등록된 id를 덮어씁니다: ${id}`);
  }
  registry[id] = handler;
}

/** 등록된 모든 behaviorId 목록 반환 (디버그용) */
export function listEnemyBehaviors() {
  return Object.keys(registry);
}
