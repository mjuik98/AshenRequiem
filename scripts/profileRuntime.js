import { createPlayWorld as createWorld } from '../src/domain/play/state/createPlayWorld.js';
import { createPlayer } from '../src/entities/createPlayer.js';
import { createRng } from '../src/utils/random.js';

export const PROFILE_TARGET_FPS = 60;
export const PROFILE_SIM_DT = 1 / PROFILE_TARGET_FPS;
export const PROFILE_WARN_THRESHOLD = 0.35;

const EMPTY_ARRAY = [];

export const EMPTY_PROFILE_DATA = {
  waveData: EMPTY_ARRAY,
  bossData: EMPTY_ARRAY,
  enemyData: EMPTY_ARRAY,
  weaponData: EMPTY_ARRAY,
  upgradeData: EMPTY_ARRAY,
  synergyData: EMPTY_ARRAY,
  accessoryData: EMPTY_ARRAY,
  weaponEvolutionData: EMPTY_ARRAY,
  weaponProgressionData: {},
};

const DEFAULT_PROFILE_PRESET = 'baseline';

function createProfileEnemy(id, x, y) {
  return {
    id: `profile-enemy-${id}`,
    type: 'enemy',
    enemyId: 'profile_dummy',
    enemyDataId: 'profile_dummy',
    x,
    y,
    hp: 24,
    maxHp: 24,
    moveSpeed: 75,
    radius: 16,
    damage: 6,
    xpValue: 1,
    isAlive: true,
    pendingDestroy: false,
    isBoss: false,
    isElite: false,
    statusEffects: [],
  };
}

function createProfileProjectile(id, x, y, vx, vy) {
  return {
    id: `profile-projectile-${id}`,
    type: 'projectile',
    x,
    y,
    vx,
    vy,
    radius: 5,
    damage: 10,
    pierce: 1,
    hitCount: 0,
    ownerId: 'player',
    isAlive: true,
    pendingDestroy: false,
    hitTargets: new Set(),
    lifetime: 0,
    maxLifetime: 2,
  };
}

function createProfilePickup(id, x, y) {
  return {
    id: `profile-pickup-${id}`,
    type: 'xp',
    x,
    y,
    radius: 8,
    xpValue: 1,
    isAlive: true,
    pendingDestroy: false,
  };
}

function createProfileData() {
  const profileWeapon = {
    id: 'magic_bolt',
    name: 'Magic Bolt',
    behaviorId: 'basic',
    damage: 10,
    cooldown: 1,
    currentCooldown: 0,
    range: 500,
    projectileCount: 1,
    projectileSpeed: 350,
    level: 1,
    maxLevel: 7,
    speed: 300,
    radius: 5,
    pierce: 1,
  };

  return {
    ...EMPTY_PROFILE_DATA,
    enemyData: [
      {
        id: 'profile_dummy',
        name: 'Profile Dummy',
        hp: 24,
        maxHp: 24,
        moveSpeed: 75,
        radius: 16,
        damage: 6,
        xpValue: 1,
      },
    ],
    weaponData: [profileWeapon],
  };
}

export const PROFILE_PRESETS = Object.freeze({
  baseline: Object.freeze({
    id: 'baseline',
    budget: Object.freeze({
      maxPerFrameMs: 0.5,
    }),
    buildWorld(world) {
      return world;
    },
    buildData() {
      return { ...EMPTY_PROFILE_DATA };
    },
  }),
  swarm: Object.freeze({
    id: 'swarm',
    budget: Object.freeze({
      maxPerFrameMs: 1.0,
    }),
    buildWorld(world) {
      world.entities.enemies = Array.from({ length: 24 }, (_, index) => createProfileEnemy(
        index,
        (index % 6) * 60 - 150,
        Math.floor(index / 6) * 60 - 120,
      ));
      world.entities.projectiles = Array.from({ length: 16 }, (_, index) => createProfileProjectile(
        index,
        -80 + (index * 10),
        -40 + ((index % 4) * 20),
        120,
        0,
      ));
      world.entities.pickups = Array.from({ length: 8 }, (_, index) => createProfilePickup(index, index * 18, 24));
      return world;
    },
    buildData() {
      return createProfileData();
    },
  }),
});

export const NOOP_POOL = {
  acquire() {
    return null;
  },
  release() {},
};

export const NOOP_CULLING_SYSTEM = {
  getVisible() {
    return {
      enemies: EMPTY_ARRAY,
      projectiles: EMPTY_ARRAY,
      pickups: EMPTY_ARRAY,
      effects: EMPTY_ARRAY,
      damageTexts: EMPTY_ARRAY,
    };
  },
};

export const PROFILE_SYSTEM_LOADERS = [
  {
    name: 'WorldTickSystem',
    load: async () => (await import('../src/systems/core/WorldTickSystem.js')).WorldTickSystem,
  },
  {
    name: 'SpawnSystem',
    load: async () => (await import('../src/systems/spawn/SpawnSystem.js')).createSpawnSystem(),
  },
  {
    name: 'PlayerMovementSystem',
    load: async () => (await import('../src/systems/movement/PlayerMovementSystem.js')).PlayerMovementSystem,
  },
  {
    name: 'EnemyMovementSystem',
    load: async () => (await import('../src/systems/movement/EnemyMovementSystem.js')).createEnemyMovementSystem(),
  },
  {
    name: 'EliteBehaviorSystem',
    load: async () => (await import('../src/systems/combat/EliteBehaviorSystem.js')).EliteBehaviorSystem,
  },
  {
    name: 'WeaponSystem',
    load: async () => (await import('../src/systems/combat/WeaponSystem.js')).WeaponSystem,
  },
  {
    name: 'ProjectileSystem',
    load: async () => (await import('../src/systems/combat/ProjectileSystem.js')).ProjectileSystem,
  },
  {
    name: 'CollisionSystem',
    load: async () => (await import('../src/systems/combat/CollisionSystem.js')).createCollisionSystem(),
  },
  {
    name: 'StatusEffectSystem',
    load: async () => (await import('../src/systems/combat/StatusEffectSystem.js')).StatusEffectSystem,
  },
  {
    name: 'DamageSystem',
    load: async () => (await import('../src/systems/combat/DamageSystem.js')).DamageSystem,
  },
  {
    name: 'BossPhaseSystem',
    load: async () => (await import('../src/systems/combat/BossPhaseSystem.js')).BossPhaseSystem,
  },
  {
    name: 'DeathSystem',
    load: async () => (await import('../src/systems/combat/DeathSystem.js')).DeathSystem,
  },
  {
    name: 'ExperienceSystem',
    load: async () => (await import('../src/systems/progression/ExperienceSystem.js')).ExperienceSystem,
  },
  {
    name: 'LevelSystem',
    load: async () => (await import('../src/systems/progression/LevelSystem.js')).LevelSystem,
  },
  {
    name: 'UpgradeApplySystem',
    load: async () => (await import('../src/systems/progression/UpgradeApplySystem.js')).UpgradeApplySystem,
  },
  {
    name: 'WeaponEvolutionSystem',
    load: async () => (await import('../src/systems/progression/WeaponEvolutionSystem.js')).WeaponEvolutionSystem,
  },
  {
    name: 'EffectTickSystem',
    load: async () => (await import('../src/systems/spawn/EffectTickSystem.js')).EffectTickSystem,
  },
  {
    name: 'FlushSystem',
    load: async () => (await import('../src/systems/spawn/FlushSystem.js')).FlushSystem,
  },
  {
    name: 'CameraSystem',
    load: async () => (await import('../src/systems/camera/CameraSystem.js')).CameraSystem,
  },
];

export function makeHeadlessProfileWorld() {
  const world = createWorld();
  world.entities.player = createPlayer(0, 0, null);
  world.run.playMode = 'playing';
  world.runtime.deltaTime = PROFILE_SIM_DT;
  world.run.elapsedTime = 0;
  world.runtime.rng = createRng(() => 0.5);
  return world;
}

export function getProfilePresetIds() {
  return Object.keys(PROFILE_PRESETS);
}

export function resolveProfilePreset(presetId = DEFAULT_PROFILE_PRESET) {
  return PROFILE_PRESETS[presetId] ?? PROFILE_PRESETS[DEFAULT_PROFILE_PRESET];
}

export function getProfileBudget(presetId = DEFAULT_PROFILE_PRESET) {
  return resolveProfilePreset(presetId).budget ?? null;
}

export function buildProfileContext(presetId = DEFAULT_PROFILE_PRESET) {
  const preset = resolveProfilePreset(presetId);
  const world = preset.buildWorld(makeHeadlessProfileWorld());
  return {
    preset: preset.id,
    budget: preset.budget ?? null,
    world,
    input: {},
    data: preset.buildData(),
    services: {
      projectilePool: NOOP_POOL,
      effectPool: NOOP_POOL,
      enemyPool: NOOP_POOL,
      pickupPool: NOOP_POOL,
      soundSystem: null,
      canvas: null,
      renderer: null,
      cullingSystem: NOOP_CULLING_SYSTEM,
    },
    dt: PROFILE_SIM_DT,
    dpr: 1,
  };
}

export async function loadProfileSystems() {
  const systems = [];

  for (const entry of PROFILE_SYSTEM_LOADERS) {
    const system = await entry.load();
    if (!system || typeof system.update !== 'function') {
      throw new Error(`${entry.name} did not resolve to an update-capable system.`);
    }
    systems.push({ name: entry.name, system });
  }

  return systems;
}
