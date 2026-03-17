import { dist2, moveToward } from './behaviorUtils.js';

/**
 * charge — 돌진
 * 평소에는 느리게 추적하다가, 일정 거리 안에 들어오면 빠르게 돌진.
 */
const CHARGE_TRIGGER_DIST_SQ = 300 * 300;
const CHARGE_DURATION        = 0.4; // s
const CHARGE_SPEED_MULT      = 3.5;

export function charge(enemy, { player, deltaTime }) {
  if (!player?.isAlive) return;

  if (enemy.chargeState === undefined) {
    enemy.chargeState = { charging: false, timer: 0, dirX: 0, dirY: 0 };
  }
  const s = enemy.chargeState;

  if (s.charging) {
    s.timer -= deltaTime;
    const speed = (enemy.speed ?? 60);
    enemy.x += s.dirX * speed * CHARGE_SPEED_MULT * deltaTime;
    enemy.y += s.dirY * speed * CHARGE_SPEED_MULT * deltaTime;
    if (s.timer <= 0) s.charging = false;
  } else {
    if (dist2(enemy, player) < CHARGE_TRIGGER_DIST_SQ) {
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const d  = Math.sqrt(dx * dx + dy * dy) || 1;
      s.dirX    = dx / d;
      s.dirY    = dy / d;
      s.timer   = CHARGE_DURATION;
      s.charging = true;
    } else {
      moveToward(enemy, player.x, player.y, (enemy.speed ?? 60) * 0.5, deltaTime);
    }
  }
}
