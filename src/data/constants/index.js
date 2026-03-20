/**
 * src/data/constants/index.js — 모든 상수 명시적 re-export
 *
 * FIX(P4-11): 와일드카드(export *) re-export → 명시적 named export로 교체
 *
 * Before (위험):
 *   export * from './render.js';
 *   export * from './combat.js';
 *   ...
 *   → 두 서브모듈이 동일 이름을 export하면 마지막 것이 덮어써짐
 *   → 런타임 오류 없이 조용히 충돌 (silent bug)
 *   → 어떤 파일에서 어떤 심볼이 오는지 추적 불가
 *
 * After (안전):
 *   각 심볼을 명시적으로 re-export
 *   → 이름 충돌 시 lint/TypeScript가 즉시 감지
 *   → 각 상수의 출처 파일을 코드에서 명확히 파악 가능
 *   → 기존 import 코드 변경 불필요 (하위 호환 유지)
 *
 * 새로운 코드는 필요한 서브모듈에서 직접 import 권장:
 *   import { RENDER } from '../data/constants/render.js';
 *   import { COMBAT } from '../data/constants/combat.js';
 */

// ── render.js ──────────────────────────────────────────────────────────
export { RENDER, DAMAGE_TEXT, EFFECT_DEFAULTS } from './render.js';

// ── combat.js ──────────────────────────────────────────────────────────
export { COMBAT, KNOCKBACK, COLLISION_CULL_MARGIN, ELITE_BEHAVIOR, CRIT } from './combat.js';

// ── spawn.js ───────────────────────────────────────────────────────────
export { SPAWN } from './spawn.js';

// ── progression.js ─────────────────────────────────────────────────────
export { PROGRESSION, BOSS, DEBUG, XP_TABLE, getXpForLevel } from './progression.js';

// ── events.js ──────────────────────────────────────────────────────────
export { EVENT_TYPES } from './events.js';

// ── entities.js ────────────────────────────────────────────────────────
export { PLAYER_DEFAULTS, PICKUP_DEFAULTS, PICKUP_BEHAVIOR } from './entities.js';
