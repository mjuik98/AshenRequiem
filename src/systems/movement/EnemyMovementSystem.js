import { normalize, sub } from '../../math/Vector2.js';

/**
 * EnemyMovementSystem — chase 패턴 전용 이동
 *
 * 엘리트/보스의 dash·circle_dash는 EliteBehaviorSystem이 담당.
 * hitFlashTimer·knockback 처리는 behaviorId 무관 모든 적에 적용.
 *
 * 입력: player, enemies, deltaTime
 * 쓰기: 적 위치, hitFlashTimer, knockbackTimer
 */
export const EnemyMovementSystem = {
  update({ player, enemies, deltaTime }) {
    if (!player || !player.isAlive) return;

    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e.isAlive || e.pendingDestroy) continue;

      // ─── 모든 적 공통 처리 ───────────────────────────────
      if (e.hitFlashTimer > 0) {
        e.hitFlashTimer = Math.max(0, e.hitFlashTimer - deltaTime);
      }

      // 넉백 중 — 넉백 방향으로 이동 후 다음 프레임 처리로 넘김
      if (e.knockbackTimer > 0) {
        e.x += e.knockbackX * deltaTime;
        e.y += e.knockbackY * deltaTime;
        e.knockbackTimer = Math.max(0, e.knockbackTimer - deltaTime);
        if (e.knockbackTimer === 0) { e.knockbackX = 0; e.knockbackY = 0; }
        continue;
      }

      // ─── chase 전용 이동 ────────────────────────────────
      // 엘리트/보스의 dash·circle_dash는 EliteBehaviorSystem에서 처리
      if (e.behaviorId !== 'chase') continue;
      if (e.stunned) continue;

      const dir = normalize(sub(
        { x: player.x, y: player.y },
        { x: e.x,      y: e.y      },
      ));
      e.x += dir.x * e.moveSpeed * deltaTime;
      e.y += dir.y * e.moveSpeed * deltaTime;
    }
  },
};
