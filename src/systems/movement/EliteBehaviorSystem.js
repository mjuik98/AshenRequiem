import { normalize, sub } from '../../math/Vector2.js';
import { ELITE_BEHAVIOR } from '../../data/constants.js';

/**
 * EliteBehaviorSystem — 엘리트/보스 전용 이동 패턴
 *
 * REF(refactor): windup 페이즈 hitFlashTimer 남용 → chargeEffect 전용 플래그로 교체.
 *              hitFlashTimer 는 '피격 플래시'라는 원래 용도만 유지.
 * REF(refactor): circle_dash 투사체 설정 하드코딩 제거.
 *              e.projectileConfig(enemyData 에서 복사) 를 참조.
 *              fallback 기본값은 내부 DEFAULT_PROJECTILE_CONFIG 사용.
 * REF(refactor): DASH_SPEED 하드코딩 제거.
 *   이전: 각 메서드 내에 const DASH_SPEED = 520 / 480 리터럴.
 *   이후: constants.js ELITE_BEHAVIOR.DASH_SPEED / CIRCLE_DASH_SPEED 참조.
 *         밸런스 조정 시 constants.js 한 곳만 수정하면 된다.
 */

const DEFAULT_PROJECTILE_CONFIG = {
  damage: 6,
  speed: 200,
  radius: 6,
  color: '#e0e0e0',
  pierce: 1,
};

export const EliteBehaviorSystem = {
  update({ enemies, player, deltaTime, spawnQueue }) {
    if (!player || !player.isAlive) return;

    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e.isAlive || e.pendingDestroy) continue;
      if (e.stunned) continue;
      // knockback 중에는 EliteBehavior도 스킵
      if (e.knockbackTimer > 0) continue;

      if (e.behaviorId === 'dash') {
        this._updateDash(e, player, deltaTime);
      } else if (e.behaviorId === 'circle_dash') {
        this._updateCircleDash(e, player, deltaTime, spawnQueue);
      }
    }
  },

  // ── dash: 추적 → 충전(멈춤) → 돌진 ─────────────────────────

  _updateDash(e, player, deltaTime) {
    const s = e.behaviorState;

    if (s.phase === 'idle') {
      // 추적 이동
      const dir = normalize(sub({ x: player.x, y: player.y }, { x: e.x, y: e.y }));
      e.x += dir.x * e.moveSpeed * deltaTime;
      e.y += dir.y * e.moveSpeed * deltaTime;

      s.timer -= deltaTime;
      if (s.timer <= 0) {
        const toPlayer = normalize(sub({ x: player.x, y: player.y }, { x: e.x, y: e.y }));
        s.dashDirX = toPlayer.x;
        s.dashDirY = toPlayer.y;
        s.phase = 'windup';
        s.timer = 0.7;
      }

    } else if (s.phase === 'windup') {
      // REF: hitFlashTimer 남용 제거 → chargeEffect 전용 플래그
      e.chargeEffect = true;
      s.timer -= deltaTime;
      if (s.timer <= 0) {
        e.chargeEffect = false;
        s.phase = 'dashing';
        s.timer = 0.32;
      }

    } else if (s.phase === 'dashing') {
      // REF: 하드코딩 520 → ELITE_BEHAVIOR.DASH_SPEED
      e.x += s.dashDirX * ELITE_BEHAVIOR.DASH_SPEED * deltaTime;
      e.y += s.dashDirY * ELITE_BEHAVIOR.DASH_SPEED * deltaTime;

      s.timer -= deltaTime;
      if (s.timer <= 0) {
        s.phase = 'idle';
        s.timer = 2.2;
      }
    }
  },

  // ── circle_dash: 원형 이동 → 충전 → 돌진 + 투사체 ───────────

  _updateCircleDash(e, player, deltaTime, spawnQueue) {
    const s = e.behaviorState;
    // REF: 투사체 config 를 enemyData 에서 가져옴
    const projCfg = e.projectileConfig ?? DEFAULT_PROJECTILE_CONFIG;

    if (s.phase === 'circling') {
      // 플레이어 주위를 원형으로 이동
      s.orbitAngle += s.orbitSpeed * deltaTime;
      const tx = player.x + Math.cos(s.orbitAngle) * s.orbitRadius;
      const ty = player.y + Math.sin(s.orbitAngle) * s.orbitRadius;
      const dir = normalize(sub({ x: tx, y: ty }, { x: e.x, y: e.y }));
      e.x += dir.x * e.moveSpeed * deltaTime;
      e.y += dir.y * e.moveSpeed * deltaTime;

      s.timer -= deltaTime;
      if (s.timer <= 0) {
        const toPlayer = normalize(sub({ x: player.x, y: player.y }, { x: e.x, y: e.y }));
        s.dashDirX = toPlayer.x;
        s.dashDirY = toPlayer.y;
        s.phase = 'windup';
        s.timer = 0.8;
      }

    } else if (s.phase === 'windup') {
      // REF: chargeEffect 플래그 사용
      e.chargeEffect = true;
      s.timer -= deltaTime;
      if (s.timer <= 0) {
        e.chargeEffect = false;
        // 4방향 투사체 발사
        for (let d = 0; d < 4; d++) {
          const angle = (d / 4) * Math.PI * 2;
          spawnQueue.push({
            type: 'projectile',
            config: {
              x: e.x, y: e.y,
              dirX: Math.cos(angle),
              dirY: Math.sin(angle),
              speed:  projCfg.speed,
              damage: projCfg.damage,
              radius: projCfg.radius,
              color:  projCfg.color,
              pierce: projCfg.pierce ?? 1,
              maxRange: 600,
              behaviorId: 'targetProjectile',
              ownerId: e.id,
            },
          });
        }
        s.phase = 'dashing';
        s.timer = 0.4;
      }

    } else if (s.phase === 'dashing') {
      // REF: 하드코딩 480 → ELITE_BEHAVIOR.CIRCLE_DASH_SPEED
      e.x += s.dashDirX * ELITE_BEHAVIOR.CIRCLE_DASH_SPEED * deltaTime;
      e.y += s.dashDirY * ELITE_BEHAVIOR.CIRCLE_DASH_SPEED * deltaTime;

      s.timer -= deltaTime;
      if (s.timer <= 0) {
        s.phase = 'circling';
        s.timer = 3.0;
        // 원형 이동 시작 각도를 현재 위치 기준으로 리셋
        s.orbitAngle = Math.atan2(e.y - player.y, e.x - player.x);
      }
    }
  },
};
