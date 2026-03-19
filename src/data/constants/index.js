/**
 * src/data/constants/index.js — 모든 상수 re-export
 *
 * 새로운 코드는 필요한 서브모듈에서 직접 import 권장:
 *   import { RENDER } from './constants/render.js';
 *   import { COMBAT, KNOCKBACK } from './constants/combat.js';
 *
 * 기존 코드가 상위 constants.js 를 통해 import 하는 경우에도 동작 보장.
 */

export * from './render.js';
export * from './combat.js';
export * from './spawn.js';
export * from './progression.js';
export * from './events.js';
export * from './entities.js';
