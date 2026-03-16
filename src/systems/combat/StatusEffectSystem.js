import { getStatusEffectData } from '../../data/statusEffectData.js';
import { generateId }          from '../../utils/ids.js';

/**
 * StatusEffectSystem — 상태이상 부여 + 틱 처리
 *
 * FIX(bug): poison 데미지를 events.hits 에 synthetic hit 으로 push → DamageSystem 일관 처리
 * FIX(bug): _removeEffect — splice 후 남은 stun 여부로 stunned 재계산
 * SAFETY: unknown effectId 에 warn 로그
 */
export const StatusEffectSystem = {
  applyFromHits({ hits }) {
    for (let i = 0; i < hits.length; i++) {
      const hit  = hits[i];
      const proj = hit.projectile;
      if (!proj?.statusEffectId) continue;
      if (Math.random() > (proj.statusEffectChance ?? 1.0)) continue;
      const target = hit.target;
      if (!target?.isAlive || target.pendingDestroy || !target.statusEffects) continue;
      this._applyEffect(target, proj.statusEffectId);
    }
  },

  tick({ enemies, player, deltaTime, events }) {
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e.isAlive || e.pendingDestroy) continue;
      this._tickEntity(e, deltaTime, events);
    }
    if (player?.isAlive && !player.pendingDestroy) {
      this._tickEntity(player, deltaTime, events);
    }
  },

  _tickEntity(entity, deltaTime, events) {
    if (!entity.statusEffects?.length) return;

    for (let i = entity.statusEffects.length - 1; i >= 0; i--) {
      const effect = entity.statusEffects[i];
      effect.remaining -= deltaTime;

      // poison 데미지 → synthetic hit → DamageSystem 에 위임
      if (effect.type === 'poison' && effect.tickInterval > 0) {
        effect.tickAccumulator = (effect.tickAccumulator || 0) + deltaTime;
        while (effect.tickAccumulator >= effect.tickInterval) {
          effect.tickAccumulator -= effect.tickInterval;
          if (!entity.isAlive || entity.pendingDestroy) break;
          events.hits.push({
            attackerId: 'poison', targetId: entity.id, target: entity,
            damage: effect.magnitude, projectileId: null, projectile: null,
          });
        }
      }

      if (effect.remaining <= 0 && !entity.pendingDestroy) {
        this._removeEffect(entity, effect, i);
      }
    }
  },

  _applyEffect(entity, effectId) {
    const def = getStatusEffectData(effectId);
    if (!def) {
      console.warn(`[StatusEffectSystem] 알 수 없는 effectId: ${effectId}`);
      return;
    }

    // slow / poison: 중첩 시 기존 효과 갱신 (최대 지속)
    if (def.type === 'slow' || def.type === 'poison') {
      const existing = entity.statusEffects.find(e => e.type === def.type);
      if (existing) {
        existing.remaining = Math.max(existing.remaining, def.duration);
        return;
      }
    }

    entity.statusEffects.push({
      id:              generateId(),
      type:            def.type,
      remaining:       def.duration,
      magnitude:       def.magnitude,
      tickInterval:    def.tickInterval,
      tickAccumulator: 0,
      color:           def.color,
    });

    if (def.type === 'stun') entity.stunned = true;
  },

  _removeEffect(entity, effect, idx) {
    entity.statusEffects.splice(idx, 1);
    if (effect.type === 'stun') {
      // FIX(bug): splice 후 남은 stun 여부로 재계산
      entity.stunned = entity.statusEffects.some(e => e.type === 'stun');
    }
  },
};
