/**
 * tests/fixtures/index.js — 공용 테스트 픽스처 팩토리
 *
 * CHANGE(P1-①): 각 .test.js에 분산된 makeEnemy/makePlayer 등 중복 선언을 통합.
 *   모든 팩토리는 순수 객체 리터럴 반환 — 의존성 없음.
 *   overrides 패턴을 통해 각 테스트 파일에서 필요한 필드만 덮어쓸 수 있음.
 *
 * 사용 방법:
 *   import { makePlayer, makeEnemy, makeProjectile, makeEvents, makeWorld } from './fixtures/index.js';
 *
 *   const player = makePlayer({ hp: 50, level: 3 });
 *   const enemy  = makeEnemy({ x: 100, isBoss: true });
 */

let _idCounter = 0;
function nextId(prefix = 'e') {
  return `${prefix}_${++_idCounter}`;
}

// ── 플레이어 ────────────────────────────────────────────────────────

/**
 * @param {Partial<object>} overrides
 * @returns {object}
 */
export function makePlayer(overrides = {}) {
  return {
    id:              'player',
    x:               0,
    y:               0,
    radius:          16,
    hp:              100,
    maxHp:           100,
    moveSpeed:       200,
    magnetRadius:    60,
    lifesteal:       0,
    level:           1,
    xp:              0,
    isAlive:         true,
    pendingDestroy:  false,
    weapons:         [],
    upgradeCounts:   {},
    acquiredUpgrades: new Set(),
    activeSynergies: [],
    statusEffects:   [],
    color:           '#4fc3f7',
    ...overrides,
  };
}

// ── 적 ──────────────────────────────────────────────────────────────

/**
 * @param {Partial<object>} overrides
 * @returns {object}
 */
export function makeEnemy(overrides = {}) {
  return {
    id:              nextId('e'),
    enemyId:         'basic_enemy',
    x:               200,
    y:               200,
    radius:          12,
    hp:              30,
    maxHp:           30,
    damage:          5,
    moveSpeed:       80,
    xpValue:         1,
    isAlive:         true,
    pendingDestroy:  false,
    isElite:         false,
    isBoss:          false,
    hitFlashTimer:   0,
    statusEffects:   [],
    color:           '#ef5350',
    ...overrides,
  };
}

// ── 투사체 ──────────────────────────────────────────────────────────

/**
 * @param {Partial<object>} overrides
 * @returns {object}
 */
export function makeProjectile(overrides = {}) {
  return {
    id:                nextId('p'),
    x:                 0,
    y:                 0,
    vx:                300,
    vy:                0,
    radius:            6,
    damage:            10,
    pierce:            1,
    pierceCount:       0,
    speed:             300,
    behaviorId:        'targetProjectile',
    statusEffectId:    null,
    statusEffectChance: 0,
    lifetime:          0,
    maxLifetime:       2,
    isAlive:           true,
    pendingDestroy:    false,
    color:             '#fff',
    hitEnemyIds:       new Set(),
    ...overrides,
  };
}

// ── 픽업 ────────────────────────────────────────────────────────────

/**
 * @param {Partial<object>} overrides
 * @returns {object}
 */
export function makePickup(overrides = {}) {
  return {
    id:             nextId('pk'),
    x:              0,
    y:              0,
    radius:         6,
    xpValue:        1,
    isAlive:        true,
    pendingDestroy: false,
    magnetized:     false,
    color:          '#66bb6a',
    ...overrides,
  };
}

// ── 이벤트 버스 ─────────────────────────────────────────────────────

/**
 * @returns {object}
 */
export function makeEvents() {
  return {
    hits:              [],
    deaths:            [],
    pickupCollected:   [],
    levelUpRequested:  [],
    statusApplied:     [],
    bossPhaseChanged:  [],
    spawnRequested:    [],
  };
}

// ── 월드 스냅샷 ─────────────────────────────────────────────────────

/**
 * @param {Partial<object>} overrides
 * @returns {object}
 */
export function makeWorld(overrides = {}) {
  return {
    player:      makePlayer(),
    enemies:     [],
    projectiles: [],
    pickups:     [],
    effects:     [],
    events:      makeEvents(),
    spawnQueue:  [],
    killCount:   0,
    elapsedTime: 0,
    deltaTime:   0.016,
    playMode:    'playing',
    camera:      { x: 0, y: 0, width: 1280, height: 720 },
    ...overrides,
  };
}

// ── 히트 이벤트 ─────────────────────────────────────────────────────

/**
 * @param {object} target  enemy
 * @param {object} source  projectile | weapon
 * @param {Partial<object>} overrides
 * @returns {object}
 */
export function makeHit(target, source, overrides = {}) {
  return {
    targetId:           target.id,
    target,
    sourceId:           source.id,
    source,
    damage:             source.damage ?? 10,
    statusEffectId:     source.statusEffectId ?? null,
    statusEffectChance: source.statusEffectChance ?? 0,
    ...overrides,
  };
}

// ── 무기 ────────────────────────────────────────────────────────────

/**
 * @param {Partial<object>} overrides
 * @returns {object}
 */
export function makeWeapon(overrides = {}) {
  return {
    id:              nextId('w'),
    name:            'Test Weapon',
    level:           1,
    damage:          10,
    cooldown:        1.0,
    currentCooldown: 0,
    radius:          8,
    pierce:          1,
    range:           400,
    speed:           300,
    behaviorId:      'targetProjectile',
    color:           '#fff',
    maxLevel:        5,
    ...overrides,
  };
}
