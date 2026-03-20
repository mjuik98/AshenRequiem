/**
 * src/systems/combat/ProjectileSystem.js — 투사체 이동 + 수명 관리
 *
 * BUGFIX:
 *   BUG-5: orbit 투사체의 hitTargets가 수명 동안 누적되어 연속 피격 불가 버그 수정
 *
 *     Before (버그):
 *       orbit 투사체는 pierce: 999, maxLifetime = cooldown * 1.02 로 설정됨.
 *       그러나 CollisionSystem이 p.hitTargets.has(e.id)로 재충돌을 막음.
 *       → 투사체가 적을 1회 맞히면 hitTargets에 등록
 *       → 같은 수명(cooldown 주기) 동안 해당 적은 다시 피격되지 않음
 *       → lightning_ring(orbit)이 적을 한 번만 때리는 사실상의 단타 무기가 됨
 *
 *     After (수정):
 *       한 바퀴(2π rad) 회전 완료 시 hitTargets를 clear()
 *       → 회전마다 모든 적에게 재충돌 허용 (연속 피해 의도 충족)
 *       _lastClearAngle로 초기화 기준점 추적 (첫 프레임 안전 처리 포함)
 *
 *   BUG-6: areaBurst 투사체가 플레이어를 따라가지 않는 버그 수정
 *
 *     Before (버그):
 *       areaBurst 투사체는 speed=0으로 발사 위치에 고정됨.
 *       holy_aura 같은 오라형 무기는 플레이어가 이동하면 공백 발생.
 *
 *     After (수정):
 *       투사체 config에 orbitsPlayer: true가 설정된 경우
 *       매 프레임 player.x/y로 위치를 동기화.
 *       weaponData.js의 holy_aura, frost_nova 등에 orbitsPlayer: true 추가 필요.
 *
 *   기존 수정 사항 (이전 패치에서 완료):
 *   FIX(BUG-BOOMERANG): 부메랑 귀환 catch 검사 순서 오류 수정
 *   FIX(BUG-C): 귀환 중 player가 null이면 무한 이동 방지
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

        // FIX(BUG-5): 한 바퀴 회전 완료 시 hitTargets 초기화
        // orbit 무기는 회전마다 연속 피해가 의도이므로, 2π rad 회전 후 재충돌 허용
        // _lastClearAngle이 없으면 현재 각도로 기준점 초기화 (투사체 생성 첫 프레임)
        if (p._lastClearAngle === undefined) {
          p._lastClearAngle = p.orbitAngle;
        } else if (Math.abs(p.orbitAngle - p._lastClearAngle) >= Math.PI * 2) {
          p.hitTargets.clear();
          p._lastClearAngle = p.orbitAngle;
        }

        if (p.lifetime >= p.maxLifetime) { p.isAlive = false; p.pendingDestroy = true; }

      // ── areaBurst ────────────────────────────────────────────────────
      } else if (p.behaviorId === 'areaBurst') {
        // FIX(BUG-6): orbitsPlayer 플래그가 있으면 플레이어 위치에 동기화
        // Before: 발사 시점의 x/y에 고정 → 이동 중 오라 공백 발생
        // After:  orbitsPlayer=true인 투사체는 매 프레임 player 위치로 이동
        //         weaponData.js의 holy_aura, frost_nova에 orbitsPlayer: true 추가 필요
        if (p.orbitsPlayer && player) {
          p.x = player.x;
          p.y = player.y;
        }
        p.lifetime += deltaTime;
        if (p.lifetime >= p.maxLifetime) { p.isAlive = false; p.pendingDestroy = true; }

      // ── boomerang ────────────────────────────────────────────────────
      } else if (p.behaviorId === 'boomerang') {

        // FIX(BUG-BOOMERANG): _reversed 상태일 때 catch 검사를 이동 전에 수행
        if (p._reversed) {
          // FIX(BUG-C): player 없으면 귀환 불가 → 즉시 소멸
          if (!player) {
            p.isAlive = false;
            p.pendingDestroy = true;
            continue;
          }

          // 이동 전 현재 위치로 플레이어까지의 거리 계산
          const dx     = player.x - p.x;
          const dy     = player.y - p.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < 400) {
            // 플레이어 반경(20px) 이내 → 부메랑 회수 완료, 즉시 소멸
            p.distanceTraveled = p.maxRange;
            p.isAlive          = false;
            p.pendingDestroy   = true;
            continue;
          }

          // catch 반경 밖이면 플레이어 방향으로 dir 갱신 후 이동
          const len = Math.sqrt(distSq);
          p.dirX = dx / len;
          p.dirY = dy / len;
        }

        // 이동
        const dist = p.speed * deltaTime;
        p.x += p.dirX * dist;
        p.y += p.dirY * dist;
        p.distanceTraveled = (p.distanceTraveled ?? 0) + dist;

        // 절반 거리 도달 시 반전 플래그 ON + distanceTraveled 클램프
        if (!p._reversed && p.distanceTraveled >= p.maxRange / 2) {
          p._reversed        = true;
          p.distanceTraveled = p.maxRange / 2;
        }

        // 발사 방향으로 maxRange를 넘어도 반전이 없으면 소멸 (failsafe)
        if (!p._reversed && p.distanceTraveled >= p.maxRange) {
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
