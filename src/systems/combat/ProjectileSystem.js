/**
 * src/systems/combat/ProjectileSystem.js — 투사체 이동 + 수명 관리
 *
 * FIX(bug): orbit 투사체 — player null 시 즉시 pendingDestroy
 *
 * CHANGE(P-⑭ / boomerang): boomerang 이동 분기 추가
 *   Before: boomerang behaviorId가 else 분기(일반 직선 이동)로 처리되어
 *           maxRange 도달 시 소멸만 되고 반전·귀환이 없었음.
 *   After:  전용 분기에서:
 *             1. 직선 이동 + distanceTraveled 누적
 *             2. maxRange/2 도달 시 _reversed=true, 방향 클램프
 *             3. _reversed 중 플레이어 방향으로 dirX/Y 갱신
 *             4. 플레이어로부터 20px(반경 제곱 400) 이내 → 소멸
 *             5. player null이면 즉시 소멸 (BUG-C 방지)
 *
 * FIX(BUG-C): 귀환 중 player가 null이면 무한 이동 방지
 */
export const ProjectileSystem = {
  update({ world: { projectiles, player, deltaTime } }) {
    for (let i = 0; i < projectiles.length; i++) {
      const p = projectiles[i];
      if (!p.isAlive || p.pendingDestroy) continue;

      // ── orbit ────────────────────────────────────────────────────────
      if (p.behaviorId === 'orbit') {
        if (!player) { p.isAlive = false; p.pendingDestroy = true; continue; }
        p.orbitAngle += p.orbitSpeed * deltaTime;
        p.x = player.x + Math.cos(p.orbitAngle) * p.orbitRadius;
        p.y = player.y + Math.sin(p.orbitAngle) * p.orbitRadius;
        p.lifetime += deltaTime;
        if (p.lifetime >= p.maxLifetime) { p.isAlive = false; p.pendingDestroy = true; }

      // ── areaBurst ────────────────────────────────────────────────────
      } else if (p.behaviorId === 'areaBurst') {
        p.lifetime += deltaTime;
        if (p.lifetime >= p.maxLifetime) { p.isAlive = false; p.pendingDestroy = true; }

      // ── boomerang ────────────────────────────────────────────────────
      } else if (p.behaviorId === 'boomerang') {
        const dist = p.speed * deltaTime;
        p.x += p.dirX * dist;
        p.y += p.dirY * dist;
        p.distanceTraveled = (p.distanceTraveled ?? 0) + dist;

        // 절반 거리 도달 시 반전 플래그 ON + distanceTraveled 클램프
        if (!p._reversed && p.distanceTraveled >= p.maxRange / 2) {
          p._reversed = true;
          // 안전장치: 정확히 절반 지점으로 고정 (과초과 방지)
          p.distanceTraveled = p.maxRange / 2;
        }

        if (p._reversed) {
          // FIX(BUG-C): player 없으면 귀환 대상 없음 → 즉시 소멸
          if (!player) {
            p.isAlive = false;
            p.pendingDestroy = true;
            continue;
          }

          // 플레이어 방향으로 dir 갱신
          const dx     = player.x - p.x;
          const dy     = player.y - p.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < 400) {
            // 플레이어 반경(20px) 안에 도달 → 소멸
            p.distanceTraveled = p.maxRange;
            p.isAlive          = false;
            p.pendingDestroy   = true;
          } else {
            const len = Math.sqrt(distSq);
            p.dirX = dx / len;
            p.dirY = dy / len;
          }
        } else if (p.distanceTraveled >= p.maxRange) {
          // 발사 방향으로 maxRange를 넘어도 반전이 없으면 소멸
          p.isAlive = false;
          p.pendingDestroy = true;
        }

      // ── 일반 직선 투사체 ─────────────────────────────────────────────
      } else {
        const dist = p.speed * deltaTime;
        p.x += p.dirX * dist;
        p.y += p.dirY * dist;
        p.distanceTraveled = (p.distanceTraveled ?? 0) + dist;
        if (p.distanceTraveled >= p.maxRange) { p.isAlive = false; p.pendingDestroy = true; }
        if (p.hitCount >= p.pierce)           { p.isAlive = false; p.pendingDestroy = true; }
      }
    }
  },
};
