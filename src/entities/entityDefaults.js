/**
 * src/entities/entityDefaults.js — 엔티티 기본값(defaults) 중앙 정의
 */
export const PROJECTILE_DEFAULTS = {
  x:                  0,
  y:                  0,
  dirX:               0,
  dirY:               0,
  speed:              300,
  damage:             1,
  radius:             5,
  color:              '#ffee58',
  pierce:             1,
  maxRange:           400,
  distanceTraveled:   0,
  behaviorId:         'targetProjectile',
  lifetime:           0,
  maxLifetime:        0.3,
  ownerId:            null,
  statusEffectId:     null,
  statusEffectChance: 1.0,
  orbitAngle:         0,
  orbitRadius:        80,
  orbitSpeed:         Math.PI,
  isAlive:            true,
  pendingDestroy:     false,
  _reversed:          false,
};

export const EFFECT_DEFAULTS_SHAPE = {
  x:              0,
  y:              0,
  effectType:     'burst',
  color:          '#ff5722',
  text:           '',
  radius:         15,
  lifetime:       0,
  isAlive:        true,
  pendingDestroy: false,
};

export const PICKUP_DEFAULTS_SHAPE = {
  x:              0,
  y:              0,
  xpValue:        null,
  color:          null,
  radius:         null,
  pickupType:     'xp',
  magnetized:     false,
  collected:      false,
  isAlive:        true,
  pendingDestroy: false,
};

export function applyDefaults(target, defaults, overrides = {}) {
  for (const key of Object.keys(defaults)) {
    target[key] = overrides[key] !== undefined ? overrides[key] : defaults[key];
  }
}
