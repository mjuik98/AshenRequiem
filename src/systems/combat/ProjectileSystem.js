/**
 * ProjectileSystem — 투사체 이동 + 수명 관리
 *
 * 입력: projectiles, deltaTime
 * 쓰기: 투사체 위치, pendingDestroy
 */
export const ProjectileSystem = {
  update({ projectiles, deltaTime }) {
    for (let i = 0; i < projectiles.length; i++) {
      const p = projectiles[i];
      if (!p.isAlive || p.pendingDestroy) continue;

      if (p.behaviorId === 'areaBurst') {
        // 범위 공격은 이동하지 않고 수명만 소진
        p.lifetime += deltaTime;
        if (p.lifetime >= p.maxLifetime) {
          p.isAlive = false;
          p.pendingDestroy = true;
        }
      } else {
        // 일반 투사체: 방향으로 이동
        const dist = p.speed * deltaTime;
        p.x += p.dirX * dist;
        p.y += p.dirY * dist;
        p.distanceTraveled += dist;

        // 사거리 초과
        if (p.distanceTraveled >= p.maxRange) {
          p.isAlive = false;
          p.pendingDestroy = true;
        }
      }

      // 관통 횟수 초과
      if (p.hitCount >= p.pierce && p.behaviorId !== 'areaBurst') {
        p.isAlive = false;
        p.pendingDestroy = true;
      }
    }
  },
};
