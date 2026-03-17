/**
 * tests/fixtures/index.js — 공용 테스트 픽스처 팩토리
 *
 * ─── 변경 사항 ────────────────────────────────────────────────────────
 * [P1-①] 각 .test.js에 분산된 makeEnemy/makePlayer 등 중복 선언을 통합.
 *   Before: 각 테스트 파일마다 동일한 makeEnemy, makePlayer 인라인 선언
 *           → Entity 구조 변경 시 모든 .test.js 수동 수정 필요
 *   After:  tests/fixtures/index.js 한 곳에서 관리
 *           → Entity 필드 추가/변경 = 이 파일 1곳만 수정
 * ──────────────────────────────────────────────────────────────────────
 *
 * 사용 방법:
 *   import { makePlayer, makeEnemy, makeProjectile, makeWeapon,
 *            makeEvents, makeWorld } from './fixtures/index.js';
 *
 *   // 필요한 필드만 덮어쓰기
 *   const player = makePlayer({ hp: 50, level: 3 });
 *   const enemy  = makeEnemy({ x: 100, isBoss: true });
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
    isAlive:          true,
    pendingDestroy:   false,
    weapons:          [],
    upgradeCounts:    {},
    acquiredUpgrades: new Set(),
    activeSynergies:  [],
    statusEffects:    [],
    invincibleTimer:  0,
    invincibleDuration: 1.0,
    color:            '#4fc3f7',
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
    id:              nextId('e'),
    type:            'enemy',
    enemyId:         'zombie',
    enemyDataId:     'zombie',
    name:            'Test Enemy',
    x:               200,
    y:               200,
    radius:          12,
    hp:              30,
    maxHp:           30,
    damage:          5,
    moveSpeed:       80,
    xpValue:         5,
    color:           '#e53935',
    hitFlashTimer:   0,
    chargeEffect:    false,
    knockbackX:      0,
    knockbackY:      0,
    knockbackTimer:  0,
    knockbackResist: 0,
    statusEffects:   [],
    stunned:         false,
    isElite:         false,
    isBoss:          false,
    behaviorId:      'chase',
    behaviorState:   null,
    projectileConfig: null,
    deathSpawn:      null,
    isAlive:         true,
    pendingDestroy:  false,
    ...overrides,
  };
}

// ── 투사체 ────────────────────────────────────────────────────────────

/**
 * @param {Partial<object>} overrides
 * @returns {object}
 */
export function makeProjectile(overrides = {}) {
  return {
    id:                nextId('p'),
    type:              'projectile',
    x:                 0,
    y:                 0,
    dirX:              1,
    dirY:              0,
    speed:             300,
    damage:            10,
    radius:            5,
    color:             '#ffee58',
    pierce:            1,
    hitCount:          0,
    hitTargets:        new Set(),
    maxRange:          400,
    distanceTraveled:  0,
    behaviorId:        'targetProjectile',
    lifetime:          0,
    maxLifetime:       0.3,
    ownerId:           'player',
    statusEffectId:    null,
    statusEffectChance: 1.0,
    orbitAngle:        0,
    orbitRadius:       80,
    orbitSpeed:        Math.PI,
    isAlive:           true,
    pendingDestroy:    false,
    _reversed:         false,
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
    id:             nextId('w'),
    name:           'Test Weapon',
    damage:         10,
    cooldown:       1.0,
    currentCooldown: 0,
    behaviorId:     'targetProjectile',
    range:          400,
    speed:          300,
    radius:         5,
    pierce:         1,
    color:          '#ffee58',
    level:          1,
    maxLevel:       5,
    ...overrides,
  };
}

// ── 이벤트 ────────────────────────────────────────────────────────────

/**
 * world.events 기본 구조 생성.
 * EVENT_TYPES 추가 시 이 팩토리도 업데이트하세요.
 *
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
 * world 기본 구조 생성.
 *
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
 * @param {object} target     enemy 또는 player
 * @param {number} damage
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
