/**
 * worldTypes.js — world 객체 JSDoc 타입 명세
 *
 * WHY(P1): world는 모든 시스템이 공유하는 핵심 계약이다.
 *   @typedef로 명시하면 VSCode 자동완성·타입 검사가 즉시 작동하고
 *   필드 추가 시 어느 시스템이 그 필드를 읽는지 추적이 가능해진다.
 *
 * 사용법:
 *   createWorld.js 최상단에 이 파일을 import 없이 참조하거나,
 *   각 시스템 파일 최상단에
 *     import './../../state/worldTypes.js'; // type-only
 *   주석을 추가해 IDE가 타입을 인식하게 한다.
 *
 *   JSDoc @param 사용 예:
 *     /** @param {WorldState} world *\/
 *     function mySystem({ world }) { ... }
 */

// ─── Entity 타입 ───────────────────────────────────────────────────

/**
 * @typedef {Object} PlayerEntity
 * @property {string}   id
 * @property {'player'} type
 * @property {number}   x
 * @property {number}   y
 * @property {number}   hp
 * @property {number}   maxHp
 * @property {number}   radius
 * @property {number}   speed                 (px/s)
 * @property {boolean}  isAlive
 * @property {boolean}  pendingDestroy
 * @property {number}   invincibleTimer        (s)
 * @property {number}   invincibleDuration     (s)
 * @property {number}   xp
 * @property {number}   level
 * @property {number}   xpToNextLevel
 * @property {number}   lifesteal              (0~1)
 * @property {WeaponState[]} weapons
 * @property {Record<string, number>} upgradeCounts
 */

/**
 * @typedef {Object} WeaponState
 * @property {string} id
 * @property {number} level
 * @property {number} currentCooldown
 * @property {number} cooldown         (s)
 * @property {number} damage
 * @property {number} radius           (px)
 * @property {number} pierce
 * @property {string} [behaviorId]
 */

/**
 * @typedef {Object} EnemyEntity
 * @property {string}   id
 * @property {'enemy'}  type
 * @property {string}   enemyId          enemyData의 키
 * @property {number}   x
 * @property {number}   y
 * @property {number}   hp
 * @property {number}   maxHp
 * @property {number}   radius           (px)
 * @property {number}   damage
 * @property {number}   speed            (px/s)
 * @property {boolean}  isAlive
 * @property {boolean}  pendingDestroy
 * @property {number}   xpValue
 * @property {boolean}  [isElite]
 * @property {boolean}  [isBoss]
 * @property {string}   [behaviorId]     enemyBehaviorRegistry 키
 * @property {StatusEffectInstance[]} [statusEffects]
 * @property {number}   [knockbackX]
 * @property {number}   [knockbackY]
 * @property {number}   [knockbackTimer]
 */

/**
 * @typedef {Object} ProjectileEntity
 * @property {string}      id
 * @property {'projectile'} type
 * @property {number}      x
 * @property {number}      y
 * @property {number}      dirX
 * @property {number}      dirY
 * @property {number}      speed          (px/s)
 * @property {number}      damage
 * @property {number}      radius         (px)
 * @property {number}      pierce
 * @property {number}      hitCount
 * @property {Set<string>} hitTargets
 * @property {number}      maxRange       (px)
 * @property {number}      distanceTraveled (px)
 * @property {string}      behaviorId
 * @property {number}      lifetime       (s)
 * @property {number}      maxLifetime    (s)
 * @property {string|null} ownerId
 * @property {string|null} statusEffectId
 * @property {number}      statusEffectChance (0~1)
 * @property {boolean}     isAlive
 * @property {boolean}     pendingDestroy
 */

/**
 * @typedef {Object} PickupEntity
 * @property {string}   id
 * @property {'pickup'} type
 * @property {number}   x
 * @property {number}   y
 * @property {number}   radius     (px)
 * @property {number}   xpValue
 * @property {boolean}  isAlive
 * @property {boolean}  pendingDestroy
 */

/**
 * @typedef {Object} EffectEntity
 * @property {string}   id
 * @property {'effect'} type
 * @property {number}   x
 * @property {number}   y
 * @property {number}   lifetime    (s)
 * @property {number}   maxLifetime (s)
 * @property {boolean}  isAlive
 * @property {boolean}  pendingDestroy
 */

// ─── StatusEffect 타입 ─────────────────────────────────────────────

/**
 * @typedef {Object} StatusEffectInstance
 * @property {string} id           statusEffectRegistry 키
 * @property {number} duration     남은 지속 시간 (s)
 * @property {number} maxDuration  (s)
 * @property {number} stacks
 * @property {Record<string, any>} [params]
 */

// ─── Camera 타입 ───────────────────────────────────────────────────

/**
 * @typedef {Object} CameraState
 * @property {number} x     월드 좌표 기준 카메라 중심 X
 * @property {number} y     월드 좌표 기준 카메라 중심 Y
 * @property {number} width  뷰포트 너비 (px)
 * @property {number} height 뷰포트 높이 (px)
 */

// ─── 이벤트 타입 ───────────────────────────────────────────────────

/**
 * @typedef {Object} HitEvent
 * @property {string}              attackerId
 * @property {string}              targetId
 * @property {EnemyEntity|PlayerEntity} target
 * @property {number}              damage
 * @property {string|null}         projectileId
 * @property {ProjectileEntity|null} projectile
 */

/**
 * @typedef {Object} DeathEvent
 * @property {string}      entityId
 * @property {EnemyEntity} entity
 * @property {number}      x
 * @property {number}      y
 * @property {number}      xpValue
 */

/**
 * @typedef {Object} PickupCollectedEvent
 * @property {string}       pickupId
 * @property {PickupEntity} pickup
 * @property {string}       playerId
 */

/**
 * @typedef {Object} WorldEvents
 * @property {HitEvent[]}              hits
 * @property {DeathEvent[]}            deaths
 * @property {PickupCollectedEvent[]}  pickupCollected
 * @property {object[]}                levelUpRequested
 * @property {object[]}                spawnRequested
 * @property {object[]}                bossPhaseChanged   보스 페이즈 전환 이벤트 (P3 확장)
 */

// ─── SpawnQueue 타입 ───────────────────────────────────────────────

/**
 * @typedef {Object} SpawnRequest
 * @property {'enemy'|'projectile'|'pickup'|'effect'} type
 * @property {object} config
 */

// ─── 최상위 WorldState 타입 ────────────────────────────────────────

/**
 * @typedef {Object} WorldState
 * @property {number}            time          총 경과 시간 (s)
 * @property {number}            deltaTime     프레임 델타 (s)
 * @property {number}            elapsedTime   전투 시작 후 경과 (s)
 * @property {number}            killCount
 * @property {'playing'|'levelup'|'paused'|'dead'} playMode
 *
 * @property {PlayerEntity}      player
 * @property {EnemyEntity[]}     enemies
 * @property {ProjectileEntity[]} projectiles
 * @property {PickupEntity[]}    pickups
 * @property {EffectEntity[]}    effects
 * @property {CameraState}       camera
 *
 * @property {SpawnRequest[]}    spawnQueue
 * @property {string[]}          destroyQueue
 * @property {WorldEvents}       events
 */

// 이 파일은 런타임에서 아무것도 export하지 않는다.
// JSDoc 타입 힌트 전용 파일이다.
export {};
