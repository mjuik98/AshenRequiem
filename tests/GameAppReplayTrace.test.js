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

summary();
