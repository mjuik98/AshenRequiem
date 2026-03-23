import { createWorld } from '../src/state/createWorld.js';
import { createPlayer } from '../src/entities/createPlayer.js';

export const PROFILE_TARGET_FPS = 60;
export const PROFILE_SIM_DT = 1 / PROFILE_TARGET_FPS;
export const PROFILE_WARN_THRESHOLD = parseFloat(process.argv[3] ?? '35') / 100;

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
  world.player = createPlayer(0, 0, null);
  world.playMode = 'playing';
  world.deltaTime = PROFILE_SIM_DT;
  world.elapsedTime = 0;
  return world;
}

export function buildProfileContext() {
  return {
    world: makeHeadlessProfileWorld(),
    input: {},
    data: { ...EMPTY_PROFILE_DATA },
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
