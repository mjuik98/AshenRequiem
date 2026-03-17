import { getStatusEffectData }  from '../../data/statusEffectData.js';
import { statusEffectRegistry }  from '../../data/statusEffectRegistry.js';
import { generateId }            from '../../utils/ids.js';

/**
 * StatusEffectSystem — 상태이상 부여 + 틱 처리
 *
 * CHANGE(P3-⑨): 레지스트리 기반으로 리팩터링
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
      const effect  = entity.statusEffects[i];
      const handler = statusEffectRegistry[effect.type];

      if (handler?.onTick) {
        handler.onTick(entity, effect, deltaTime, events);
      }

      effect.remaining -= deltaTime;

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

    if (def.type === 'slow' || def.type === 'poison') {
      const existing = entity.statusEffects.find(e => e.type === def.type);
      if (existing) {
        existing.remaining = Math.max(existing.remaining, def.duration);
        return;
      }
    }

    const effect = {
      id:              generateId(),
      type:            def.type,
      remaining:       def.duration,
      magnitude:       def.magnitude,
      tickInterval:    def.tickInterval,
      tickAccumulator: 0,
      color:           def.color,
    };

    entity.statusEffects.push(effect);

    const handler = statusEffectRegistry[def.type];
    if (handler?.onApply) {
      handler.onApply(entity, effect, def);
    }
  },

  _removeEffect(entity, effect, idx) {
    // PERF: O(1) swap-and-pop
    const lastIdx = entity.statusEffects.length - 1;
    if (idx < lastIdx) {
      entity.statusEffects[idx] = entity.statusEffects[lastIdx];
    }
    entity.statusEffects.pop();

    const handler = statusEffectRegistry[effect.type];
    if (handler?.onRemove) {
      handler.onRemove(entity, effect);
    }
  },
};
