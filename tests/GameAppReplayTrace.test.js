import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { GameApp } from '../src/app/GameApp.js';

console.log('\n[GameAppReplayTrace]');

const { test, summary } = createRunner('GameAppReplayTrace');

test('GameApp.tick은 play world가 있으면 최근 입력을 replay trace에 기록한다', () => {
  const app = new GameApp({
    registerRuntimeHooksImpl() {},
    unregisterRuntimeHooksImpl() {},
  });
  const trace = [];
  const game = {
    input: {
      poll() {
        return {
          moveX: 1,
          moveY: -1,
          actions: new Set(['pause']),
        };
      },
    },
    sceneManager: {
      currentScene: {
        world: {
          runtime: {
            replayTrace: trace,
            maxReplaySamples: 3,
          },
        },
      },
      update() {},
      render() {},
    },
  };

  app.tick(game, 0.016);

  assert.equal(trace.length, 1, 'replay trace sample이 추가되지 않음');
  assert.equal(trace[0].moveX, 1);
  assert.equal(trace[0].moveY, -1);
  assert.deepEqual(trace[0].actions, ['pause']);
});

test('GameApp.start는 shipped combat/stage/asset catalogs까지 검증기로 전달한다', () => {
  const validationCalls = [];
  const initialScene = { sceneId: 'TitleScene' };
  const app = new GameApp({
    createInitialSceneImpl: () => initialScene,
    validateGameDataImpl(payload) {
      validationCalls.push(payload);
      return true;
    },
    registerRuntimeHooksImpl() {},
    unregisterRuntimeHooksImpl() {},
  });
  const game = {
    gameData: {
      upgradeData: [],
      weaponData: [],
      waveData: [],
      enemyData: [{ id: 'cultist' }],
      bossData: [{ id: 'boss_lich' }],
      stageData: [{ id: 'ash_plains' }],
      assetManifest: [{ id: 'stage_bg_ash_plains' }],
    },
    sceneManager: {
      changedTo: null,
      changeScene(scene) {
        this.changedTo = scene;
      },
    },
    _loop: {
      started: false,
      start() {
        this.started = true;
      },
    },
  };

  app.start(game);

  assert.equal(validationCalls.length, 1, 'GameApp.start가 validateGameData를 호출하지 않음');
  assert.deepEqual(validationCalls[0], {
    upgradeData: [],
    weaponData: [],
    waveData: [],
    enemyData: [{ id: 'cultist' }],
    bossData: [{ id: 'boss_lich' }],
    stageData: [{ id: 'ash_plains' }],
    assetManifest: [{ id: 'stage_bg_ash_plains' }],
  }, 'GameApp.start가 shipped combat/stage/asset catalogs를 validation에 전달하지 않음');
  assert.equal(game.sceneManager.changedTo, initialScene, '초기 scene 전환이 실행되지 않음');
  assert.equal(game._loop.started, true, 'game loop 시작이 누락됨');
});

summary();
