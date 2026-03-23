/**
 * src/types.js — deprecated compatibility shim.
 *
 * 레거시 import 경로를 유지하기 위한 문서 전용 파일이다.
 * 실제 타입 단일 출처(SSOT)는 아래 두 모듈이다.
 * - `src/state/worldTypes.js`
 * - `src/state/pipelineTypes.js`
 *
 * 이 파일은 더 이상 typedef 본문을 중복 정의하지 않는다.
 */

/**
 * @typedef {import('./state/worldTypes.js').StatusEffect} StatusEffect
 * @typedef {import('./state/worldTypes.js').PlayerEntity} Player
 * @typedef {import('./state/worldTypes.js').EnemyEntity} Enemy
 * @typedef {import('./state/worldTypes.js').ProjectileEntity} Projectile
 * @typedef {import('./state/worldTypes.js').PickupEntity} Pickup
 * @typedef {import('./state/worldTypes.js').EffectEntity} Effect
 * @typedef {import('./state/worldTypes.js').Camera} Camera
 * @typedef {import('./state/worldTypes.js').WorldState} WorldState
 * @typedef {import('./state/pipelineTypes.js').HitEvent} HitEvent
 * @typedef {import('./state/pipelineTypes.js').DeathEvent} DeathEvent
 * @typedef {import('./state/pipelineTypes.js').WorldEvents} WorldEvents
 * @typedef {import('./state/pipelineTypes.js').GameData} GameData
 * @typedef {import('./state/pipelineTypes.js').PipelineContext} PipelineContext
 */

export {};
