import { KNOCKBACK, DAMAGE_TEXT } from '../../data/constants.js';

/**
 * DamageSystem — 데미지 적용
 *
 * 입력: events.hits
 * 쓰기: 대상 HP, 피격 상태, 사망 상태, 넉백 벡터
 * 출력: events.deaths, spawnQueue(이펙트)
 *
 * PATCH(refactor): knockbackResist 지원.
 *   enemyData 에 knockbackResist(0~1) 필드 추가 후 createEnemy 를 통해 런타임 상태로 복사.
 *
 * FIX(bug): pendingDestroy 가드 추가.
 *   같은 프레임에 poison tick + 일반 투사체가 동일 대상을 처리할 때 이중 처리 차단.
 *
 * REF(refactor): DAMAGE_TEXT 상수 사용.
 *   이전: color '#ef5350' / '#ffffff', duration 0.5 가 이 파일에 하드코딩.
 *   이후: src/data/constants.js 의 DAMAGE_TEXT 로 이관 → 튜닝 시 한 곳만 수정.
 *
 * FIX(perf): 데미지 텍스트 프레임당 상한 적용.
 *   이전: 모든 hit 에 무조건 데미지 텍스트 이펙트 생성.
 *         areaBurst + 고밀도 적 조합에서 프레임당 수십 개 생성 → 성능 저하.
 *   이후: DAMAGE_TEXT.MAX_PER_FRAME(12) 초과 시 해당 프레임 텍스트 이펙트 생략.
 *         데미지/사망 판정 자체는 상한과 무관하게 전부 처리.
 */
export const DamageSystem = {
  update({ events, player, spawnQueue }) {
    const hits = events.hits;

    // FIX(perf): 프레임당 데미지 텍스트 생성 수 추적
    let damageTextCount = 0;

    for (let i = 0; i < hits.length; i++) {
      const hit = hits[i];
      const target = hit.target;

      // FIX(bug): isAlive 뿐 아니라 pendingDestroy 도 확인 (이중 처리 방지)
      if (!target || !target.isAlive || target.pendingDestroy) continue;

      target.hp -= hit.damage;

      if (target.type === 'enemy') {
        target.hitFlashTimer = 0.1;

        // 넉백
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

      // FIX(perf): 프레임당 최대 DAMAGE_TEXT.MAX_PER_FRAME 개만 이펙트 생성
      // 데미지/사망 판정은 상한 없이 전부 처리하되 시각 효과만 제한
      if (damageTextCount < DAMAGE_TEXT.MAX_PER_FRAME) {
        spawnQueue.push({
          type: 'effect',
          config: {
            x: target.x,
            y: target.y - target.radius,
            effectType: 'damageText',
            text: `-${hit.damage}`,
            color: target.type === 'player' ? DAMAGE_TEXT.playerColor : DAMAGE_TEXT.enemyColor,
            duration: DAMAGE_TEXT.duration,
          },
        });
        damageTextCount++;
      }

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
