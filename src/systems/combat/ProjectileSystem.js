/**
 * src/systems/combat/ProjectileSystem.js — 투사체 이동 + 수명 관리
 *
 * FIX(BUG-BOOMERANG): 부메랑 귀환 catch 검사 순서 오류 수정
 *
 *   Before (버그):
 *     1. p.x += dirX * dist       ← 이동 먼저
 *     2. if (_reversed) { check distSq < 400 }  ← 이동 후 위치로 검사
 *
 *     문제: 반환 중 어떤 프레임에서 이동 후 위치가 catch radius(20px) 이내로
 *     들어와도 next frame에서 catch가 기대되는 테스트 구조와 불일치.
 *     실제로는 이동 후 위치로 검사하므로 catch가 예상보다 1프레임 먼저
 *     또는 아예 누락(overshooting)될 수 있음.
 *
 *   After (수정):
 *     _reversed 상태일 때:
 *       1. 현재 위치(이동 전)로 catch 검사 → 20px 이내면 즉시 소멸 + continue
 *       2. catch 안 됐으면 player 방향으로 dirX/Y 갱신
 *       3. 그 후 이동 수행
 *
 *     이렇게 하면 현재 위치가 catch radius 이내인 프레임에서
 *     정확히 catch가 발생하며, 테스트 기대값과 일치한다.
 *
 *   관련 테스트: tests/ProjectileSystem.test.js
 *     Step 3 종료 시 proj.x = 10 (catch 안 됨, player 까지 distSq=100)
 *     Step 4 시작 시 proj.x = 10 → distSq = 100 < 400 → catch 발동
 *     → proj.isAlive = false, proj.pendingDestroy = true
 *
 * FIX(BUG-C): 귀환 중 player가 null이면 무한 이동 방지 (기존 유지)
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

        // FIX(BUG-BOOMERANG): _reversed 상태일 때 catch 검사를 이동 전에 수행
        //
        //   핵심 원칙: "현재 프레임의 위치"로 catch를 결정한 뒤,
        //              catch가 없으면 방향 갱신 → 이동 순서로 진행.
        //
        //   Before: 이동 → catch 검사(이동 후 위치)
        //           → 같은 프레임에 catch radius를 넘어서 이동해버리면
        //              다음 프레임에서도 놓칠 수 있음
        //   After:  catch 검사(현재 위치) → [catch 안 됐을 때만] 방향 갱신 + 이동
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
            continue; // 이 프레임 이동 없이 종료
          }

          // catch 반경 밖이면 플레이어 방향으로 dir 갱신 후 이동
          const len = Math.sqrt(distSq);
          p.dirX = dx / len;
          p.dirY = dy / len;
        }

        // 이동 (catch가 발생했으면 위 continue로 이미 skip됨)
        const dist = p.speed * deltaTime;
        p.x += p.dirX * dist;
        p.y += p.dirY * dist;
        p.distanceTraveled = (p.distanceTraveled ?? 0) + dist;

        // 절반 거리 도달 시 반전 플래그 ON + distanceTraveled 클램프
        if (!p._reversed && p.distanceTraveled >= p.maxRange / 2) {
          p._reversed        = true;
          // 안전장치: 정확히 절반 지점으로 고정 (과초과 방지)
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
