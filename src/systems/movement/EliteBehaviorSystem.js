import { normalize, sub } from '../../math/Vector2.js';
import { ELITE_BEHAVIOR }  from '../../data/constants.js';

/**
 * EliteBehaviorSystem — 엘리트 / 보스 전용 이동 패턴
 *
 * FIX(bug): windup 중 스턴/넉백 시 chargeEffect 플래그 잔류 버그 수정
 * REF: hitFlashTimer 남용 → chargeEffect 전용 플래그로 교체
 * REF: 투사체 config 하드코딩 → enemyData.projectileConfig 참조
 * REF: DASH_SPEED 하드코딩 → ELITE_BEHAVIOR 상수 참조
 */
const DEFAULT_PROJ_CFG = { damage: 6, speed: 200, radius: 6, color: '#e0e0e0', pierce: 1 };

export const EliteBehaviorSystem = {
  update({ enemies, player, deltaTime, spawnQueue }) {
    if (!player?.isAlive) return;

    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e.isAlive || e.pendingDestroy) { if (e.chargeEffect) e.chargeEffect = false; continue; }
      if (!e.isElite && !e.isBoss)        continue;

      // 스턴 / 넉백 중 → chargeEffect 해제 후 skip
      if (e.stunned || e.knockbackTimer > 0) {
        if (e.chargeEffect) e.chargeEffect = false;
        continue;
      }

      if      (e.behaviorId === 'dash')        this._updateDash(e, player, deltaTime);
      else if (e.behaviorId === 'circle_dash') this._updateCircleDash(e, player, deltaTime, spawnQueue);
      else                                     this._chaseMove(e, player, deltaTime);
    }
  },

  // ── 기본 추적 (엘리트 fallback) ──────────────────────────
  _chaseMove(e, player, deltaTime) {
    const dx = player.x - e.x, dy = player.y - e.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    e.x += (dx / dist) * e.moveSpeed * deltaTime;
    e.y += (dy / dist) * e.moveSpeed * deltaTime;
  },

  // ── dash: 추적 → 충전(멈춤) → 돌진 ──────────────────────
  _updateDash(e, player, deltaTime) {
    const s = e.behaviorState;

    if (s.phase === 'idle') {
      this._chaseMove(e, player, deltaTime);
      s.timer -= deltaTime;
      if (s.timer <= 0) {
        const dir = normalize(sub(player, e));
        s.dashDirX = dir.x; s.dashDirY = dir.y;
        s.phase = 'windup'; s.timer = 0.7;
      }
    } else if (s.phase === 'windup') {
      e.chargeEffect = true;
      s.timer -= deltaTime;
      if (s.timer <= 0) {
        e.chargeEffect = false;
        s.phase = 'dashing'; s.timer = 0.32;
      }
    } else if (s.phase === 'dashing') {
      // REF: 하드코딩 → ELITE_BEHAVIOR.DASH_SPEED
      e.x += s.dashDirX * ELITE_BEHAVIOR.DASH_SPEED * deltaTime;
      e.y += s.dashDirY * ELITE_BEHAVIOR.DASH_SPEED * deltaTime;
      s.timer -= deltaTime;
      if (s.timer <= 0) { s.phase = 'idle'; s.timer = 2.2; }
    }
  },

  // ── circle_dash: 원형 이동 → 충전 → 돌진 + 투사체 ────────
  _updateCircleDash(e, player, deltaTime, spawnQueue) {
    const s      = e.behaviorState;
    // REF: 투사체 config를 enemyData에서 가져옴
    const projCfg = e.projectileConfig ?? DEFAULT_PROJ_CFG;

    if (s.phase === 'idle') {
      s.orbitAngle = (s.orbitAngle || 0) + 1.8 * deltaTime;
      const orbitR = 90;
      e.x = player.x + Math.cos(s.orbitAngle) * orbitR;
      e.y = player.y + Math.sin(s.orbitAngle) * orbitR;
      s.timer -= deltaTime;
      if (s.timer <= 0) {
        const dir = normalize(sub(player, e));
        s.dashDirX = dir.x; s.dashDirY = dir.y;
        s.phase = 'windup'; s.timer = 0.5;
      }
    } else if (s.phase === 'windup') {
      e.chargeEffect = true;
      s.timer -= deltaTime;
      if (s.timer <= 0) {
        e.chargeEffect = false;
        // 원형 투사체 발사
        const COUNT = 8;
        for (let i = 0; i < COUNT; i++) {
          const angle = (i / COUNT) * Math.PI * 2;
          spawnQueue.push({
            type: 'projectile',
            config: {
              x: e.x, y: e.y,
              dirX: Math.cos(angle), dirY: Math.sin(angle),
              speed:  projCfg.speed,
              damage: projCfg.damage,
              radius: projCfg.radius,
              color:  projCfg.color,
              pierce: projCfg.pierce,
              maxRange: 400,
              behaviorId: 'targetProjectile',
              ownerId: e.id,
            },
          });
        }
        s.phase = 'dashing'; s.timer = 0.4;
      }
    } else if (s.phase === 'dashing') {
      e.x += s.dashDirX * ELITE_BEHAVIOR.CIRCLE_DASH_SPEED * deltaTime;
      e.y += s.dashDirY * ELITE_BEHAVIOR.CIRCLE_DASH_SPEED * deltaTime;
      s.timer -= deltaTime;
      if (s.timer <= 0) { s.phase = 'idle'; s.timer = 1.8; }
    }
  },
};
