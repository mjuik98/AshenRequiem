import { KNOCKBACK, DAMAGE_TEXT } from '../../data/constants.js';

/**
 * DamageSystem — 데미지 적용
 *
 * BUGFIX:
 *   BUG-8: 플레이어 피격 무적 설정 시 invincibleDuration 미설정 방어 코드 추가
 *
 *     Before (잠재 버그):
 *       target.invincibleTimer = target.invincibleDuration;
 *       → invincibleDuration이 undefined이면 invincibleTimer = NaN
 *       → NaN > 0 은 항상 false → 무적 프레임이 작동하지 않음
 *       → 플레이어가 피격 직후 연속 데미지를 모두 받음
 *
 *     After (수정):
 *       target.invincibleTimer = target.invincibleDuration ?? 0.5;
 *       → 미설정 시 0.5초 기본값 적용 (createPlayer()와 동일한 기본값)
 *
 *   기존 수정 사항 (이전 패치에서 완료):
 *   FIX(bug): pendingDestroy 가드 — 동일 프레임 poison tick + 투사체 이중 처리 차단
 *   FIX(BUG-1): 플레이어 무적 프레임 중간 피격 차단
 *   FIX(BUG-LIFESTEAL): lifesteal attackerId 검증 누락 수정
 *   PERF: 데미지 텍스트 프레임당 DAMAGE_TEXT.MAX_PER_FRAME 상한
 */
export const DamageSystem = {
  update({ world: { events, player, spawnQueue } }) {
    const hits = events.hits;
    let damageTextCount = 0;

    for (let i = 0; i < hits.length; i++) {
      const hit    = hits[i];
      const target = hit.target;

      // isAlive + pendingDestroy 이중 확인
      if (!target || !target.isAlive || target.pendingDestroy) continue;

      // FIX(BUG-1): 플레이어 무적 프레임 중간 피격 차단
      if (target.type === 'player' && target.invincibleTimer > 0) continue;

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

        // FIX(BUG-LIFESTEAL): attackerId === player.id 일 때만 흡혈 적용
        if (player && player.lifesteal > 0 && hit.attackerId === player.id) {
          player.hp = Math.min(player.maxHp, player.hp + hit.damage * player.lifesteal);
        }
      }

      // 플레이어 피격 무적
      if (target.type === 'player') {
        // FIX(BUG-8): invincibleDuration 미설정 방어
        // Before: target.invincibleTimer = target.invincibleDuration
        //         → undefined이면 invincibleTimer = NaN → 무적 완전 비작동
        // After:  ?? 0.5 로 기본값 보장 (createPlayer()의 invincibleDuration: 0.5와 동일)
        target.invincibleTimer = target.invincibleDuration ?? 0.5;  // ← FIX(BUG-8)
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
