import { normalize, sub } from '../../math/Vector2.js';

/**
 * EnemyMovementSystem — 적 공통 타이머 틱 + chase 이동
 *
 * 책임:
 *   1) 모든 적 공통: hitFlashTimer 감소, knockbackTimer 감소 및 넉백 이동
 *   2) chase 패턴 전용: 플레이어 방향 추적 이동
 *
 * NOTE(design): hitFlashTimer 는 렌더러의 피격 플래시 표현을 위한 값이지만,
 *   매 프레임 감소가 필요하므로 이 시스템에서 처리한다.
 *   DamageSystem 이 피격 시 세팅하고, EnemyMovementSystem 이 매 프레임 소모한다.
 *   향후 적 수가 크게 늘어나면 EnemyTimerSystem 으로 분리를 검토할 수 있다.
 *
 * 엘리트/보스의 dash·circle_dash 는 EliteBehaviorSystem 이 담당.
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

      // ─── 모든 적 공통: 타이머 틱 ─────────────────────────
      // hitFlashTimer: DamageSystem 이 피격 시 0.1 로 세팅, 여기서 소모
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
      // 엘리트/보스의 dash·circle_dash 는 EliteBehaviorSystem 에서 처리
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
