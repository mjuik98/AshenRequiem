import { KNOCKBACK, DAMAGE_TEXT, CRIT } from '../../data/constants.js';
import { spawnEffect } from '../../state/spawnRequest.js';
import { chance } from '../../utils/random.js';

/**
 * DamageSystem — 데미지 적용
 *
 * MERGED:
 *   - Phase 2 Final: 크리티컬 히트 시스템 (isCrit 플래그 및 배율 적용, 전용 연출)
 *   - 기존 Fix들 유지 (BUG-8 무적 시간 가드, BUG-LIFESTEAL 등)
 */
export const DamageSystem = {
  update({ world }) {
    const events = world.queues.events;
    const player = world.entities.player;
    const spawnQueue = world.queues.spawnQueue;
    const rng = world.runtime.rng;
    const hits = events.hits;
    let damageTextCount = 0;

    for (let i = 0; i < hits.length; i++) {
      const hit    = hits[i];
      const target = hit.target;

      // isAlive + pendingDestroy 이중 확인
      if (!target || !target.isAlive || target.pendingDestroy) {
        this._rollbackProjectileHit(hit);
        continue;
      }

      this._commitProjectileHit(hit, player);

      // 플레이어 무적 프레임 가드
      if (target.type === 'player' && target.invincibleTimer > 0) continue;

      // ── 크리티컬 판정 (Patch) ────────────────────────────────────────────────────
      let finalDamage = hit.damage;
      let isCrit      = hit.isCrit ?? false;  // chainLightning 등 외부에서 미리 세팅 가능

      if (!isCrit && target.type === 'enemy' && hit.attackerId === player?.id) {
        const critChance = player?.critChance ?? CRIT.BASE_CHANCE;
        if (critChance > 0 && chance(critChance, rng)) {
          isCrit      = true;
          const multi  = player?.critMultiplier ?? CRIT.BASE_MULTIPLIER;
          finalDamage  = Math.round(finalDamage * multi);
        }
      }

      target.hp -= finalDamage;

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

        // 흡혈 (finalDamage 반영)
        if (player && player.lifesteal > 0 && hit.attackerId === player.id) {
          player.hp = Math.min(player.maxHp, player.hp + finalDamage * player.lifesteal);
        }
      }

      // 플레이어 피격 무적 (BUG-8 FIX 유지)
      if (target.type === 'player') {
        target.invincibleTimer = target.invincibleDuration ?? 0.5;
        world.run.lastDamageSource = {
          attackerId: hit.attackerId ?? null,
          label: hit.projectile?.weapon?.name ?? hit.projectile?.weapon?.id ?? hit.attackerId ?? 'unknown',
        };
      }

      // 사망 판정
      if (target.hp <= 0 && !target.pendingDestroy) {
        target.hp             = 0;
        target.isAlive        = false;
        target.pendingDestroy = true;
        events.deaths.push({ entity: target });
      }

      // ── 데미지 텍스트 ─────────────────────────────────────────────────────
      if (damageTextCount < DAMAGE_TEXT.MAX_PER_FRAME) {
        damageTextCount++;
        // 크리티컬 피해: 황금색 + 큰 텍스트 + '!' 접미사
        const textColor = isCrit
          ? DAMAGE_TEXT.COLOR_CRIT
          : (target.type === 'player' ? DAMAGE_TEXT.COLOR_PLAYER : DAMAGE_TEXT.COLOR_ENEMY);

        spawnQueue.push(spawnEffect({
          x:          target.x,
          y:          target.y - target.radius,
          effectType: 'damageText',
          config: {
            text:     isCrit ? `-${finalDamage}!` : `-${finalDamage}`,
            color:    textColor,
            radius:   isCrit ? 20 : 14,
            duration: DAMAGE_TEXT.DURATION,
          },
        }));
      }
    }
  },

  _rollbackProjectileHit(hit) {
    const projectile = hit?.projectile;
    if (!(projectile?.hitTargets instanceof Set)) return;
    const candidateTargetIds = [
      hit?.targetId,
      hit?.target?.id,
    ].filter(Boolean);
    const matchedTargetId = candidateTargetIds.find((targetId) => projectile.hitTargets.has(targetId));
    if (!matchedTargetId) return;

    projectile.hitTargets.delete(matchedTargetId);
    if (typeof projectile.hitCount === 'number') {
      projectile.hitCount = Math.max(0, projectile.hitCount - 1);
    }
  },

  _commitProjectileHit(hit, player) {
    const projectile = hit?.projectile;
    if (!projectile || hit?.attackerId !== player?.id || hit?.target?.type !== 'enemy') return;
    if (!(projectile.hitTargets instanceof Set)) return;

    const targetId = hit?.target?.id ?? hit?.targetId;
    if (!targetId || projectile.hitTargets.has(targetId)) return;

    projectile.hitTargets.add(targetId);
    if (typeof projectile.hitCount === 'number') {
      projectile.hitCount += 1;
    }
  },
};
