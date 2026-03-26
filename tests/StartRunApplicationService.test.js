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
      return { permanentUpgrades: { perm_hp: 1 } };
    },
    createPlayerImpl() {
      calls.push('player');
      return player;
    },
    applyPermanentUpgradesImpl(targetPlayer, upgrades) {
      calls.push(['perm', targetPlayer, upgrades]);
    },
    initializeRunStateImpl(targetWorld) {
      calls.push(['init-run', targetWorld]);
      targetWorld.progression.runRerollsRemaining = 2;
    },
    queueStartEventsImpl(targetWorld, targetPlayer) {
      calls.push(['queue-events', targetWorld, targetPlayer]);
      targetWorld.progression.pendingEventQueue = [{ type: 'weaponAcquired', payload: { weaponId: 'magic_bolt' } }];
    },
  });

  assert.equal(prepared.world, world);
  assert.equal(prepared.player, player);
  assert.equal(world.entities.player, player);
  assert.deepEqual(world.progression.pendingEventQueue, [{ type: 'weaponAcquired', payload: { weaponId: 'magic_bolt' } }]);
  assert.deepEqual(calls, [
    'world',
    'spawn-state',
    'player',
    ['perm', player, { perm_hp: 1 }],
    ['init-run', world],
    ['queue-events', world, player],
  ]);
});

summary();
