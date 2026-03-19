/**
 * src/state/pipelineTypes.js — 파이프라인 계약 구조 JSDoc 타입 정의 (단일 출처)
 *
 * ── 리팩터링 이력 ─────────────────────────────────────────────────────
 * Before:
 *   WorldEvents 가 worldTypes.js 와 이 파일 양쪽에 중복 정의.
 *   WorldState 도 양쪽에 중복 정의.
 *
 * After:
 *   HitEvent / DeathEvent / WorldEvents → 이 파일이 단일 출처(source of truth).
 *   WorldState                          → worldTypes.js 가 단일 출처.
 *   이 파일의 WorldState 참조는 worldTypes.js import 로 교체.
 * ──────────────────────────────────────────────────────────────────────
 */

// ─────────────────────────────────────────────────────────────
// Services
// ─────────────────────────────────────────────────────────────

/**
 * @typedef {Object} Services
 * @property {import('../managers/ObjectPool.js').ObjectPool} projectilePool
 * @property {import('../managers/ObjectPool.js').ObjectPool} effectPool
 * @property {import('../managers/ObjectPool.js').ObjectPool} enemyPool
 * @property {import('../managers/ObjectPool.js').ObjectPool} pickupPool
 * @property {object}            soundSystem   SoundSystem | NullSoundSystem
 * @property {HTMLCanvasElement} canvas
 */

// ─────────────────────────────────────────────────────────────
// World Events  ← 단일 정의 (worldTypes.js 의 중복 제거됨)
// ─────────────────────────────────────────────────────────────

/**
 * @typedef {Object} HitEvent
 * @property {string}  attackerId
 * @property {string}  targetId
 * @property {object}  target
 * @property {number}  damage
 * @property {string}  [projectileId]
 * @property {object}  [projectile]
 */

/**
 * @typedef {Object} DeathEvent
 * @property {string} entityId
 * @property {object} entity
 * @property {string} [killedBy]
 */

/**
 * @typedef {Object} WorldEvents
 * @property {HitEvent[]}   hits
 * @property {DeathEvent[]} deaths
 * @property {object[]}     pickupCollected
 * @property {object[]}     levelUpRequested
 * @property {object[]}     statusApplied
 * @property {object[]}     bossPhaseChanged
 * @property {object[]}     spawnRequested
 */

// ─────────────────────────────────────────────────────────────
// Input
// ─────────────────────────────────────────────────────────────

/**
 * @typedef {Object} InputState
 * @property {boolean} up
 * @property {boolean} down
 * @property {boolean} left
 * @property {boolean} right
 * @property {{ x: number, y: number }} mousePosition
 */

// ─────────────────────────────────────────────────────────────
// GameData
// ─────────────────────────────────────────────────────────────

/**
 * @typedef {Object} GameData
 * @property {object[]} waveData
 * @property {object[]} upgradeData
 * @property {object[]} weaponData
 * @property {object[]} enemyData
 * @property {object[]} bossData
 * @property {object[]} synergyData
 * @property {object[]} statusEffectData
 */

// ─────────────────────────────────────────────────────────────
// Pipeline Context
// ─────────────────────────────────────────────────────────────

/**
 * 각 System.update(ctx) 의 매개변수 타입.
 * WorldState 는 worldTypes.js 에서 단일 정의.
 *
 * @typedef {Object} PipelineContext
 * @property {import('./worldTypes.js').WorldState} world
 * @property {InputState}  input
 * @property {GameData}    data
 * @property {Services}    services
 */

export {}; // JSDoc 전용 모듈 — 런타임 export 없음
