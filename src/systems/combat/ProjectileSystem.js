/**
 * ProjectileSystem — 투사체 이동 + 수명 관리
 * FIX(bug): orbit 투사체 — player null 시 즉시 pendingDestroy
 */
export const ProjectileSystem = {
  update({ world: { projectiles, player, deltaTime } }) {
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
        // 절반 거리 도달 시 반전 및 플레이어 추적
        if (!p._reversed && p.distanceTraveled >= p.maxRange / 2) {
          p._reversed = true;
          p.distanceTraveled = p.maxRange / 2; // 안전장치
        }
        
        if (p._reversed && player) {
          // 플레이어 쪽으로 방향 갱신
          const dx = player.x - p.x;
          const dy = player.y - p.y;
          const distSq = dx * dx + dy * dy;
          
          if (distSq < 400) { // 원점(플레이어) 도달 시 소멸
            p.distanceTraveled = p.maxRange; 
          } else {
            const len = Math.sqrt(distSq);
            p.dirX = len > 0 ? dx / len : 0;
            p.dirY = len > 0 ? dy / len : 0;
          }
        }
        // 전체 거리가 아닌 플레이어 도달 시에만 소멸하도록 변경
        // (플레이어가 도망가면 maxRange를 초과 이동해도 계속 쫓아감)
        if (!p._reversed && p.distanceTraveled >= p.maxRange) {
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
