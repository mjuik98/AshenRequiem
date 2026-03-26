import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { readProjectSource } from './helpers/sourceInspection.js';

console.log('\n[WorldOwnershipSource]');

const { test, summary } = createRunner('WorldOwnershipSource');

const expectations = [
  {
    ref: '../src/app/play/startRunApplicationService.js',
    mustInclude: ['world.entities.player'],
    mustExclude: ['world.player ='],
  },
  {
    ref: '../src/scenes/play/playSceneRuntime.js',
    mustInclude: ['world.progression.runRerollsRemaining', 'world.progression.pendingEventQueue'],
    mustExclude: ['world.runRerollsRemaining', 'world.pendingEventQueue'],
  },
  {
    ref: '../src/app/play/playSceneFlowService.js',
    mustInclude: ['world.runtime.deltaTime', 'world.run.playMode'],
    mustExclude: ['world.deltaTime', 'world.playMode'],
  },
  {
    ref: '../src/scenes/play/PlayUI.js',
    mustInclude: ['world.entities.player', 'world.entities.enemies'],
    mustExclude: ['world.player', 'world.enemies'],
  },
  {
    ref: '../src/domain/meta/progression/playResultDomain.js',
    mustInclude: ['world.run.killCount', 'world.entities.player'],
    mustExclude: ['world.killCount', 'world.player'],
  },
  {
    ref: '../src/core/runtimeHooks.js',
    mustInclude: ['world.run.playMode', 'world.entities.player'],
    mustExclude: ['world.playMode', 'world.player'],
  },
  {
    ref: '../src/systems/progression/LevelSystem.js',
    mustInclude: ['world.progression.chestRewardQueue', 'world.run.playMode', 'world.entities.player'],
    mustExclude: ['world.chestRewardQueue', 'world.playMode', 'world.player'],
  },
  {
    ref: '../src/systems/combat/DeathSystem.js',
    mustInclude: ['world.run.killCount', 'world.entities.player', 'world.queues.spawnQueue'],
    mustExclude: ['world.killCount', 'world.player', 'world.spawnQueue'],
  },
  {
    ref: '../src/systems/combat/WeaponSystem.js',
    mustInclude: ['world.entities.player', 'world.entities.enemies', 'world.runtime.deltaTime', 'world.queues.spawnQueue', 'world.queues.events'],
    mustExclude: ['world.player', 'world.enemies', 'world.deltaTime', 'world.spawnQueue', 'world.events'],
  },
  {
    ref: '../src/systems/combat/DamageSystem.js',
    mustInclude: ['world.entities.player', 'world.queues.events', 'world.queues.spawnQueue', 'world.runtime.rng'],
    mustExclude: ['world.player', 'world.events', 'world.spawnQueue', 'world.rng'],
  },
  {
    ref: '../src/systems/progression/ExperienceSystem.js',
    mustInclude: ['world.entities.player', 'world.entities.pickups', 'world.queues.events', 'world.runtime.deltaTime'],
    mustExclude: ['world.player', 'world.pickups', 'world.events', 'world.deltaTime'],
  },
  {
    ref: '../src/systems/movement/PlayerMovementSystem.js',
    mustInclude: ['world.entities.player', 'world.runtime.deltaTime'],
    mustExclude: ['world.player', 'world.deltaTime'],
  },
  {
    ref: '../src/systems/movement/EnemyMovementSystem.js',
    mustInclude: ['world.entities.player', 'world.entities.enemies', 'world.runtime.deltaTime', 'world.queues.spawnQueue', 'world.runtime.rng'],
    mustExclude: ['world.player', 'world.enemies', 'world.deltaTime', 'world.spawnQueue', 'world.rng'],
  },
  {
    ref: '../src/systems/combat/ProjectileSystem.js',
    mustInclude: ['world.entities.projectiles', 'world.entities.player', 'world.entities.enemies', 'world.runtime.deltaTime'],
    mustExclude: ['world.projectiles', 'world.player', 'world.enemies', 'world.deltaTime'],
  },
  {
    ref: '../src/systems/combat/CollisionSystem.js',
    mustInclude: ['world.entities.player', 'world.entities.enemies', 'world.entities.projectiles', 'world.entities.pickups', 'world.presentation.camera', 'world.queues.events'],
    mustExclude: ['world.player', 'world.enemies', 'world.projectiles', 'world.pickups', 'world.camera', 'world.events'],
  },
  {
    ref: '../src/systems/spawn/SpawnSystem.js',
    mustInclude: ['world.run.elapsedTime', 'world.entities.player', 'world.queues.spawnQueue', 'world.runtime.deltaTime', 'world.run.playMode', 'world.queues.events', 'world.runtime.rng'],
    mustExclude: ['world.elapsedTime', 'world.player', 'world.spawnQueue', 'world.deltaTime', 'world.playMode', 'world.events', 'world.rng'],
  },
  {
    ref: '../src/systems/spawn/EffectTickSystem.js',
    mustInclude: ['world.entities.effects', 'world.runtime.deltaTime'],
    mustExclude: ['world.effects', 'world.deltaTime'],
  },
  {
    ref: '../src/systems/camera/CameraSystem.js',
    mustInclude: ['world.entities.player', 'world.presentation.camera'],
    mustExclude: ['world.player', 'world.camera'],
  },
  {
    ref: '../src/systems/combat/EliteBehaviorSystem.js',
    mustInclude: ['world.entities.enemies', 'world.entities.player'],
    mustExclude: ['world.enemies', 'world.player'],
  },
  {
    ref: '../src/systems/combat/StatusEffectSystem.js',
    mustInclude: ['world.entities.enemies', 'world.entities.player', 'world.runtime.deltaTime', 'world.queues.events', 'world.runtime.rng'],
    mustExclude: ['world.enemies', 'world.player', 'world.deltaTime', 'world.events', 'world.rng'],
  },
];

test('핵심 런타임 모듈은 world ownership 경로를 우선 사용한다', () => {
  expectations.forEach(({ ref, mustInclude, mustExclude }) => {
    const source = readProjectSource(ref);
    mustInclude.forEach((pattern) => {
      assert.equal(source.includes(pattern), true, `${ref}가 ownership 경로 ${pattern}를 사용하지 않음`);
    });
    mustExclude.forEach((pattern) => {
      assert.equal(source.includes(pattern), false, `${ref}에 top-level world alias ${pattern}가 남아 있음`);
    });
  });
});

summary();
