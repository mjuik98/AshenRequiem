/**
 * src/types.js — 런타임 Entity / State 타입 정의 (JSDoc @typedef)
 *
 * ─── 변경 사항 ────────────────────────────────────────────────────────
 * [P2 TypeSafety] 주요 Entity 필드 JSDoc 타입 집중 선언
 *   Before: 각 createXxx.js에 암묵적 구조만 존재, IDE 자동완성 없음
 *   After:  이 파일의 @typedef를 각 파일에서 @type {Player} 등으로 참조
 *           → 오탈자 조기 발견, 자동완성, 코드 탐색 지원
 * ──────────────────────────────────────────────────────────────────────
 *
 * ※ 런타임 코드 없음 — 타입 힌트 전용 파일.
 */

// ── 플레이어 ─────────────────────────────────────────────────────────

/**
 * @typedef {object} Player
 * @property {string}          id
 * @property {'player'}        type
 * @property {number}          x
 * @property {number}          y
 * @property {number}          radius
 * @property {number}          hp
 * @property {number}          maxHp
 * @property {number}          moveSpeed       - 초당 픽셀
 * @property {number}          magnetRadius
 * @property {number}          lifesteal       - 0~1 (흡혈 비율)
 * @property {number}          level
 * @property {number}          xp
 * @property {boolean}         isAlive
 * @property {boolean}         pendingDestroy
 * @property {Weapon[]}        weapons
 * @property {Record<string, number>} upgradeCounts
 * @property {Set<string>}     acquiredUpgrades
 * @property {ActiveSynergy[]} activeSynergies
 * @property {StatusEffect[]}  statusEffects
 * @property {number}          invincibleTimer
 * @property {number}          invincibleDuration - 초
 * @property {string}          color
 */

// ── 적 ───────────────────────────────────────────────────────────────

/**
 * @typedef {object} Enemy
 * @property {string}          id
 * @property {'enemy'}         type
 * @property {string}          enemyDataId
 * @property {string}          name
 * @property {number}          x
 * @property {number}          y
 * @property {number}          radius
 * @property {number}          hp
 * @property {number}          maxHp
 * @property {number}          moveSpeed       - 초당 픽셀
 * @property {number}          damage
 * @property {number}          xpValue
 * @property {string}          color
 * @property {number}          hitFlashTimer
 * @property {boolean}         chargeEffect
 * @property {number}          knockbackX
 * @property {number}          knockbackY
 * @property {number}          knockbackTimer
 * @property {number}          knockbackResist - 0~1
 * @property {StatusEffect[]}  statusEffects
 * @property {boolean}         stunned
 * @property {boolean}         isElite
 * @property {boolean}         isBoss
 * @property {string}          behaviorId
 * @property {object|null}     behaviorState
 * @property {object|null}     projectileConfig
 * @property {DeathSpawnConfig|null} deathSpawn
 * @property {boolean}         isAlive
 * @property {boolean}         pendingDestroy
 * @property {number[]|undefined} _phaseFlags  - BossPhaseSystem 전용
 */

// ── 투사체 ────────────────────────────────────────────────────────────

/**
 * @typedef {object} Projectile
 * @property {string}    id
 * @property {'projectile'} type
 * @property {number}    x
 * @property {number}    y
 * @property {number}    dirX
 * @property {number}    dirY
 * @property {number}    speed           - 초당 픽셀
 * @property {number}    damage
 * @property {number}    radius
 * @property {string}    color
 * @property {number}    pierce
 * @property {number}    hitCount
 * @property {Set<string>} hitTargets
 * @property {number}    maxRange
 * @property {number}    distanceTraveled
 * @property {string}    behaviorId
 * @property {number}    lifetime        - 경과 시간(초)
 * @property {number}    maxLifetime     - 초
 * @property {string|null} ownerId
 * @property {string|null} statusEffectId
 * @property {number}    statusEffectChance - 0~1
 * @property {number}    orbitAngle
 * @property {number}    orbitRadius
 * @property {number}    orbitSpeed
 * @property {boolean}   isAlive
 * @property {boolean}   pendingDestroy
 * @property {boolean}   _reversed
 */

// ── 무기 ─────────────────────────────────────────────────────────────

/**
 * @typedef {object} Weapon
 * @property {string}  id
 * @property {string}  name
 * @property {number}  damage
 * @property {number}  cooldown        - 초
 * @property {number}  currentCooldown - 초
 * @property {string}  behaviorId
 * @property {number}  range
 * @property {number}  speed
 * @property {number}  radius
 * @property {number}  pierce
 * @property {string}  color
 * @property {number}  level
 * @property {number}  maxLevel
 */

// ── 상태이상 ─────────────────────────────────────────────────────────

/**
 * @typedef {object} StatusEffect
 * @property {string}  type            - statusEffectRegistry의 키
 * @property {number}  duration        - 남은 시간(초)
 * @property {number}  magnitude       - 효과 강도
 * @property {number}  [tickInterval]  - 틱 간격(초), dot 전용
 * @property {number}  [tickAccumulator]
 */

// ── 기타 ─────────────────────────────────────────────────────────────

/**
 * @typedef {object} ActiveSynergy
 * @property {string} id
 * @property {string} name
 */

/**
 * @typedef {object} DeathSpawnConfig
 * @property {string} enemyId
 * @property {number} count
 */

/**
 * @typedef {object} HitEvent
 * @property {string}          attackerId
 * @property {string}          targetId
 * @property {Enemy|Player}    target
 * @property {number}          damage
 * @property {string|null}     projectileId
 * @property {Projectile|null} projectile
 */

/**
 * @typedef {object} DeathEvent
 * @property {Enemy|Player} entity
 */

/**
 * @typedef {object} BossPhaseChangedEvent
 * @property {string}  bossId
 * @property {number}  phaseIndex
 * @property {string}  newBehaviorId
 * @property {string}  announceText
 */

/**
 * @typedef {object} World
 * @property {Player}       player
 * @property {Enemy[]}      enemies
 * @property {Projectile[]} projectiles
 * @property {object[]}     pickups
 * @property {object[]}     effects
 * @property {object[]}     spawnQueue
 * @property {WorldEvents}  events
 * @property {Camera}       camera
 * @property {number}       elapsedTime  - 초
 * @property {number}       deltaTime    - 초 (이번 프레임)
 * @property {number}       killCount
 * @property {string}       playMode     - 'playing' | 'paused' | 'levelUp' | 'dead'
 */

/**
 * @typedef {object} WorldEvents
 * @property {HitEvent[]}             hits
 * @property {DeathEvent[]}           deaths
 * @property {object[]}               pickupCollected
 * @property {object[]}               levelUpRequested
 * @property {object[]}               statusApplied
 * @property {BossPhaseChangedEvent[]} bossPhaseChanged
 * @property {object[]}               spawnRequested
 */

/**
 * @typedef {object} Camera
 * @property {number} x
 * @property {number} y
 */

export {}; // 이 파일을 ES 모듈로 인식시키기 위한 빈 export
