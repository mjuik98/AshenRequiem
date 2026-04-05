/**
 * src/behaviors/enemyBehaviors/circleDash.js — 궤도 회전 + 투사체 방사 돌진
 *
 * [FIX P0-1] circle_dash behaviorId를 enemyBehaviorRegistry에 등록하기 위한 독립 모듈.
 *
 * Before:
 *   EliteBehaviorSystem._updateCircleDash() 내부에만 구현.
 *   → 레지스트리 미등록으로 validate 경고 + EnemyMovementSystem 이중 이동 버그.
 *
 * After:
 *   이 파일을 enemyBehaviorRegistry에 등록.
 *   spawnQueue를 context로 받아야 하므로, EnemyMovementSystem에서
 *   아래와 같이 context를 확장해야 함:
 *
 *     behaviorFn(e, { player, enemies, deltaTime: effectiveDt, spawnQueue });
 *
 * behaviorState 구조:
 *   { phase: 'idle', timer: 1.2, orbitAngle: 0, dashDirX: 0, dashDirY: 0 }
 *
 * 동작 흐름:
 *   idle:    플레이어 주위를 원 궤도로 회전하며 타이머 대기.
 *   windup:  chargeEffect=true, 원형 투사체 발사 준비.
 *   dashing: 조준 방향으로 고속 돌진, 동시에 방사형 투사체 살포.
 */

import { ELITE_BEHAVIOR } from '../../data/constants.js';
import { spawnProjectile } from '../../domain/play/state/spawnRequest.js';

const ORBIT_ANGULAR_SPEED = 1.2;   // rad/s
const ORBIT_RADIUS        = 140;   // px
const WINDUP_DURATION     = 0.55;  // s
const DASH_DURATION       = 0.28;  // s
const PROJECTILE_COUNT_NORMAL = 5;
const PROJECTILE_COUNT_BOSS   = 8;
const PROJECTILE_RANGE    = 500;   // px

const DEFAULT_PROJ_CFG = {
  damage: 6, speed: 200, radius: 6, color: '#e0e0e0', pierce: 1,
};

/**
 * 궤도 회전 + 투사체 방사 돌진 행동.
 *
 * @param {object} enemy
 * @param {{ player: object, deltaTime: number, spawnQueue: object[] }} ctx
 */
export function circleDash(enemy, { player, deltaTime, spawnQueue = [] }) {
  if (!player?.isAlive) return;

  if (!enemy.behaviorState) {
    enemy.behaviorState = { phase: 'idle', timer: 1.2, orbitAngle: 0, dashDirX: 0, dashDirY: 0 };
  }

  const s       = enemy.behaviorState;
  const projCfg = enemy.projectileConfig ?? DEFAULT_PROJ_CFG;

  if (s.phase === 'idle') {
    // 플레이어 주위 원 궤도 이동
    s.orbitAngle += ORBIT_ANGULAR_SPEED * deltaTime;
    const tx = player.x + Math.cos(s.orbitAngle) * ORBIT_RADIUS;
    const ty = player.y + Math.sin(s.orbitAngle) * ORBIT_RADIUS;
    const dx = tx - enemy.x;
    const dy = ty - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const spd  = ELITE_BEHAVIOR.CIRCLE_DASH_SPEED * 0.55 * deltaTime;
    enemy.x += (dx / dist) * spd;
    enemy.y += (dy / dist) * spd;

    s.timer -= deltaTime;
    if (s.timer <= 0) {
      // 플레이어 방향으로 돌진 벡터 확정
      const ddx = player.x - enemy.x;
      const ddy = player.y - enemy.y;
      const d   = Math.sqrt(ddx * ddx + ddy * ddy) || 1;
      s.dashDirX = ddx / d;
      s.dashDirY = ddy / d;
      s.phase    = 'windup';
      s.timer    = WINDUP_DURATION;
    }

  } else if (s.phase === 'windup') {
    enemy.chargeEffect = true;
    s.timer -= deltaTime;
    if (s.timer <= 0) {
      enemy.chargeEffect = false;

      // 방사형 투사체 살포
      const count = enemy.isBoss ? PROJECTILE_COUNT_BOSS : PROJECTILE_COUNT_NORMAL;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        spawnQueue.push(spawnProjectile({
          x: enemy.x,
          y: enemy.y,
          config: {
            dirX:       Math.cos(angle),
            dirY:       Math.sin(angle),
            speed:      projCfg.speed,
            damage:     projCfg.damage,
            radius:     projCfg.radius,
            color:      projCfg.color,
            pierce:     projCfg.pierce,
            maxRange:   PROJECTILE_RANGE,
            behaviorId: 'targetProjectile',
            ownerId:    enemy.id,
          },
        }));
      }

      s.phase = 'dashing';
      s.timer = DASH_DURATION;
    }

  } else if (s.phase === 'dashing') {
    enemy.x += s.dashDirX * ELITE_BEHAVIOR.CIRCLE_DASH_SPEED * deltaTime;
    enemy.y += s.dashDirY * ELITE_BEHAVIOR.CIRCLE_DASH_SPEED * deltaTime;
    s.timer -= deltaTime;
    if (s.timer <= 0) {
      s.phase = 'idle';
      s.timer = enemy.isBoss ? 1.8 : 2.5;
    }
  }
}
