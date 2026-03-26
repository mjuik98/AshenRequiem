/**
 * src/systems/spawn/EffectTickSystem.js — 이펙트 수명 갱신 시스템
 * 파이프라인 priority 108.
 */
export const EffectTickSystem = {
  update({ world }) {
    const effects = world.entities.effects;
    const deltaTime = world.runtime.deltaTime;
    for (let i = 0; i < effects.length; i++) {
      const e = effects[i];
      if (!e.isAlive || e.pendingDestroy) continue;

      e.lifetime += deltaTime;
      if (e.lifetime >= e.maxLifetime) {
        e.isAlive        = false;
        e.pendingDestroy = true;
      }
    }
  },
};
