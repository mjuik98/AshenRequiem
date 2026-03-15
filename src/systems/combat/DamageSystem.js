import { KNOCKBACK } from '../../data/constants.js';

/**
 * DamageSystem — 데미지 적용
 *
 * 입력: events.hits
 * 쓰기: 대상 HP, 피격 상태, 사망 상태, 넉백 벡터
 * 출력: events.deaths, spawnQueue(이펙트)
 *
 * PATCH(refactor): knockbackResist 지원.
 *   enemyData 에 knockbackResist(0~1) 필드 추가 후 createEnemy 를 통해 런타임 상태로 복사.
 *   0 = 일반 넉백, 1 = 완전 무시.
 *   golem 계열 / 보스에게 적용.
 *
 * FIX(bug): pendingDestroy 가드 추가.
 *   같은 프레임에 poison tick + 일반 투사체가 동일 대상을 처리할 때,
 *   첫 번째 hit 이 isAlive = false 를 설정한 후에도 두 번째 hit 이
 *   진입할 수 있었음. pendingDestroy 도 함께 확인해 이중 처리를 차단.
 *
 * FIX(refactor): KNOCKBACK_SPEED / KNOCKBACK_DURATION 하드코딩 제거.
 *   → src/data/constants.js 의 KNOCKBACK 상수로 이관.
 */
export const DamageSystem = {
  update({ events, player, spawnQueue }) {
    const hits = events.hits;

    for (let i = 0; i < hits.length; i++) {
      const hit = hits[i];
      const target = hit.target;

      // FIX(bug): isAlive 뿐 아니라 pendingDestroy 도 확인 (이중 처리 방지)
      if (!target || !target.isAlive || target.pendingDestroy) continue;

      target.hp -= hit.damage;

      if (target.type === 'enemy') {
        target.hitFlashTimer = 0.1;

        // 넉백 — FIX(refactor): KNOCKBACK 상수 사용
        const resist = target.knockbackResist ?? 0;

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

        if ((kx !== 0 || ky !== 0) && resist < 1) {
          target.knockbackX     = kx * KNOCKBACK.speed    * (1 - resist);
          target.knockbackY     = ky * KNOCKBACK.speed    * (1 - resist);
          target.knockbackTimer = KNOCKBACK.duration * (1 - resist);
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
