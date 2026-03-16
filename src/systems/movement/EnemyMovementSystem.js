/**
 * EnemyMovementSystem — 적 이동 + 넉백 + separation
 *
 * PERF: separation — 적 수가 SEPARATION_MAX_ENEMIES 초과 시 연산 스킵
 *   대규모 스폰 상황에서 O(n²) 병목 완화
 */
const SEPARATION_STRENGTH  = 0.35;
const SEPARATION_MAX_DIST  = 60;
const SEPARATION_MAX_ENEMIES = 80; // 이 수 이하일 때만 separation 실행

export const EnemyMovementSystem = {
  update({ player, enemies, deltaTime }) {
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

      // 엘리트 / 보스 중 chase 가 아닌 것은 EliteBehaviorSystem이 담당
      if (e.behaviorId !== 'chase' && (e.isElite || e.isBoss)) continue;

      // 플레이어 추적
      const dx   = player.x - e.x;
      const dy   = player.y - e.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;

      const slow      = e.statusEffects?.find(s => s.type === 'slow');
      const speedMult = slow ? (1 - slow.magnitude) : 1;
      const speed     = (e.moveSpeed ?? 80) * speedMult * deltaTime;

      if (dist > 1) {
        e.x += (dx / dist) * speed;
        e.y += (dy / dist) * speed;
      }
    }

    // PERF: 적 수 임계값 초과 시 separation 스킵
    if (enemies.length <= SEPARATION_MAX_ENEMIES) {
      this._applySeparation(enemies);
    }
  },

  _applySeparation(enemies) {
    const maxDistSq = SEPARATION_MAX_DIST * SEPARATION_MAX_DIST;

    for (let i = 0; i < enemies.length; i++) {
      const a = enemies[i];
      if (!a.isAlive || a.pendingDestroy || a.knockbackTimer > 0) continue;

      for (let j = i + 1; j < enemies.length; j++) {
        const b = enemies[j];
        if (!b.isAlive || b.pendingDestroy || b.knockbackTimer > 0) continue;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distSq = dx * dx + dy * dy;
        if (distSq > maxDistSq || distSq === 0) continue;

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
