/**
 * tests/fixtures/index.js
 *
 * FIX(R-25 지원): makePlayer에 synergyState 초기 슬롯 추가
 * FIX(BUG-6 지원): makeEnemy에 enemyDataId 필드 추가 (enemyId 하위 호환 유지)
 */

let _id = 0;
const uid = () => `entity_${++_id}`;

export function makePlayer(overrides = {}) {
  return {
    id:              'player',
    type:            'player',
    x:               0,
    y:               0,
    hp:              100,
    maxHp:           100,
    speed:           150,
    moveSpeed:       150,
    xp:              0,
    level:           1,
    isAlive:         true,
    pendingDestroy:  false,
    weapons:         [],
    acquiredUpgrades: new Set(),
    upgradeCounts:   {},
    lifesteal:       0,
    invincibleTimer: 0,
    magnetRadius:    60,
    statusEffects:   [],
    activeSynergies: [],
    ...overrides,
  };
}

export function makeEnemy(overrides = {}) {
  const id = uid();
  return {
    id,
    type:           'enemy',
    // FIX(BUG-6 지원): enemyDataId 추가 — BossPhaseSystem이 이 필드를 사용
    // enemyId는 하위 호환을 위해 유지 (픽스처 전용)
    enemyId:        'goblin',
    enemyDataId:    overrides.enemyId ?? 'goblin',  // enemyDataId = enemyId 기본값 동기화
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
    // enemyDataId는 overrides.enemyDataId가 있으면 그걸 우선, 없으면 enemyId에서 동기화
    enemyDataId:    overrides.enemyDataId ?? overrides.enemyId ?? 'goblin',
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
    currencyEarned:   [],  // FIX(BUG-4 지원): currencyEarned 큐 추가
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
    pendingLevelUpChoices: null,
    synergyState: {
      appliedSpeedMult:     1,
      appliedLifesteal:     0,
      appliedWeaponBonuses: {},
      activeSynergies:      [],
    },
    ...overrides,
  };
}

export function makeBoss(overrides = {}) {
  const enemyDataId = overrides.enemyDataId ?? overrides.enemyId ?? 'boss_lich';
  return {
    id:             uid(),
    type:           'enemy',
    enemyId:        enemyDataId,   // 픽스처 호환
    enemyDataId,                   // FIX(BUG-6): 프로덕션 필드명 동기화
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
    _phaseFlags:    null,
    ...overrides,
    enemyDataId,
  };
}

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

export function makeSessionState(overrides = {}) {
  return {
    _version: 2,
    last: { kills: 0, survivalTime: 0, level: 1, weaponsUsed: [] },
    best: { kills: 0, survivalTime: 0, level: 1, ...(overrides.best ?? {}) },
    meta: { currency: 0, permanentUpgrades: {}, ...(overrides.meta ?? {}) },
    options: { soundEnabled: true, musicEnabled: true, showFps: false, ...(overrides.options ?? {}) },
  };
}

export function makeSynergyWorld(playerOverrides = {}) {
  return {
    player: makePlayer({
      weapons:          [],
      acquiredUpgrades: new Set(),
      upgradeCounts:    {},
      ...playerOverrides,
    }),
    synergyState: {
      appliedSpeedMult:     1,
      appliedLifesteal:     0,
      appliedWeaponBonuses: {},
      activeSynergies:      [],
    },
  };
}

export function makeWeapon(overrides = {}) {
  return {
    id:              'magic_bolt',
    behaviorId:      'basic',
    damage:          10,
    cooldown:        1.0,
    currentCooldown: 0,
    range:           500,
    projectileCount: 1,
    projectileSpeed: 350,
    level:           1,
    maxLevel:        5,
    speed:           300,
    radius:          5,
    pierce:          1,
    ...overrides,
  };
}

export function makeProjectile(overrides = {}) {
  return {
    id:             uid(),
    type:           'projectile',
    x:              0,
    y:              0,
    radius:         5,
    damage:         10,
    pierce:         1,
    hitCount:       0,
    ownerId:        'player',
    isAlive:        true,
    pendingDestroy: false,
    hitTargets:     new Set(),
    ...overrides,
  };
}

export function makeEffect(overrides = {}) {
  return {
    id:             uid(),
    type:           'damageText',
    x:              0,
    y:              0,
    text:           '10',
    color:          '#ffffff',
    lifetime:       0,
    maxLifetime:    1.0,
    isAlive:        true,
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
