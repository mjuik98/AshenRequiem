/**
 * ProjectileSystem — 투사체 이동 + 수명 관리
 *
 * 입력: projectiles, player, deltaTime
 * 쓰기: 투사체 위치, pendingDestroy
 *
 * FIX(bug): orbit 투사체 — player 가 null 일 때 마지막 위치에 고정된 채로
 *   isAlive=true 유지 → 잘못된 충돌 판정 유발.
 *   이후: player null 시 즉시 pendingDestroy 처리.
 *
 * behaviorId 처리:
 *   - 'orbit'              : 매 프레임 각도 증가 후 player 기준 절대 위치 갱신
 *   - 'areaBurst'          : 이동 없이 수명만 소진
 *   - 'targetProjectile'   : 방향으로 이동, 사거리·관통 초과 시 제거
 */
export const ProjectileSystem = {
  update({ projectiles, player, deltaTime }) {
    for (let i = 0; i < projectiles.length; i++) {
      const p = projectiles[i];
      if (!p.isAlive || p.pendingDestroy) continue;

      if (p.behaviorId === 'orbit') {
        // FIX(bug): player 없으면 orbit 기준점이 없으므로 즉시 제거
        if (!player) {
          p.isAlive = false;
          p.pendingDestroy = true;
          continue;
        }

        p.orbitAngle += p.orbitSpeed * deltaTime;
        p.x = player.x + Math.cos(p.orbitAngle) * p.orbitRadius;
        p.y = player.y + Math.sin(p.orbitAngle) * p.orbitRadius;
        p.lifetime += deltaTime;
        if (p.lifetime >= p.maxLifetime) { p.isAlive = false; p.pendingDestroy = true; }

      } else if (p.behaviorId === 'areaBurst') {
        p.lifetime += deltaTime;
        if (p.lifetime >= p.maxLifetime) { p.isAlive = false; p.pendingDestroy = true; }

      } else {
        const dist = p.speed * deltaTime;
        p.x += p.dirX * dist;
        p.y += p.dirY * dist;
        p.distanceTraveled += dist;
        if (p.distanceTraveled >= p.maxRange) { p.isAlive = false; p.pendingDestroy = true; }
      }

      // 관통 횟수 초과 (orbit / areaBurst 제외)
      if (p.hitCount >= p.pierce && p.behaviorId === 'targetProjectile') {
        p.isAlive = false; p.pendingDestroy = true;
      }
    }
  },
};
