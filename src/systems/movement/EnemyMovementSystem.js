/**
 * src/systems/movement/EnemyMovementSystem.js — 적 이동 + 넉백 + separation
 *
 * PERF(P1): separation — O(n²) 병목 제거를 위해 SpatialGrid 도입
 *
 * ── MERGED: Bugfix(BUG-4) + Refactor (files3) ───────────────────────
 * Refactor:
 *   getSlowMultiplier(entity) 공통 헬퍼 사용.
 *   distanceSq(a, b) import + 사용 — Vector2 단일 구현으로 위임.
 *
 * Bugfix:
 *   BUG-4: _applySeparation() 에서 stunned 적이 separation 물리에
 *          참여하여 밀려 이동하는 현상 수정 (!e.stunned 체크).
 * ──────────────────────────────────────────────────────────────────────
 */

import { getEnemyBehavior }  from '../../behaviors/enemyBehaviors/enemyBehaviorRegistry.js';
import { SpatialGrid }       from '../../managers/SpatialGrid.js';
import { getSlowMultiplier } from '../../utils/entityUtils.js';
import { distanceSq }        from '../../math/Vector2.js';

const SEPARATION_STRENGTH = 0.35;

export const EnemyMovementSystem = {
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

        // 리팩터링 ①: getSlowMultiplier 공통 헬퍼로 slow 적용
        const effectiveDt = deltaTime * getSlowMultiplier(e);

        const behaviorFn = getEnemyBehavior(e.behaviorId || 'chase');
        behaviorFn(e, { player, enemies, deltaTime: effectiveDt, spawnQueue });
    }

    this._applySeparation(enemies);
  },

  _applySeparation(enemies) {
    this._grid.clear();
    for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        // FIX(BUG-4): stunned 적을 그리드에서 제외 (separation 방지)
        if (e.isAlive && !e.pendingDestroy && e.knockbackTimer <= 0 && !e.stunned) {
            this._grid.insert(e);
        }
    }

    for (let i = 0; i < enemies.length; i++) {
        const a = enemies[i];
        // FIX(BUG-4): a.stunned 체크 추가
        if (!a.isAlive || a.pendingDestroy || a.knockbackTimer > 0 || a.stunned) continue;

        const candidates = this._grid.queryUnique(a);

        for (let j = 0; j < candidates.length; j++) {
            const b = candidates[j];
            if (a === b) continue;
            // FIX(BUG-4): b.stunned 체크 추가
            if (!b.isAlive || b.pendingDestroy || b.knockbackTimer > 0 || b.stunned) continue;
            if (a.id >= b.id) continue;

            // 리팩터링 ②: distanceSq(a, b) 으로 교체
            const dSq = distanceSq(a, b);
            if (dSq === 0) continue;

            const minDist = (a.radius ?? 12) + (b.radius ?? 12);
            if (dSq >= minDist * minDist) continue;

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
        }
    }
  },
};
