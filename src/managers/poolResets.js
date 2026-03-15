import { generateId } from '../utils/ids.js';
import { EFFECT_DEFAULTS } from '../data/constants.js';

export function resetProjectile(obj, cfg) {
  obj.id   = generateId();
  obj.type = 'projectile';
  obj.x    = cfg.x ?? 0;
  obj.y    = cfg.y ?? 0;
  obj.dirX  = cfg.dirX  ?? 0;
  obj.dirY  = cfg.dirY  ?? 0;
  obj.speed  = cfg.speed  ?? 300;
  obj.damage = cfg.damage ?? 1;
  obj.radius = cfg.radius ?? 5;
  obj.color  = cfg.color  ?? '#ffee58';
  obj.pierce = cfg.pierce ?? 1;
  obj.hitCount = 0;
  obj.hitTargets.clear();
  obj.maxRange         = cfg.maxRange  ?? 400;
  obj.distanceTraveled = 0;
  obj.behaviorId       = cfg.behaviorId  ?? 'targetProjectile';
  obj.lifetime    = cfg.lifetime    ?? 0;
  obj.maxLifetime = cfg.maxLifetime ?? 0.3;
  obj.ownerId            = cfg.ownerId            ?? null;
  obj.statusEffectId     = cfg.statusEffectId     ?? null;
  obj.statusEffectChance = cfg.statusEffectChance ?? 1.0;
  obj.orbitAngle  = cfg.orbitAngle  ?? 0;
  obj.orbitRadius = cfg.orbitRadius ?? 80;
  obj.orbitSpeed  = cfg.orbitSpeed  ?? Math.PI;
  obj.isAlive        = true;
  obj.pendingDestroy = false;
}

export function resetEffect(obj, cfg) {
  obj.id   = generateId();
  obj.type = 'effect';
  obj.x    = cfg.x ?? 0;
  obj.y    = cfg.y ?? 0;
  obj.effectType = cfg.effectType ?? 'burst';
  obj.color      = cfg.color      ?? '#ff5722';
  obj.text       = cfg.text       ?? '';
  obj.radius     = cfg.radius     ?? 15;
  obj.lifetime   = 0;
  obj.maxLifetime = cfg.duration ?? EFFECT_DEFAULTS.duration;
  obj.isAlive        = true;
  obj.pendingDestroy = false;
}
