import { getEnemyBehavior } from '../../behaviors/enemyBehaviors/enemyBehaviorRegistry.js';
import { SpatialGrid }      from '../../managers/SpatialGrid.js';

/**
 * EnemyMovementSystem — 적 이동 + 넉백 + separation
 *
 * PERF(P1): separation — O(n²) 병목 제거를 위해 SpatialGrid 도입
 *   대규모 스폰 상황에서 뭉침(블랙홀) 현상을 방지하면서도 높은 성능 유지
 */
const SEPARATION_STRENGTH  = 0.35;

export const EnemyMovementSystem = {
  // 셀 크기는 최대 반경(통상 12~24 수준)의 2배 수준으로 설정
  _grid: new SpatialGrid(60),

  update({ world: { player, enemies, deltaTime, spawnQueue } }) {
    if (!player?.isAlive) return;

    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e.isAlive || e.pendingDestroy) continue;

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

      // FIX(BUG-B): slow 상태이상 배율 적용
      // Before: behaviorFn(e, { player, enemies, deltaTime })
      // After:  slow가 있으면 effectiveDeltaTime을 축소하여 이동 속도 감소를 반영.
      //         behaviorFn은 deltaTime을 이동 거리 계산에 사용하므로
      //         deltaTime을 줄이는 것으로 모든 behavior 패턴에 투명하게 적용된다.
      const slowEffect  = e.statusEffects?.find(eff => eff.type === 'slow');
      const speedMult   = slowEffect ? Math.max(0, 1 - slowEffect.magnitude) : 1;
      const effectiveDt = deltaTime * speedMult;

      const behaviorFn = getEnemyBehavior(e.behaviorId || 'chase');
      behaviorFn(e, { player, enemies, deltaTime: effectiveDt, spawnQueue });
    }

    // PERF: SpatialGrid 기반 Separation (개체 수 제한 해제)
    this._applySeparation(enemies);
  },

  _applySeparation(enemies) {
    this._grid.clear();
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (e.isAlive && !e.pendingDestroy && e.knockbackTimer <= 0) {
          this._grid.insert(e);
      }
    }

    for (let i = 0; i < enemies.length; i++) {
      const a = enemies[i];
      if (!a.isAlive || a.pendingDestroy || a.knockbackTimer > 0) continue;

      const candidates = this._grid.queryUnique(a);
      
      for (let j = 0; j < candidates.length; j++) {
        const b = candidates[j];
        if (a === b) continue;
        if (!b.isAlive || b.pendingDestroy || b.knockbackTimer > 0) continue;
        // 쌍 중복 연산 방지 위해 id 비교
        if (a.id >= b.id) continue;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distSq = dx * dx + dy * dy;
        if (distSq === 0) continue;

        const minDist = (a.radius ?? 12) + (b.radius ?? 12);
        if (distSq >= minDist * minDist) continue;

        const dist = Math.sqrt(distSq);
        const push = ((minDist - dist) / minDist) * SEPARATION_STRENGTH;
        const nx = dx / dist, ny = dy / dist;

        a.x -= nx * push;
        a.y -= ny * push;
        b.x += nx * push;
        b.y += ny * push;
      }
    }
  },
};
