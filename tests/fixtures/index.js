/**
 * tests/fixtures/index.js — 공용 테스트 픽스처 팩토리
 *
 * [개선 P0-②] WeaponSystem.test.js, MovementSystems.test.js 의
 *   인라인 픽스처를 이 파일로 통합.
 *   기존 파일에 makeWeapon() 추가.
 *
 * ─── 변경 이력 ────────────────────────────────────────────────────────
 * [원본] makePlayer / makeEnemy / makeProjectile / makeEvents / makeWorld
 * [추가] makeWeapon() — WeaponSystem.test.js 인라인 픽스처 통합
 * ──────────────────────────────────────────────────────────────────────
 *
 * 사용 방법:
 *   import { makePlayer, makeEnemy, makeProjectile, makeWeapon,
 *            makeEvents, makeWorld, makeHit } from './fixtures/index.js';
 *
 *   const player = makePlayer({ hp: 50, level: 3 });
 *   const enemy  = makeEnemy({ x: 100, isBoss: true });
 *   const weapon = makeWeapon({ cooldown: 0.5, damage: 10 });
 *   const world  = makeWorld({ player, enemies: [enemy] });
 */

let _idCounter = 0;
function nextId(prefix = 'e') {
  return `${prefix}_${++_idCounter}`;
}

// ── 플레이어 ─────────────────────────────────────────────────────────

/**
 * @param {Partial<object>} overrides
 * @returns {object}
 */
export function makePlayer(overrides = {}) {
  return {
    id:               'player',
    type:             'player',
    x:                0,
    y:                0,
    radius:           16,
    hp:               100,
    maxHp:            100,
    moveSpeed:        200,
    magnetRadius:     60,
    lifesteal:        0,
    level:            1,
    xp:               0,
    xpToNextLevel:    5,
    isAlive:          true,
    pendingDestroy:   false,
    invincibleTimer:  0,
    invincibleDuration: 0.5,
    weapons:          [],
    upgradeCounts:    {},
    acquiredUpgrades: new Set(),
    activeSynergies:  [],
    statusEffects:    [],
    ...overrides,
  };
}

// ── 적 ───────────────────────────────────────────────────────────────

/**
 * @param {Partial<object>} overrides
 * @returns {object}
 */
export function makeEnemy(overrides = {}) {
  return {
    id:             nextId('enemy'),
    type:           'enemy',
    enemyId:        'slime',
    x:              100,
    y:              0,
    radius:         20,
    hp:             50,
    maxHp:          50,
    damage:         5,
    moveSpeed:      80,
    xpValue:        1,
    currencyValue:  1,
    isAlive:        true,
    pendingDestroy: false,
    isElite:        false,
    isBoss:         false,
    knockbackX:     0,
    knockbackY:     0,
    knockbackTimer: 0,
    statusEffects:  [],
    ...overrides,
  };
}

// ── 무기 ─────────────────────────────────────────────────────────────

/**
 * [추가 P0-②] WeaponSystem.test.js 인라인 픽스처를 공용화.
 *
 * @param {Partial<object>} overrides
 * @returns {object}
 */
export function makeWeapon(overrides = {}) {
  return {
    id:              'weapon_basic',
    level:           1,
    cooldown:        1.0,
    currentCooldown: 0,
    damage:          5,
    radius:          8,
    pierce:          1,
    range:           400,
    speed:           300,
    behaviorId:      'targetProjectile',
    ...overrides,
  };
}

// ── 투사체 ───────────────────────────────────────────────────────────

/**
 * @param {Partial<object>} overrides
 * @returns {object}
 */
export function makeProjectile(overrides = {}) {
  return {
    id:             nextId('proj'),
    type:           'projectile',
    x:              0,
    y:              0,
    vx:             300,
    vy:             0,
    radius:         8,
    damage:         5,
    pierce:         1,
    pierceCount:    0,
    lifetime:       3,
    isAlive:        true,
    pendingDestroy: false,
    ownerId:        'player',
    statusEffectId:     null,
    statusEffectChance: 0,
    ...overrides,
  };
}

// ── 이벤트 ───────────────────────────────────────────────────────────

/**
 * @param {Partial<object>} overrides
 * @returns {object}
 */
export function makeEvents(overrides = {}) {
  return {
    hits:             [],
    deaths:           [],
    pickupCollected:  [],
    levelUpRequested: [],
    statusApplied:    [],
    bossPhaseChanged: [],
    spawnRequested:   [],
    ...overrides,
  };
}

// ── 월드 ─────────────────────────────────────────────────────────────

/**
 * @param {Partial<object>} overrides
 * @returns {object}
 */
export function makeWorld(overrides = {}) {
  return {
    player:      overrides.player ?? makePlayer(),
    enemies:     [],
    projectiles: [],
    pickups:     [],
    effects:     [],
    spawnQueue:  [],
    events:      makeEvents(),
    camera:      { x: 0, y: 0 },
    elapsedTime: 0,
    deltaTime:   0.016,
    killCount:   0,
    playMode:    'playing',
    ...overrides,
  };
}

// ── 히트 이벤트 ──────────────────────────────────────────────────────

/**
 * @param {object}      target      enemy 또는 player
 * @param {number}      damage
 * @param {object|null} [projectile]
 * @returns {object}
 */
export function makeHit(target, damage, projectile = null) {
  return {
    attackerId:   'attacker',
    targetId:     target.id,
    target,
    damage,
    projectileId: projectile?.id ?? null,
    projectile,
  };
}

// ── 픽업 ─────────────────────────────────────────────────────────────

/**
 * @param {Partial<object>} overrides
 * @returns {object}
 */
export function makePickup(overrides = {}) {
  return {
    id:             nextId('pickup'),
    type:           'pickup',
    x:              0,
    y:              0,
    radius:         6,
    isAlive:        true,
    pendingDestroy: false,
    magnetized:     false,
    xpValue:        1,
    ...overrides,
  };
}
