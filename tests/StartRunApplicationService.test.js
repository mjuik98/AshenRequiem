import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { makeSessionState } from './fixtures/index.js';
import { readProjectSource } from './helpers/sourceInspection.js';

console.log('\n[StartRunApplicationService]');

const { test, summary } = createRunner('StartRunApplicationService');

let serviceApi = null;

try {
  serviceApi = await import('../src/app/play/startRunApplicationService.js');
} catch (error) {
  serviceApi = { error };
}

test('start run application service는 플레이 시작 조립 entrypoint를 노출한다', () => {
  assert.ok(!serviceApi.error, serviceApi.error?.message ?? 'startRunApplicationService.js가 아직 없음');
  assert.equal(typeof serviceApi.prepareStartRunState, 'function');
});

test('play scene bootstrap은 start run application service에 world/player 초기 조립을 위임한다', () => {
  const source = readProjectSource('../src/scenes/play/playSceneBootstrap.js');

  assert.equal(source.includes("from '../../app/play/startRunApplicationService.js'"), true, 'playSceneBootstrap이 start run application service를 import해야 함');
  assert.equal(source.includes('resolvePlayerSpawnState'), false, 'playSceneBootstrap이 start loadout 세부사항을 직접 조립하면 안 됨');
  assert.equal(source.includes('queueRunStartEvents'), false, 'playSceneBootstrap이 run-start 이벤트 큐잉 세부사항을 직접 소유하면 안 됨');
  assert.equal(source.includes('applyRunSessionState'), false, 'playSceneBootstrap이 run session state 적용 세부사항을 직접 소유하면 안 됨');
});

test('prepareStartRunState는 world 생성, 플레이어 생성, 런 초기화, 시작 이벤트 큐잉을 함께 수행한다', () => {
  assert.ok(!serviceApi.error, serviceApi.error?.message ?? 'startRunApplicationService.js가 아직 없음');

  const calls = [];
  const world = {
    entities: { player: null },
    progression: { pendingEventQueue: null },
    run: {},
    runtime: {},
  };
  const player = { weapons: [{ id: 'magic_bolt' }], accessories: [] };
  const prepared = serviceApi.prepareStartRunState({
    session: makeSessionState({
      meta: {
        permanentUpgrades: {
          reroll_charge: 2,
          banish_charge: 1,
        },
      },
    }),
    gameData: { weaponData: [] },
    createWorldImpl() {
      calls.push('world');
      return world;
    },
    buildPlayerSpawnStateImpl() {
      calls.push('spawn-state');
      return {
        startAccessories: [{ id: 'ring_of_speed', effects: [{ stat: 'moveSpeed', value: 10 }] }],
        archetype: { id: 'spellweaver', name: 'Spellweaver', effects: [{ stat: 'cooldownMult', value: -0.08 }] },
        riskRelic: { id: 'glass_censer', name: 'Glass Censer', effects: [{ stat: 'bonusProjectileCount', value: 1 }] },
        permanentUpgrades: { perm_hp: 1 },
        selectedAscensionLevel: 2,
        ascension: { level: 2, enemyHpMult: 1.3, spawnRateMult: 1.15 },
        selectedArchetypeId: 'spellweaver',
        selectedRiskRelicId: 'glass_censer',
        selectedStageId: 'ember_hollow',
        stage: { id: 'ember_hollow', rewardMult: 1.2, background: { fillStyle: '#120f18' } },
        seedMode: 'custom',
        seedLabel: 'ashen-seed',
        rng: { nextFloat: () => 0.25 },
      };
    },
    createPlayerImpl() {
      calls.push('player');
      return player;
    },
    applyArchetypeImpl(targetPlayer, archetype) {
      calls.push(['archetype', targetPlayer, archetype]);
    },
    applyRiskRelicImpl(targetPlayer, relic) {
      calls.push(['risk', targetPlayer, relic]);
    },
    applyPermanentUpgradesImpl(targetPlayer, upgrades) {
      calls.push(['perm', targetPlayer, upgrades]);
    },
    initializeRunStateImpl(targetWorld) {
      calls.push(['init-run', targetWorld]);
      targetWorld.progression.runRerollsRemaining = 2;
    },
    buildRunGuidanceImpl() {
      calls.push('guidance');
      return { primaryObjective: { id: 'unlock_boomerang', title: '곡예의 각성' } };
    },
    queueStartEventsImpl(targetWorld, targetPlayer) {
      calls.push(['queue-events', targetWorld, targetPlayer]);
      targetWorld.progression.pendingEventQueue = [{ type: 'weaponAcquired', payload: { weaponId: 'magic_bolt' } }];
    },
  });

  assert.equal(prepared.world, world);
  assert.equal(prepared.player, player);
  assert.equal(world.entities.player, player);
  assert.equal(world.runtime.rng.nextFloat(), 0.25, '런 시작 시 주입된 RNG가 world에 기록되지 않음');
  assert.equal(world.run.ascensionLevel, 2, '런 시작 시 Ascension 레벨이 world에 기록되지 않음');
  assert.deepEqual(world.run.ascension, { level: 2, enemyHpMult: 1.3, spawnRateMult: 1.15 }, 'Ascension snapshot이 world에 주입되지 않음');
  assert.equal(world.run.archetypeId, 'spellweaver', '런 시작 시 archetypeId가 world에 기록되지 않음');
  assert.deepEqual(world.run.archetype, { id: 'spellweaver', name: 'Spellweaver', effects: [{ stat: 'cooldownMult', value: -0.08 }] }, 'archetype snapshot이 world에 주입되지 않음');
  assert.equal(world.run.riskRelicId, 'glass_censer', '런 시작 시 riskRelicId가 world에 기록되지 않음');
  assert.deepEqual(world.run.riskRelic, { id: 'glass_censer', name: 'Glass Censer', effects: [{ stat: 'bonusProjectileCount', value: 1 }] }, 'risk relic snapshot이 world에 주입되지 않음');
  assert.equal(world.run.stageId, 'ember_hollow', '런 시작 시 stageId가 world에 기록되지 않음');
  assert.deepEqual(world.run.stage, { id: 'ember_hollow', rewardMult: 1.2, background: { fillStyle: '#120f18' } }, 'stage snapshot이 world에 주입되지 않음');
  assert.equal(world.run.seedMode, 'custom', '런 시작 시 seed mode가 world에 기록되지 않음');
  assert.equal(world.run.seedLabel, 'ashen-seed', '런 시작 시 seed label이 world에 기록되지 않음');
  assert.deepEqual(world.runtime.replayTrace, [], '런 시작 시 replay trace 버퍼가 초기화되지 않음');
  assert.deepEqual(world.run.guidance, { primaryObjective: { id: 'unlock_boomerang', title: '곡예의 각성' } }, '런 시작 시 guidance snapshot이 world에 기록되지 않음');
  assert.deepEqual(world.progression.pendingEventQueue, [{ type: 'weaponAcquired', payload: { weaponId: 'magic_bolt' } }]);
  assert.deepEqual(calls, [
    'world',
    'spawn-state',
    'player',
    ['archetype', player, { id: 'spellweaver', name: 'Spellweaver', effects: [{ stat: 'cooldownMult', value: -0.08 }] }],
    ['risk', player, { id: 'glass_censer', name: 'Glass Censer', effects: [{ stat: 'bonusProjectileCount', value: 1 }] }],
    ['perm', player, { perm_hp: 1 }],
    ['init-run', world],
    'guidance',
    ['queue-events', world, player],
  ]);
});

test('prepareStartRunState는 activeRun snapshot이 있으면 복원 경로를 우선 사용한다', () => {
  assert.ok(!serviceApi.error, serviceApi.error?.message ?? 'startRunApplicationService.js가 아직 없음');

  const world = {
    entities: { player: null },
    progression: { pendingEventQueue: null },
    run: {},
    runtime: {},
  };
  const player = { weapons: [], accessories: [] };
  const calls = [];
  const activeRun = {
    run: { elapsedTime: 90, stageId: 'moon_crypt' },
    player: { level: 5, weapons: [{ id: 'magic_bolt', level: 3 }], accessories: [{ id: 'ring_of_speed', level: 1 }] },
  };

  serviceApi.prepareStartRunState({
    session: makeSessionState({ activeRun }),
    gameData: { weaponData: [] },
    createWorldImpl: () => world,
    buildPlayerSpawnStateImpl: () => ({
      startAccessories: [{ id: 'ring_of_speed' }],
      permanentUpgrades: { perm_hp: 2 },
      selectedAscensionLevel: 1,
      ascension: { level: 1 },
      selectedStageId: 'moon_crypt',
      stage: { id: 'moon_crypt' },
      seedMode: 'none',
      seedLabel: '',
      rng: { nextFloat: () => 0.5 },
    }),
    createPlayerImpl: () => player,
    applyStartAccessoriesImpl: () => {
      calls.push('start-accessories');
    },
    applyPermanentUpgradesImpl: () => {
      calls.push('perm');
    },
    initializeRunStateImpl: () => {
      calls.push('init-run');
    },
    queueStartEventsImpl: () => {
      calls.push('queue-events');
    },
    restoreActiveRunSnapshotImpl: (targetWorld, targetPlayer, snapshot) => {
      calls.push(['restore', targetWorld, targetPlayer, snapshot]);
      targetWorld.run.elapsedTime = snapshot.run.elapsedTime;
      targetPlayer.level = snapshot.player.level;
      return { restored: true, world: targetWorld, player: targetPlayer };
    },
  });

  assert.equal(world.run.elapsedTime, 90, 'activeRun snapshot이 world에 복원되지 않음');
  assert.equal(player.level, 5, 'activeRun snapshot이 player에 복원되지 않음');
  assert.deepEqual(calls, [
    'init-run',
    ['restore', world, player, activeRun],
  ], 'activeRun 복원 경로에서 신규 런 초기화 로직이 불필요하게 실행됨');
});

summary();
