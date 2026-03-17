/**
 * ProjectileSystem — 투사체 이동 + 수명 관리
 * FIX(bug): orbit 투사체 — player null 시 즉시 pendingDestroy
 */
export const ProjectileSystem = {
  update({ projectiles, player, deltaTime }) {
    for (let i = 0; i < projectiles.length; i++) {
      const p = projectiles[i];
      if (!p.isAlive || p.pendingDestroy) continue;

      if (p.behaviorId === 'orbit') {
        if (!player) { p.isAlive = false; p.pendingDestroy = true; continue; }
        p.orbitAngle += p.orbitSpeed * deltaTime;
        p.x = player.x + Math.cos(p.orbitAngle) * p.orbitRadius;
        p.y = player.y + Math.sin(p.orbitAngle) * p.orbitRadius;
        p.lifetime += deltaTime;
        if (p.lifetime >= p.maxLifetime) { p.isAlive = false; p.pendingDestroy = true; }

      } else if (p.behaviorId === 'areaBurst') {
        p.lifetime += deltaTime;
        if (p.lifetime >= p.maxLifetime) { p.isAlive = false; p.pendingDestroy = true; }

      } else if (p.behaviorId === 'boomerang') {
        const dist = p.speed * deltaTime;
        p.x += p.dirX * dist;
        p.y += p.dirY * dist;
        p.distanceTraveled += dist;
        // 절반 거리 도달 시 반전
        if (!p._reversed && p.distanceTraveled >= p.maxRange / 2) {
          p.dirX *= -1;
          p.dirY *= -1;
          p._reversed = true;
        }
        // 전체 거리(왕복) 소멸
        if (p.distanceTraveled >= p.maxRange) {
          p.isAlive = false;
          p.pendingDestroy = true;
        }

      } else {
        const dist = p.speed * deltaTime;
        p.x += p.dirX * dist;
        p.y += p.dirY * dist;
        p.distanceTraveled += dist;
        if (p.distanceTraveled >= p.maxRange) { p.isAlive = false; p.pendingDestroy = true; }
        if (p.hitCount >= p.pierce)           { p.isAlive = false; p.pendingDestroy = true; }
      }
    }
  },
};
