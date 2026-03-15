import { getStatusEffectData } from '../../data/statusEffectData.js';
import { generateId } from '../../utils/ids.js';
export const StatusEffectSystem = {
  applyFromHits({ hits }) {
    for (let i = 0; i < hits.length; i++) {
      const hit = hits[i];
      const proj = hit.projectile;
      if (!proj || !proj.statusEffectId) continue;
      if (Math.random() > (proj.statusEffectChance ?? 1.0)) continue;
      const target = hit.target;
      if (!target || !target.isAlive || target.pendingDestroy || !target.statusEffects) continue;
      this._applyEffect(target, proj.statusEffectId);
    }
  },
  tick({ enemies, player, deltaTime, events, spawnQueue }) {
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e.isAlive || e.pendingDestroy) continue;
      this._tickEntity(e, deltaTime, events, spawnQueue);
    }
    if (player && player.isAlive && !player.pendingDestroy) {
      this._tickEntity(player, deltaTime, events, spawnQueue);
    }
  },
  _tickEntity(entity, deltaTime, events, spawnQueue) {
    if (!entity.statusEffects || entity.statusEffects.length === 0) return;
    for (let i = entity.statusEffects.length - 1; i >= 0; i--) {
      const effect = entity.statusEffects[i];
      effect.remaining -= deltaTime;
      if (effect.type === 'poison' && effect.tickInterval > 0) {
        effect.tickAccumulator += deltaTime;
        while (effect.tickAccumulator >= effect.tickInterval) {
          effect.tickAccumulator -= effect.tickInterval;
          if (!entity.isAlive) break;
          entity.hp -= effect.magnitude;
          spawnQueue.push({ type:'effect', config:{ x:entity.x, y:entity.y - entity.radius, effectType:'damageText', text:`-${effect.magnitude}`, color:'#aed581', duration:0.4 } });
          if (entity.hp <= 0 && entity.isAlive) {
            entity.hp = 0; entity.isAlive = false; entity.pendingDestroy = true;
            events.deaths.push({ entityId:entity.id, entity, killedBy:'poison' });
          }
        }
      }
      if (effect.remaining <= 0 && !entity.pendingDestroy) this._removeEffect(entity, effect, i);
    }
  },
  _applyEffect(target, effectId) {
    const def = getStatusEffectData(effectId);
    if (!def) return;
    const existing = target.statusEffects.find(e => e.type === def.type);
    if (existing) { existing.remaining = def.duration; return; }
    const effect = { id: generateId(), type: def.type, remaining: def.duration, magnitude: def.magnitude, tickInterval: def.tickInterval || 0, tickAccumulator: 0, color: def.color };
    if (def.type === 'slow') { effect._savedMoveSpeed = target.moveSpeed; target.moveSpeed = Math.max(10, Math.floor(target.moveSpeed * def.magnitude)); }
    if (def.type === 'stun') { target.stunned = true; }
    target.statusEffects.push(effect);
  },
  _removeEffect(entity, effect, index) {
    if (effect.type === 'slow' && effect._savedMoveSpeed !== undefined) entity.moveSpeed = effect._savedMoveSpeed;
    if (effect.type === 'stun') entity.stunned = false;
    entity.statusEffects.splice(index, 1);
  },
};
