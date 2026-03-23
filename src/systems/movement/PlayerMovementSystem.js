/**
 * src/systems/movement/PlayerMovementSystem.js — 플레이어 이동 + 무적 타이머 감소
 *
 * ── 리팩터링 이력 ─────────────────────────────────────────────────────
 * Before:
 *   slow 속도 배율 계산을 인라인으로 직접 수행:
 *     const slow = player.statusEffects?.find(e => e.type === 'slow');
 *     const speedMult = slow ? (1 - slow.magnitude) : 1;
 *   EnemyMovementSystem.js 의 동일 패턴과 Math.max(0, ...) 유무 차이 존재.
 *
 * After:
 *   getSlowMultiplier(entity) 공통 헬퍼 사용 — 두 시스템 동일 구현으로 통일.
 * ──────────────────────────────────────────────────────────────────────
 */

import { getSlowMultiplier } from '../../utils/entityUtils.js';

export const PlayerMovementSystem = {
  update({ input, world: { player, deltaTime } }) {
    if (!player?.isAlive) return;

    let dirX = 0;
    let dirY = 0;

    if (typeof input?.moveX === 'number' && typeof input?.moveY === 'number') {
      const rawX = input.moveX;
      const rawY = input.moveY;

      if (rawX !== 0 || rawY !== 0) {
        if (rawX === 0 || rawY === 0) {
          dirX = rawX;
          dirY = rawY;
        } else {
          const length = Math.hypot(rawX, rawY) || 1;
          dirX = rawX / length;
          dirY = rawY / length;
        }
      }
    } else if (typeof input?.getDirection === 'function') {
      const dir = input.getDirection();
      dirX = dir.x;
      dirY = dir.y;
    }

    if (dirX !== 0 || dirY !== 0) {
      const speedMult = getSlowMultiplier(player);

      player.x += dirX * player.moveSpeed * speedMult * deltaTime;
      player.y += dirY * player.moveSpeed * speedMult * deltaTime;
      player.facingX = dirX;
      player.facingY = dirY;
    }

    if (player.invincibleTimer > 0) {
      const nextInvincibleTimer = player.invincibleTimer - deltaTime;
      player.invincibleTimer = nextInvincibleTimer > 0 ? nextInvincibleTimer : 0;
    }
  },
};
