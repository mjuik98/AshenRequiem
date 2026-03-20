/**
 * src/behaviors/enemyBehaviors/enemyBehaviorRegistry.js
 *
 * [FIX P0-1] dash, circle_dash 등록 추가
 *
 * Before:
 *   registry = { chase, charge, circle, keepDistance, swarm }
 *   → npm run validate에서 elite_golem, elite_bat, elite_skeleton, boss_lich의
 *     behaviorId 'dash' / 'circle_dash' 경고 4건 발생.
 *   → EnemyMovementSystem이 엘리트를 처리할 때 getEnemyBehavior('dash') → chase fallback
 *     적용되어 EliteBehaviorSystem과 이중 이동 발생.
 *
 * After:
 *   dash / circle_dash를 레지스트리에 등록.
 *   EnemyMovementSystem.update()에서 spawnQueue를 context에 포함해 전달해야 함:
 *
 *     behaviorFn(e, { player, enemies, deltaTime: effectiveDt, spawnQueue });
 *
 *   EliteBehaviorSystem은 behaviorId가 dash/circle_dash인 경우 skip하도록
 *   조건을 추가하거나, 완전히 제거하고 이 레지스트리에 위임한다.
 *
 * 새 enemy behavior 추가 방법:
 *   1. src/behaviors/enemyBehaviors/myBehavior.js 생성
 *   2. 아래 import + registry 객체에 2줄 추가
 *   3. npm run validate 로 검증
 */

import { chase }       from './chase.js';
import { charge }      from './charge.js';
import { circle }      from './circle.js';
import { keepDistance } from './keepDistance.js';
import { swarm }       from './swarm.js';
import { dash }        from './dash.js';
import { circleDash }  from './circleDash.js';

const registry = {
  chase,
  charge,
  circle,
  keepDistance,
  swarm,
  // ── 엘리트 / 보스 전용 ─────────────────────────────────
  dash,
  circle_dash: circleDash,
};

/**
 * behaviorId로 적 행동 함수를 반환한다.
 * 등록되지 않은 id는 chase로 폴백.
 *
 * 반환된 함수 시그니처:
 *   handler(enemy, { player, enemies, deltaTime, spawnQueue }) → void
 *
 * @param {string} [behaviorId]
 * @returns {Function}
 */
export function getEnemyBehavior(behaviorId) {
  return registry[behaviorId] ?? registry.chase;
}

/**
 * 새로운 행동 패턴을 런타임에 등록한다. (테스트 / 모드 지원용)
 *
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

/**
 * 등록된 모든 behaviorId 목록을 반환한다. (validateData / 디버그용)
 *
 * @returns {string[]}
 */
export function listEnemyBehaviors() {
  return Object.keys(registry);
}
