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

    const dir = input.getDirection();
    if (dir.x !== 0 || dir.y !== 0) {
      const speedMult = getSlowMultiplier(player);

      player.x += dir.x * player.moveSpeed * speedMult * deltaTime;
      player.y += dir.y * player.moveSpeed * speedMult * deltaTime;
      player.facingX = dir.x;
      player.facingY = dir.y;
    }

    if (player.invincibleTimer > 0) {
      player.invincibleTimer = Math.max(0, player.invincibleTimer - deltaTime);
    }
  },
};
