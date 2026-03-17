import { KNOCKBACK, DAMAGE_TEXT } from '../../data/constants.js';

/**
 * DamageSystem — 데미지 적용
 *
 * FIX(bug): pendingDestroy 가드 — 동일 프레임 poison tick + 투사체 이중 처리 차단
 * PERF: 데미지 텍스트 프레임당 DAMAGE_TEXT.MAX_PER_FRAME 상한
 */
export const DamageSystem = {
  update({ world: { events, player, spawnQueue } }) {
    const hits = events.hits;
    let damageTextCount = 0;

    for (let i = 0; i < hits.length; i++) {
      const hit    = hits[i];
      const target = hit.target;

      // FIX(bug): isAlive + pendingDestroy 이중 확인
      if (!target || !target.isAlive || target.pendingDestroy) continue;

      target.hp -= hit.damage;

      if (target.type === 'enemy') {
        target.hitFlashTimer = 0.1;

        // 넉백
        const resist = target.knockbackResist ?? 0;
        let kx = 0, ky = 0;

        if (hit.projectile?.dirX !== undefined || hit.projectile?.dirY !== undefined) {
          kx = hit.projectile.dirX;
          ky = hit.projectile.dirY;
        } else if (player) {
          const dx  = target.x - player.x;
          const dy  = target.y - player.y;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          kx = dx / len; ky = dy / len;
        }

        if ((kx !== 0 || ky !== 0) && resist < 1) {
          target.knockbackX     = kx * KNOCKBACK.speed    * (1 - resist);
          target.knockbackY     = ky * KNOCKBACK.speed    * (1 - resist);
          target.knockbackTimer = KNOCKBACK.duration * (1 - resist);
        }

        // 흡혈
        if (player && player.lifesteal > 0) {
          player.hp = Math.min(player.maxHp, player.hp + hit.damage * player.lifesteal);
        }
      }

      // 플레이어 피격 무적
      if (target.type === 'player') {
        target.invincibleTimer = target.invincibleDuration;
      }

      // 사망 판정
      if (target.hp <= 0 && !target.pendingDestroy) {
        target.hp             = 0;
        target.isAlive        = false;
        target.pendingDestroy = true;
        events.deaths.push({ entity: target });
      }

      // PERF: 데미지 텍스트 상한
      if (damageTextCount < DAMAGE_TEXT.MAX_PER_FRAME) {
        damageTextCount++;
        spawnQueue.push({
          type: 'effect',
          config: {
            x:          target.x,
            y:          target.y - target.radius,
            effectType: 'damageText',
            text:       `-${hit.damage}`,
            color:      target.type === 'player'
              ? DAMAGE_TEXT.COLOR_PLAYER
              : DAMAGE_TEXT.COLOR_ENEMY,
            duration: DAMAGE_TEXT.DURATION,
          },
        });
      }
    }
  },
};
