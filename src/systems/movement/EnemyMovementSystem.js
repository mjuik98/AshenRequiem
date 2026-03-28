/**
 * src/systems/movement/EnemyMovementSystem.js
 *
 * REFACTOR (R-06): 모듈 레벨 _grid → createEnemyMovementSystem() 팩토리
 *
 * Before (AGENTS.md R-06 위반):
 *   export const EnemyMovementSystem = { _grid: new SpatialGrid(60) }
 *   → 모듈 레벨 상태 — 인스턴스 간 separation 그리드 오염
 *
 * After:
 *   export function createEnemyMovementSystem() → 클로저로 _grid 캡슐화
 *   → PipelineBuilder에서 생성, PlayContext가 생명주기 관리
 *
 * (기존 수정 사항 유지)
 * PERF(P1): separation O(n²) 병목 → SpatialGrid 도입
 * FIX(BUG-4): stunned 적의 separation 물리 참여 방지
 * MERGED: getSlowMultiplier, distanceSq 공통 헬퍼 사용
 */

import { getEnemyBehavior }  from '../../behaviors/enemyBehaviors/enemyBehaviorRegistry.js';
import { SpatialGrid }       from '../../managers/SpatialGrid.js';
import { getSlowMultiplier, isLive } from '../../utils/entityUtils.js';
import { distanceSq }        from '../../math/Vector2.js';
import { COMBAT }            from '../../data/constants.js';

const SEPARATION_STRENGTH = COMBAT.SEPARATION_STRENGTH ?? 0.35;
const SEPARATION_CELL_SIZE = COMBAT.SEPARATION_CELL_SIZE ?? 60;

/**
 * EnemyMovementSystem 인스턴스를 생성한다.
 * 내부 SpatialGrid를 클로저로 캡슐화하여 인스턴스 간 상태 격리를 보장한다.
 *
 * @returns {{ update: Function }}
 */
export function createEnemyMovementSystem() {
  const _grid = new SpatialGrid(SEPARATION_CELL_SIZE);

  function _applySeparation(enemies) {
    _grid.clear();
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      // FIX(BUG-4): stunned 적을 그리드에서 제외
      if (isLive(e) && !e.isProp && e.knockbackTimer <= 0 && !e.stunned) {
        _grid.insert(e);
      }
    }

    for (let i = 0; i < enemies.length; i++) {
      const a = enemies[i];
      // FIX(BUG-4): a.stunned 체크
      if (!isLive(a) || a.isProp || a.knockbackTimer > 0 || a.stunned) continue;

      _grid.forEachUnique(a, (b) => {
        if (a === b) return;
        // FIX(BUG-4): b.stunned 체크
        if (!isLive(b) || b.isProp || b.knockbackTimer > 0 || b.stunned) return;
        if (a.id >= b.id) return;

        const dSq = distanceSq(a, b);
        if (dSq === 0) return;

        const minDist = (a.radius ?? 12) + (b.radius ?? 12);
        if (dSq >= minDist * minDist) return;

        const dist = Math.sqrt(dSq);
        const push = ((minDist - dist) / minDist) * SEPARATION_STRENGTH;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const nx = dx / dist;
        const ny = dy / dist;

        a.x -= nx * push;
        a.y -= ny * push;
        b.x += nx * push;
        b.y += ny * push;
      });
    }
  }

  return {
    update({ world, dt }) {
      const player = world.entities.player;
      const enemies = world.entities.enemies;
      const deltaTime = dt ?? world.runtime.deltaTime;
      const spawnQueue = world.queues.spawnQueue;
      const rng = world.runtime.rng;
      if (!isLive(player)) return;

      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        if (!isLive(e)) continue;
        if (e.isProp) continue;

        // hitFlashTimer 감소
        if (e.hitFlashTimer > 0) {
          e.hitFlashTimer = Math.max(0, e.hitFlashTimer - deltaTime);
        }

        // 넉백 중
        if (e.knockbackTimer > 0) {
          e.knockbackTimer -= deltaTime;
          if (e.knockbackTimer < 0) e.knockbackTimer = 0;
          if (!e.stunned) {
            e.x += e.knockbackX * deltaTime;
            e.y += e.knockbackY * deltaTime;
          }
          continue;
        }

        // 스턴 중
        if (e.stunned) continue;

        // getSlowMultiplier 공통 헬퍼로 slow 적용
        const effectiveDt = deltaTime * getSlowMultiplier(e);

        const behaviorFn = getEnemyBehavior(e.behaviorId || 'chase');
        behaviorFn(e, { player, enemies, deltaTime: effectiveDt, spawnQueue, rng });
      }

      _applySeparation(enemies);
    },
  };
}
