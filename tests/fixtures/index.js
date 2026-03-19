/**
 * tests/fixtures/index.js
 *
 * ── 개선 P1: Phase 2 팩토리 함수 추가 ────────────────────────────────────
 *
 * Before:
 *   makePlayer, makeEnemy, makeWorld, makeEvents, makePickup, makeEntity 만 존재.
 *   BossPhaseSystem, SynergySystem, SessionState 테스트 작성 시
 *   각 파일에서 로컬 팩토리를 중복 선언하는 패턴으로 회귀.
 *
 * After:
 *   makeBoss          — 보스 엔티티 (isBoss 플래그, phases 배열)
 *   makeBossData      — bossData 정의 객체
 *   makeSessionState  — v2 SessionState 기본값
 *   makeSynergyWorld  — SynergySystem 테스트용 world stub
 *   makeWeapon        — 무기 엔티티 (weaponId, level, cooldown 등)
 *
 * 규칙 (AGENTS.md §6.1):
 *   새 픽스처가 필요하면 이 파일에 추가하고 export한다.
 *   테스트 파일 내부에 로컬 팩토리를 만들지 않는다.
 *
 * 사용법:
 *   import {
 *     makePlayer, makeEnemy, makeWorld, makeEvents,
 *     makeBoss, makeBossData, makeSessionState, makeWeapon,
 *   } from './fixtures/index.js';
 */

let _id = 0;
const uid = () => `entity_${++_id}`;

// ── 기존 팩토리 ───────────────────────────────────────────────────────────

export function makePlayer(overrides = {}) {
  return {
    id:              'player',
    type:            'player',
    x:               0,
    y:               0,
    hp:              100,
    maxHp:           100,
    speed:           150,
    xp:              0,
    level:           1,
    isAlive:         true,
    pendingDestroy:  false,
    weapons:         [],
    acquiredUpgrades: new Set(),
    upgradeCounts:   {},
    lifesteal:       0,
    ...overrides,
  };
}

export function makeEnemy(overrides = {}) {
  return {
    id:             uid(),
    type:           'enemy',
    enemyId:        'goblin',
    x:              100,
    y:              100,
    hp:             20,
    maxHp:          20,
    moveSpeed:      60,
    radius:         16,
    damage:         5,
    xpValue:        3,
    isAlive:        true,
    pendingDestroy: false,
    isBoss:         false,
    isElite:        false,
    statusEffects:  [],
    ...overrides,
  };
}

export function makeEntity(overrides = {}) {
  return {
    id:             uid(),
    x:              0,
    y:              0,
    radius:         10,
    isAlive:        true,
    pendingDestroy: false,
    ...overrides,
  };
}

export function makePickup(overrides = {}) {
  return {
    id:             uid(),
    x:              0,
    y:              0,
    radius:         8,
    xpValue:        3,
    isAlive:        true,
    pendingDestroy: false,
    ...overrides,
  };
}

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

export function makeWorld(overrides = {}) {
  return {
    player:      makePlayer(),
    enemies:     [],
    projectiles: [],
    effects:     [],
    pickups:     [],
    events:      makeEvents(),
    spawnQueue:  [],
    camera:      { x: 0, y: 0 },
    elapsedTime: 0,
    deltaTime:   0.016,
    killCount:   0,
    playMode:    'playing',
    ...overrides,
  };
}

// ── Phase 2 신규 팩토리 ───────────────────────────────────────────────────

/**
 * 보스 엔티티 생성.
 * BossPhaseSystem, DeathSystem 테스트에 사용.
 *
 * @param {object} overrides
 * @returns {object} bossEntity
 */
export function makeBoss(overrides = {}) {
  return {
    id:             uid(),
    type:           'enemy',
    enemyId:        'boss_lich',
    x:              400,
    y:              300,
    hp:             1000,
    maxHp:          1000,
    moveSpeed:      40,
    radius:         40,
    damage:         30,
    xpValue:        50,
    isAlive:        true,
    pendingDestroy: false,
    isBoss:         true,
    isElite:        false,
    statusEffects:  [],
    _phaseFlags:    null,   // BossPhaseSystem이 초기화
    ...overrides,
  };
}

/**
 * bossData 정의 객체 생성.
 * BossPhaseSystem.update()의 data.bossData 에 전달.
 *
 * @param {object} overrides
 * @returns {object[]} bossData 배열
 */
export function makeBossData(overrides = {}) {
  return [
    {
      enemyId: 'boss_lich',
      phases: [
        { hpThreshold: 0.7, behaviorId: 'phase2_charge',  announceText: '분노 상태 돌입!' },
        { hpThreshold: 0.3, behaviorId: 'phase3_berserk', announceText: '광란 상태 돌입!' },
      ],
      ...overrides,
    },
  ];
}

/**
 * v2 SessionState 기본값 생성.
 * SessionState / Meta-Progression 테스트에 사용.
 *
 * @param {object} overrides  best, meta, options 일부 덮어쓰기
 * @returns {object} SessionState
 */
export function makeSessionState(overrides = {}) {
  return {
    _version: 2,
    last: {
      kills:        0,
      survivalTime: 0,
      level:        1,
      weaponsUsed:  [],
    },
    best: {
      kills:        0,
      survivalTime: 0,
      level:        1,
      ...(overrides.best ?? {}),
    },
    meta: {
      currency:          0,
      permanentUpgrades: {},
      ...(overrides.meta ?? {}),
    },
    options: {
      soundEnabled: true,
      musicEnabled: true,
      showFps:      false,
      ...(overrides.options ?? {}),
    },
  };
}

/**
 * 시너지 테스트용 world stub 생성.
 * SynergySystem.applyAll() 호출 시 전달.
 *
 * @param {object} playerOverrides
 * @returns {object} { player }
 */
export function makeSynergyWorld(playerOverrides = {}) {
  return {
    player: makePlayer({
      weapons:          [],
      acquiredUpgrades: new Set(),
      upgradeCounts:    {},
      synergyBonuses:   {},
      ...playerOverrides,
    }),
  };
}

/**
 * 무기 엔티티 생성.
 * WeaponSystem, SynergySystem, UpgradeSystem 테스트에 사용.
 *
 * @param {object} overrides
 * @returns {object} weapon
 */
export function makeWeapon(overrides = {}) {
  return {
    id:             'magic_bolt',
    behaviorId:     'basic',
    damage:         10,
    cooldown:       1.0,
    currentCooldown: 0,
    range:          500,
    projectileCount: 1,
    projectileSpeed: 350,
    level:          1,
    maxLevel:       5,
    speed:          300,
    radius:         5,
    pierce:         1,
    ...overrides,
  };
}

export function makeProjectile(overrides = {}) {
  return {
    id:          uid(),
    type:        'projectile',
    x:           0,
    y:           0,
    radius:      5,
    damage:      10,
    pierce:      1,
    hitCount:    0,
    ownerId:     'player',
    isAlive:     true,
    pendingDestroy: false,
    hitTargets:  new Set(),
    ...overrides,
  };
}

export function makeEffect(overrides = {}) {
  return {
    id:          uid(),
    type:        'damageText',
    x:           0,
    y:           0,
    text:        '10',
    color:       '#ffffff',
    lifetime:    0,
    maxLifetime: 1.0,
    isAlive:     true,
    pendingDestroy: false,
    ...overrides,
  };
}

export function makePoolStub() {
  return {
    acquire: () => ({ id: uid(), isAlive: true, pendingDestroy: false }),
    release: () => {},
  };
}

export function makeServices(overrides = {}) {
  return {
    projectilePool: makePoolStub(),
    effectPool:     makePoolStub(),
    enemyPool:      makePoolStub(),
    pickupPool:     makePoolStub(),
    soundSystem:    { play: () => {}, stop: () => {} },
    ...overrides,
  };
}
