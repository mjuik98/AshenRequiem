import { ELITE_BEHAVIOR } from '../../data/constants.js';

/**
 * EnemyMovementSystem — 적 이동 + 넉백 감쇠 + separation
 *
 * REF(perf): 적 separation (분리력) 추가.
 *   이전: 적이 동일 위치에 완전히 겹쳐 쌓일 수 있음 →
 *         CollisionSystem 에서 동일 위치 다수 적이 같은 프레임에 플레이어를 타격,
 *         순간 대미지가 비정상적으로 커지는 문제 완화 효과도 있음.
 *   이후: 인접 적 간 간단한 밀어내기(separation) 패스를 이동 후 1회 수행.
 *         분리 거리 기준 = 두 적의 radius 합. 가중치는 밀어내기 세기 조절용.
 *         O(n²) 이지만 separation은 화면 내 근접 적에만 의미 있으므로
 *         반경 기준 사전 스킵으로 실질 비용을 제한한다.
 *
 * 계약:
 *   입력: player, enemies, deltaTime
 *   읽기: 플레이어 위치, 적 위치/속도/상태
 *   쓰기: 적 위치, knockback 상태
 *   출력: 없음
 */

/** separation 밀어내기 강도 (0 = 없음, 1 = 완전 분리) */
const SEPARATION_STRENGTH = 0.35;
/** separation 계산 최대 반경 (픽셀). 이 거리 밖 적은 서로 무시 */
const SEPARATION_MAX_DIST = 60;

export const EnemyMovementSystem = {
  update({ player, enemies, deltaTime }) {
    if (!player || !player.isAlive) return;

    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e.isAlive || e.pendingDestroy) continue;

      // ── 넉백 감쇠 ───────────────────────────────────────────
      if (e.knockbackTimer > 0) {
        e.knockbackTimer -= deltaTime;
        if (e.knockbackTimer < 0) e.knockbackTimer = 0;
        if (!e.stunned) {
          e.x += e.knockbackX * deltaTime;
          e.y += e.knockbackY * deltaTime;
        }
        continue; // 넉백 중엔 추적 이동 없음
      }

      // ── 스턴 중 이동 없음 ──────────────────────────────────
      if (e.stunned) continue;

      // ── 플레이어 추적 이동 ──────────────────────────────────
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const speed = (e.moveSpeed ?? 80) * deltaTime;

      if (dist > 1) {
        e.x += (dx / dist) * speed;
        e.y += (dy / dist) * speed;
      }
    }

    // ── Separation 패스 ─────────────────────────────────────
    // 이동 완료 후 인접 적 간 밀어내기 1회 수행
    this._applySeparation(enemies);
  },

  /**
   * REF(perf): separation — 인접 적 간 겹침 방지.
   *   반경 기준 거리 체크로 불필요한 분리 계산을 조기 스킵한다.
   */
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

        // 최대 separation 거리 밖이면 스킵
        if (distSq > maxDistSq || distSq === 0) continue;

        const minDist = (a.radius ?? 12) + (b.radius ?? 12);
        if (distSq >= minDist * minDist) continue;

        const dist = Math.sqrt(distSq);
        const overlap = (minDist - dist) / dist * SEPARATION_STRENGTH;

        a.x -= dx * overlap * 0.5;
        a.y -= dy * overlap * 0.5;
        b.x += dx * overlap * 0.5;
        b.y += dy * overlap * 0.5;
      }
    }
  },
};
