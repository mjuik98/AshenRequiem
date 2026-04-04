import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { readProjectSource } from './helpers/sourceInspection.js';

console.log('\n[GameRuntimeBootstrap]');

const { test, summary } = createRunner('GameRuntimeBootstrap');

let runtimeApi = null;
let canvasApi = null;
let inputApi = null;
let coreRuntimeApi = null;
let coreCanvasApi = null;
let coreInputApi = null;

try {
  runtimeApi = await import('../src/adapters/browser/gameRuntime.js');
  canvasApi = await import('../src/adapters/browser/gameCanvasRuntime.js');
  inputApi = await import('../src/adapters/browser/gameInputRuntime.js');
  coreRuntimeApi = await import('../src/core/gameRuntime.js');
  coreCanvasApi = await import('../src/core/gameCanvasRuntime.js');
  coreInputApi = await import('../src/core/gameInputRuntime.js');
} catch (error) {
  runtimeApi = { error };
  canvasApi = { error };
  inputApi = { error };
  coreRuntimeApi = { error };
  coreCanvasApi = { error };
  coreInputApi = { error };
}

function ensureRuntimeModules() {
  assert.ok(!runtimeApi.error, runtimeApi.error?.message ?? 'adapters/browser/gameRuntime.js가 아직 없음');
  assert.ok(!canvasApi.error, canvasApi.error?.message ?? 'adapters/browser/gameCanvasRuntime.js가 아직 없음');
  assert.ok(!inputApi.error, inputApi.error?.message ?? 'adapters/browser/gameInputRuntime.js가 아직 없음');
  assert.ok(!coreRuntimeApi.error, coreRuntimeApi.error?.message ?? 'core/gameRuntime.js wrapper가 아직 없음');
  assert.ok(!coreCanvasApi.error, coreCanvasApi.error?.message ?? 'core/gameCanvasRuntime.js wrapper가 아직 없음');
  assert.ok(!coreInputApi.error, coreInputApi.error?.message ?? 'core/gameInputRuntime.js wrapper가 아직 없음');
}

test('browser runtime helper 모듈은 브라우저 shell 조립 entrypoint를 제공하고 core wrapper가 이를 재노출한다', () => {
  ensureRuntimeModules();
  assert.equal(typeof runtimeApi.createGameRuntimeState, 'function');
  assert.equal(typeof canvasApi.syncGameCanvasSize, 'function');
  assert.equal(typeof canvasApi.createGameResizeHandler, 'function');
  assert.equal(typeof inputApi.createGameInput, 'function');
  assert.equal(coreRuntimeApi.createGameRuntimeState, runtimeApi.createGameRuntimeState, 'core gameRuntime wrapper가 adapter owner를 재노출하지 않음');
  assert.equal(coreCanvasApi.syncGameCanvasSize, canvasApi.syncGameCanvasSize, 'core gameCanvasRuntime wrapper가 adapter owner를 재노출하지 않음');
  assert.equal(coreCanvasApi.createGameResizeHandler, canvasApi.createGameResizeHandler, 'core gameCanvasRuntime wrapper가 adapter owner를 재노출하지 않음');
  assert.equal(coreInputApi.createGameInput, inputApi.createGameInput, 'core gameInputRuntime wrapper가 adapter owner를 재노출하지 않음');
});

test('Game는 runtime helper를 사용해 부트스트랩하고 직접 wiring을 줄인다', () => {
  const gameSource = readProjectSource('../src/core/Game.js');
  const browserShellSource = readProjectSource('../src/adapters/browser/BrowserGameShell.js');

  assert.equal(gameSource.includes("from '../app/GameApp.js'"), true, 'Game가 GameApp을 import해야 함');
  assert.equal(gameSource.includes("from '../adapters/browser/BrowserGameShell.js'"), true, 'Game가 BrowserGameShell을 import해야 함');
  assert.equal(gameSource.includes('new InputManager()'), false, 'Game가 입력 생성 세부사항을 직접 조립하면 안 됨');
  assert.equal(gameSource.includes("document.getElementById('game-canvas')"), false, 'Game가 canvas lookup을 직접 수행하면 안 됨');
  assert.equal(gameSource.includes('GameDataLoader.loadDefault()'), false, 'Game가 game data loading 세부사항을 직접 수행하면 안 됨');
  assert.equal(browserShellSource.includes("from './gameRuntime.js'"), true, 'BrowserGameShell이 adapter-owned gameRuntime을 사용하지 않음');
  assert.equal(browserShellSource.includes("from './gameCanvasRuntime.js'"), true, 'BrowserGameShell이 adapter-owned gameCanvasRuntime을 사용하지 않음');
  assert.equal(browserShellSource.includes("from '../../core/gameRuntime.js'"), false, 'BrowserGameShell이 core gameRuntime wrapper에 직접 의존하면 안 됨');
  assert.equal(browserShellSource.includes("from '../../core/gameCanvasRuntime.js'"), false, 'BrowserGameShell이 core gameCanvasRuntime wrapper에 직접 의존하면 안 됨');
});

test('createGameRuntimeState는 session option key binding을 input factory에 전달한다', () => {
  ensureRuntimeModules();

  const calls = [];
  const documentRef = {
    getElementById() {
      return {
        getContext() {
          return {};
        },
      };
    },
  };

  runtimeApi.createGameRuntimeState({
    documentRef,
    loadSessionImpl() {
      return {
        options: {
          keyBindings: {
            pause: ['p'],
            confirm: ['f'],
          },
        },
      };
    },
    createInputImpl(args) {
      calls.push(args.options?.keyBindings);
      return {};
    },
    loadGameDataImpl() { return {}; },
    createSceneManagerImpl() { return {}; },
    createRendererImpl() { return {}; },
    createGameLoopImpl() { return {}; },
  });

  assert.deepEqual(calls, [{
    pause: ['p'],
    confirm: ['f'],
  }], 'game runtime이 session option key binding을 input 생성으로 전달하지 않음');
});

summary();
