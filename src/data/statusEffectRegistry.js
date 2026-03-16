/**
 * statusEffectRegistry.js — 상태이상 핸들러 레지스트리
 *
 * CHANGE(P3-⑨): 상태이상 타입을 StatusEffectSystem 내부 switch/if 분기에서 분리
 */

export const statusEffectRegistry = {

  /**
   * slow — 이동 속도 감소
   */
  slow: {
    onApply(entity, effect, def) {},
    onTick(entity, effect, deltaTime, events) {},
    onRemove(entity, effect) {},
  },

  /**
   * poison — 지속 데미지
   */
  poison: {
    onApply(entity, effect, def) {
      effect.tickAccumulator = 0;
    },
    onTick(entity, effect, deltaTime, events) {
      if (effect.tickInterval <= 0) return;
      effect.tickAccumulator = (effect.tickAccumulator || 0) + deltaTime;
      while (effect.tickAccumulator >= effect.tickInterval) {
        effect.tickAccumulator -= effect.tickInterval;
        if (!entity.isAlive || entity.pendingDestroy) break;
        events.hits.push({
          attackerId:   'poison',
          targetId:     entity.id,
          target:       entity,
          damage:       effect.magnitude,
          projectileId: null,
          projectile:   null,
        });
      }
    },
    onRemove(entity, effect) {},
  },

  /**
   * stun — 행동 불능
   */
  stun: {
    onApply(entity, effect, def) {
      entity.stunned = true;
    },
    onTick(entity, effect, deltaTime, events) {},
    onRemove(entity, effect) {
      entity.stunned = (entity.statusEffects ?? []).some(e => e.type === 'stun');
    },
  },
};
