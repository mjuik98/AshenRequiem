/**
 * src/state/worldTypes.js — 런타임 엔티티 타입 정의 (JSDoc 전용)
 *
 * ── 리팩터링 이력 ─────────────────────────────────────────────────────
 * Before:
 *   WorldEvents typedef 가 이 파일과 pipelineTypes.js 양쪽에 중복 정의됨.
 *   HitEvent / DeathEvent 도 pipelineTypes.js 에만 있어 참조 불일치.
 *
 * After:
 *   WorldEvents 는 pipelineTypes.js 에 단일 정의 유지.
 *   이 파일의 WorldEvents 는 해당 파일 import 참조로 교체.
 *   엔티티 타입(Player/Enemy/Projectile/Pickup/Effect/WorldState)은 이 파일 전용.
 * ──────────────────────────────────────────────────────────────────────
 */

// ─── 엔티티 타입 ─────────────────────────────────────────────────────────────

/**
 * @typedef {Object} StatusEffect
 * @property {string}  type        'burn' | 'freeze' | 'stun' | 'slow' | ...
 * @property {number}  duration    남은 지속 시간 (s)
 * @property {number}  [magnitude] 효과 강도 (0~1)
 * @property {number}  [tickDmg]   틱 데미지 (s당)
 * @property {number}  [tickTimer] 다음 틱까지 남은 시간 (s)
 */

/**
 * @typedef {Object} PlayerEntity
 * @property {string}   id
 * @property {number}   x
 * @property {number}   y
 * @property {number}   radius
 * @property {number}   hp
 * @property {number}   maxHp
 * @property {number}   moveSpeed
 * @property {number}   xp
 * @property {number}   level
 * @property {boolean}  isAlive
 * @property {boolean}  pendingDestroy
 * @property {number}   invincibleTimer
 * @property {number}   magnetRadius
 * @property {StatusEffect[]} statusEffects
 */

/**
 * @typedef {Object} EnemyEntity
 * @property {string}   id
 * @property {string}   enemyDataId
 * @property {number}   x
 * @property {number}   y
 * @property {number}   radius
 * @property {number}   hp
 * @property {number}   maxHp
 * @property {number}   damage
 * @property {number}   speed
 * @property {number}   xpValue
 * @property {boolean}  isAlive
 * @property {boolean}  pendingDestroy
 * @property {string}   [behaviorId]
 * @property {string}   [color]
 * @property {{ triggered: boolean[] }|null} [bossPhaseState]
 * @property {StatusEffect[]} statusEffects
 */

/**
 * @typedef {Object} ProjectileEntity
 * @property {string}   id
 * @property {string}   ownerId
 * @property {number}   x
 * @property {number}   y
 * @property {number}   radius
 * @property {number}   dirX
 * @property {number}   dirY
 * @property {number}   speed
 * @property {number}   damage
 * @property {number}   pierce
 * @property {number}   hitCount
 * @property {Set<string>} hitTargets
 * @property {number}   maxRange
 * @property {number}   distanceTraveled
 * @property {boolean}  isAlive
 * @property {boolean}  pendingDestroy
 * @property {string}   [behaviorId]
 * @property {string}   [color]
 */

/**
 * @typedef {Object} PickupEntity
 * @property {string}  id
 * @property {number}  x
 * @property {number}  y
 * @property {number}  radius
 * @property {number}  xpValue
 * @property {boolean} isAlive
 * @property {boolean} pendingDestroy
 * @property {boolean} magnetized
 */

/**
 * @typedef {Object} EffectEntity
 * @property {string}  id
 * @property {string}  effectType
 * @property {number}  x
 * @property {number}  y
 * @property {boolean} isAlive
 * @property {number}  lifetime
 * @property {number}  maxLifetime
 * @property {string}  [color]
 * @property {string}  [text]
 */

// ─── Camera / World ───────────────────────────────────────────────────────────

/**
 * @typedef {Object} Camera
 * @property {number} x
 * @property {number} y
 */

/**
 * WorldEvents 는 pipelineTypes.js 에서 단일 정의 관리.
 * @typedef {import('./pipelineTypes.js').WorldEvents} WorldEvents
 */

/**
 * @typedef {Object} WorldState
 * @property {PlayerEntity}       player
 * @property {EnemyEntity[]}      enemies
 * @property {ProjectileEntity[]} projectiles
 * @property {PickupEntity[]}     pickups
 * @property {EffectEntity[]}     effects
 * @property {object[]}           spawnQueue
 * @property {WorldEvents}        events
 * @property {Camera}             camera
 * @property {{ nextFloat: () => number }} rng
 * @property {number}             elapsedTime
 * @property {number}             deltaTime
 * @property {number}             killCount
 * @property {number}             runCurrencyEarned
 * @property {number}             bossKillCount
 * @property {'playing'|'paused'|'levelup'|'dead'} playMode
 */

export {}; // JSDoc 전용 모듈 — 런타임 export 없음
