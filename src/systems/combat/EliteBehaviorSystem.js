import { normalize, sub } from '../../math/Vector2.js';
import { ELITE_BEHAVIOR }  from '../../data/constants.js';

/**
 * EliteBehaviorSystem — 엘리트 / 보스 전용 행동 패턴
 *
 * CHANGE(P1-③): systems/movement/ → systems/combat/ 로 이동
 *   - 이유: spawnQueue에 투사체를 push하는 것은 combat 책임
 *   - movement/ 폴더는 순수 위치 이동만 담당해야 함
 *   - 이 파일은 이동(orbit)과 공격(projectile spawn)을 모두 처리하므로
 *     두 책임이 섞인 상태 — 향후 EliteAttackSystem 분리 검토 가능
 */
const DEFAULT_PROJ_CFG = { damage: 6, speed: 200, radius: 6, color: '#e0e0e0', pierce: 1 };

export const EliteBehaviorSystem = {
  update({ world: { enemies, player, deltaTime, spawnQueue } }) {
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

  _chaseMove(e, player, deltaTime) {
    const dx = player.x - e.x, dy = player.y - e.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    e.x += (dx / dist) * e.moveSpeed * deltaTime;
    e.y += (dy / dist) * e.moveSpeed * deltaTime;
  },

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
      e.x += s.dashDirX * ELITE_BEHAVIOR.DASH_SPEED * deltaTime;
      e.y += s.dashDirY * ELITE_BEHAVIOR.DASH_SPEED * deltaTime;
      s.timer -= deltaTime;
      if (s.timer <= 0) { s.phase = 'idle'; s.timer = 2.2; }
    }
  },

  _updateCircleDash(e, player, deltaTime, spawnQueue) {
    const s       = e.behaviorState;
    const projCfg = e.projectileConfig ?? DEFAULT_PROJ_CFG;

    if (s.phase === 'idle') {
      s.orbitAngle += 1.2 * deltaTime;
      const orbitR = 140;
      const tx = player.x + Math.cos(s.orbitAngle) * orbitR;
      const ty = player.y + Math.sin(s.orbitAngle) * orbitR;
      const dx = tx - e.x, dy = ty - e.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const spd  = ELITE_BEHAVIOR.CIRCLE_DASH_SPEED * 0.55 * deltaTime;
      e.x += (dx / dist) * spd;
      e.y += (dy / dist) * spd;
      s.timer -= deltaTime;
      if (s.timer <= 0) {
        const dir = normalize(sub(player, e));
        s.dashDirX = dir.x; s.dashDirY = dir.y;
        s.phase = 'windup'; s.timer = 0.55;
      }
    } else if (s.phase === 'windup') {
      e.chargeEffect = true;
      s.timer -= deltaTime;
      if (s.timer <= 0) {
        e.chargeEffect = false;
        const count = e.isBoss ? 8 : 5;
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2;
          spawnQueue.push({
            type: 'projectile',
            config: {
              x: e.x, y: e.y,
              dirX: Math.cos(angle), dirY: Math.sin(angle),
              speed:      projCfg.speed,
              damage:     projCfg.damage,
              radius:     projCfg.radius,
              color:      projCfg.color,
              pierce:     projCfg.pierce,
              maxRange:   500,
              behaviorId: 'targetProjectile',
              ownerId:    e.id,
            },
          });
        }
        s.phase = 'dashing'; s.timer = 0.28;
      }
    } else if (s.phase === 'dashing') {
      e.x += s.dashDirX * ELITE_BEHAVIOR.CIRCLE_DASH_SPEED * deltaTime;
      e.y += s.dashDirY * ELITE_BEHAVIOR.CIRCLE_DASH_SPEED * deltaTime;
      s.timer -= deltaTime;
      if (s.timer <= 0) { s.phase = 'idle'; s.timer = e.isBoss ? 1.8 : 2.5; }
    }
  },
};
