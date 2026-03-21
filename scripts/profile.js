#!/usr/bin/env node
/**
 * scripts/profile.js — 파이프라인 시스템별 성능 프로파일링
 *
 * 현재 파이프라인 구조에 맞춰 팩토리 시스템도 실제 인스턴스로 생성한다.
 * 기본 실행은 headless 최소 컨텍스트에서 이루어지며, 각 시스템의 상대 비용을 비교하는 용도다.
 */

import { createWorld } from '../src/state/createWorld.js';
import { createPlayer } from '../src/entities/createPlayer.js';

const FRAME_COUNT = parseInt(process.argv[2] ?? '300', 10);
const WARN_THRESHOLD = parseFloat(process.argv[3] ?? '35') / 100;
const TARGET_FPS = 60;
const SIM_DT = 1 / TARGET_FPS;

const EMPTY_ARRAY = [];
const EMPTY_DATA = {
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

const NOOP_POOL = {
  acquire() {
    return null;
  },
  release() {},
};

const NOOP_CULLING_SYSTEM = {
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

const SYSTEM_LOADERS = [
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

function makeHeadlessWorld() {
  const world = createWorld();
  world.player = createPlayer(0, 0, null);
  world.playMode = 'playing';
  world.deltaTime = SIM_DT;
  world.elapsedTime = 0;
  return world;
}

function makeContext() {
  return {
    world: makeHeadlessWorld(),
    input: {},
    data: { ...EMPTY_DATA },
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
    dt: SIM_DT,
    dpr: 1,
  };
}

async function loadSystems() {
  const systems = [];

  for (const entry of SYSTEM_LOADERS) {
    const system = await entry.load();
    if (!system || typeof system.update !== 'function') {
      throw new Error(`${entry.name} did not resolve to an update-capable system.`);
    }
    systems.push({ name: entry.name, system });
  }

  return systems;
}

async function runProfile() {
  console.log('\n=== Pipeline Profiler ===');
  console.log(
    `프레임: ${FRAME_COUNT}  |  FPS 목표: ${TARGET_FPS}  |  경고 임계값: ${(WARN_THRESHOLD * 100).toFixed(0)}%\n`,
  );

  const systems = await loadSystems();
  console.log(`로드된 시스템: ${systems.length}개\n`);

  const totals = Object.fromEntries(systems.map(({ name }) => [name, 0]));
  const ctx = makeContext();

  for (let frame = 0; frame < FRAME_COUNT; frame += 1) {
    ctx.dt = SIM_DT;
    ctx.world.deltaTime = SIM_DT;
    ctx.world.elapsedTime += SIM_DT;

    for (const queue of Object.values(ctx.world.events)) {
      queue.length = 0;
    }
    ctx.world.spawnQueue.length = 0;

    for (const { name, system } of systems) {
      const startedAt = performance.now();
      try {
        system.update(ctx);
      } catch {
        // headless 측정에서는 일부 시스템이 실제 렌더/오디오 없이 동작하므로 예외는 무시한다.
      }
      totals[name] += performance.now() - startedAt;
    }
  }

  const totalAll = Object.values(totals).reduce((sum, value) => sum + value, 0);
  const perFrame = totalAll / FRAME_COUNT;

  console.log(`${'시스템'.padEnd(28)} ${'합계(ms)'.padStart(10)} ${'프레임당'.padStart(10)} ${'비율'.padStart(8)}`);
  console.log('─'.repeat(60));

  const sorted = Object.entries(totals).sort((left, right) => right[1] - left[1]);
  for (const [name, ms] of sorted) {
    const ratio = totalAll > 0 ? ms / totalAll : 0;
    const pct = `${(ratio * 100).toFixed(1).padStart(7)}%`;
    const flag = ratio > WARN_THRESHOLD ? ' ⚠' : '';
    console.log(
      `${name.padEnd(28)} ${ms.toFixed(2).padStart(10)} ${(ms / FRAME_COUNT).toFixed(3).padStart(10)} ${pct}${flag}`,
    );
  }

  console.log('─'.repeat(60));
  console.log(`${'합계'.padEnd(28)} ${totalAll.toFixed(2).padStart(10)} ${perFrame.toFixed(3).padStart(10)}`);
  console.log(`\n목표 프레임 예산: ${(1000 / TARGET_FPS).toFixed(2)}ms / 프레임`);

  if (perFrame > 1000 / TARGET_FPS) {
    console.warn(
      `\n⚠  평균 프레임 소요 시간(${perFrame.toFixed(3)}ms)이 목표(${(1000 / TARGET_FPS).toFixed(2)}ms)를 초과합니다!`,
    );
  } else {
    console.log('\n✓  프레임 예산 내에서 실행 중입니다.');
  }
}

runProfile().catch((error) => {
  console.error('프로파일링 중 오류:', error);
  process.exit(1);
});
