/**
 * tests/fixtures/index.js — 공용 테스트 픽스처 팩토리
 *
 * ── 변경 이력 ─────────────────────────────────────────────────────────
 * [원본]  makePlayer / makeEnemy / makeProjectile / makeEvents / makeWorld / makeHit / makePickup
 * [추가]  makeWeapon()    — WeaponSystem.test.js 인라인 픽스처 통합
 * [추가]  makeEntity()    — SpatialGrid.test.js 로컬 픽스처 통합
 * [추가]  makePoolStub()  — DeathSystem/FlushSpawnSystem 로컬 중복 통합
 * [추가]  makeServices()  — DeathSystem/FlushSpawnSystem 로컬 중복 통합
 * ──────────────────────────────────────────────────────────────────────
 *
 * 사용 방법:
 *   import {
 *     makePlayer, makeEnemy, makeEntity, makeProjectile,
 *     makeWeapon, makePickup, makeEvents, makeWorld, makeHit,
 *     makePoolStub, makeServices,
 *   } from './fixtures/index.js';
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
    id:                'player',
    type:              'player',
    x:                 0,
    y:                 0,
    radius:            16,
    hp:                100,
    maxHp:             100,
    moveSpeed:         200,
    magnetRadius:      60,
    lifesteal:         0,
    level:             1,
    xp:                0,
    xpToNextLevel:     5,
    isAlive:           true,
    pendingDestroy:    false,
    invincibleTimer:   0,
    invincibleDuration: 0.5,
    weapons:           [],
    upgradeCounts:     {},
    acquiredUpgrades:  new Set(),
    activeSynergies:   [],
    statusEffects:     [],
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

// ── 범용 엔티티 (SpatialGrid 테스트 등 단순 위치·반경만 필요한 경우) ───────

/**
 * isAlive/pendingDestroy 필드를 포함한 최소 엔티티 객체.
 * SpatialGrid.test.js 등 적/플레이어 구분이 불필요한 테스트에 사용.
 *
 * Before(중복): SpatialGrid.test.js에 로컬 makeEntity() 함수 별도 정의.
 * After:        이 함수로 통합.
 *
 * @param {Partial<object>} overrides
 * @returns {object}
 */
export function makeEntity(overrides = {}) {
  return {
    id:             nextId('entity'),
    x:              0,
    y:              0,
    radius:         10,
    isAlive:        true,
    pendingDestroy: false,
    ...overrides,
  };
}

// ── 무기 ─────────────────────────────────────────────────────────────

/**
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
    id:                 nextId('proj'),
    type:               'projectile',
    x:                  0,
    y:                  0,
    vx:                 300,
    vy:                 0,
    radius:             8,
    damage:             5,
    pierce:             1,
    hitCount:           0,
    hitTargets:         new Set(),
    lifetime:           3,
    isAlive:            true,
    pendingDestroy:     false,
    ownerId:            'player',
    statusEffectId:     null,
    statusEffectChance: 0,
    ...overrides,
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

// ── 이펙트 ───────────────────────────────────────────────────────────

/**
 * @param {Partial<object>} overrides
 * @returns {object}
 */
export function makeEffect(overrides = {}) {
  return {
    id:             nextId('fx'),
    type:           'effect',
    x:              0,
    y:              0,
    isAlive:        true,
    pendingDestroy: false,
    lifetime:       0,
    maxLifetime:    0.4,
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
    camera:      { x: 0, y: 0, width: 1280, height: 720 },
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

// ── 풀 스텁 ──────────────────────────────────────────────────────────

/**
 * ObjectPool의 최소 스텁. release / acquire 만 구현.
 *
 * Before(중복):
 *   DeathSystem.test.js 와 FlushSpawnSystem.test.js 각각에
 *   동일한 makePoolStub() 로컬 함수 존재.
 * After:
 *   이 함수로 통합.
 *
 * @returns {{ release: Function, acquire: Function, releaseCount: number }}
 */
export function makePoolStub() {
  let releaseCount = 0;
  return {
    release(entity) {
      releaseCount++;
      if (entity) entity.isAlive = false;
    },
    acquire() {
      return { isAlive: true, pendingDestroy: false };
    },
    get releaseCount() { return releaseCount; },
  };
}

/**
 * 테스트용 services 객체. 각 Pool은 makePoolStub() 인스턴스.
 *
 * Before(중복):
 *   DeathSystem.test.js 와 FlushSpawnSystem.test.js 각각에
 *   동일한 makePoolStub() 로컬 함수 존재.
 * After:
 *   이 함수로 통합.
 *
 * @param {Partial<object>} overrides
 * @returns {object}
 */
export function makeServices(overrides = {}) {
  return {
    projectilePool: makePoolStub(),
    effectPool:     makePoolStub(),
    enemyPool:      makePoolStub(),
    pickupPool:     makePoolStub(),
    session:        { meta: { currency: 0 } },
    ...overrides,
  };
}
