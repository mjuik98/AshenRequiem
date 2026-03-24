/**
 * src/entities/entityDefaults.js — 엔티티 기본값(defaults) 중앙 정의
 *
 * ── 개선 이력 ──────────────────────────────────────────────────────
 *  [이전] createProjectile.js / resetProjectile.js 가 18개 필드를 각각 중복 나열.
 *         createEffect.js / resetEffect.js, createPickup.js / resetPickup.js 도 동일.
 *         entityDefaults.js에 기본값 상수가 이미 있었으나 아무도 import하지 않아 사장.
 *
 *  [이후] applyEntityFields(target, defaults, overrides) 를 추가해
 *         create / reset 함수가 기본값을 한 곳에서 관리하도록 통일.
 *         필드 추가·삭제 시 이 파일 한 곳만 수정하면 됨.
 * ──────────────────────────────────────────────────────────────────
 */

// ─── Projectile ───────────────────────────────────────────────────

export const PROJECTILE_DEFAULTS = {
  x:                  0,
  y:                  0,
  dirX:               0,
  dirY:               0,
  angle:              0,
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
  tickInterval:       null,
  tickTimer:          0,
  bounceRemaining:    0,
  _lastRicochetHitCount: 0,
  beamAngle:          0,
  beamLength:         0,
  isAlive:            true,
  pendingDestroy:     false,
  _reversed:          false,
};

// ─── Effect ───────────────────────────────────────────────────────

export const EFFECT_DEFAULTS_SHAPE = {
  x:              0,
  y:              0,
  effectType:     'burst',
  color:          '#ff5722',
  text:           '',
  radius:         15,
  lifetime:       0,
  maxLifetime:    0.5,   // constants.js EFFECT_DEFAULTS.duration 과 동기화
  isAlive:        true,
  pendingDestroy: false,
};

// ─── Pickup ───────────────────────────────────────────────────────

export const PICKUP_DEFAULTS_SHAPE = {
  x:              0,
  y:              0,
  xpValue:        1,
  color:          '#a5d6a7',
  radius:         8,
  pickupType:     'xp',
  magnetized:     false,
  vacuumPulled:   false,
  collected:      false,
  isAlive:        true,
  pendingDestroy: false,
};

// ─── 공용 헬퍼 ────────────────────────────────────────────────────

/**
 * target 객체의 각 필드를 defaults 기준으로 채운다.
 * overrides[key]가 undefined가 아니면 override 값을 우선 사용.
 *
 * @param {object} target    채울 대상 객체 (create에서는 {}, reset에서는 기존 obj)
 * @param {object} defaults  기본값 객체
 * @param {object} overrides config / cfg 객체
 * @returns {object}         target (체인 편의를 위해 반환)
 */
export function applyEntityFields(target, defaults, overrides = {}) {
  for (const key of Object.keys(defaults)) {
    target[key] = overrides[key] !== undefined ? overrides[key] : defaults[key];
  }
  return target;
}

/**
 * @deprecated applyEntityFields 로 교체됨. 하위 호환을 위해 잠시 유지.
 */
export function applyDefaults(target, defaults, overrides = {}) {
  return applyEntityFields(target, defaults, overrides);
}
