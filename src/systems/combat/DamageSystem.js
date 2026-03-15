/**
 * DamageSystem — 데미지 적용
 *
 * 입력: events.hits
 * 쓰기: 대상 HP, 피격 상태, 사망 상태, 넉백 벡터
 * 출력: events.deaths, spawnQueue(이펙트)
 */
export const DamageSystem = {
  update({ events, player, spawnQueue }) {
    const hits = events.hits;

    for (let i = 0; i < hits.length; i++) {
      const hit = hits[i];
      const target = hit.target;

      if (!target || !target.isAlive) continue;

      target.hp -= hit.damage;

      if (target.type === 'enemy') {
        target.hitFlashTimer = 0.1;

        // 넉백 — 투사체 방향 또는 플레이어→적 방향으로 밀어냄
        const KNOCKBACK_SPEED    = 180; // px/s
        const KNOCKBACK_DURATION = 0.10; // 초

        let kx = 0, ky = 0;
        if (hit.projectile && (hit.projectile.dirX || hit.projectile.dirY)) {
          kx = hit.projectile.dirX;
          ky = hit.projectile.dirY;
        } else if (player) {
          const dx = target.x - player.x;
          const dy = target.y - player.y;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          kx = dx / len;
          ky = dy / len;
        }

        if (kx !== 0 || ky !== 0) {
          target.knockbackX = kx * KNOCKBACK_SPEED;
          target.knockbackY = ky * KNOCKBACK_SPEED;
          target.knockbackTimer = KNOCKBACK_DURATION;
        }

        // 흡혈 — 적에게 입힌 데미지 비율만큼 플레이어 회복
        if (player && player.lifesteal > 0) {
          player.hp = Math.min(player.maxHp, player.hp + hit.damage * player.lifesteal);
        }
      }

      // 플레이어 피격 시 무적 부여
      if (target.type === 'player') {
        target.invincibleTimer = target.invincibleDuration;
      }

      // 데미지 텍스트 이펙트
      spawnQueue.push({
        type: 'effect',
        config: {
          x: target.x,
          y: target.y - target.radius,
          effectType: 'damageText',
          text: `-${hit.damage}`,
          color: target.type === 'player' ? '#ef5350' : '#ffffff',
          duration: 0.5,
        },
      });

      // 사망 판정
      if (target.hp <= 0) {
        target.hp = 0;
        target.isAlive = false;
        target.pendingDestroy = true;

        events.deaths.push({
          entityId: target.id,
          entity: target,
          killedBy: hit.attackerId,
        });
      }
    }
  },
};
