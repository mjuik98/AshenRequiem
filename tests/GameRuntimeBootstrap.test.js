import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { readProjectSource } from './helpers/sourceInspection.js';

console.log('\n[GameRuntimeBootstrap]');

const { test, summary } = createRunner('GameRuntimeBootstrap');

let runtimeApi = null;
let canvasApi = null;
let inputApi = null;

try {
  runtimeApi = await import('../src/core/gameRuntime.js');
  canvasApi = await import('../src/core/gameCanvasRuntime.js');
  inputApi = await import('../src/core/gameInputRuntime.js');
} catch (error) {
  runtimeApi = { error };
  canvasApi = { error };
  inputApi = { error };
}

function ensureRuntimeModules() {
  assert.ok(!runtimeApi.error, runtimeApi.error?.message ?? 'gameRuntime.js가 아직 없음');
  assert.ok(!canvasApi.error, canvasApi.error?.message ?? 'gameCanvasRuntime.js가 아직 없음');
  assert.ok(!inputApi.error, inputApi.error?.message ?? 'gameInputRuntime.js가 아직 없음');
}

test('game runtime helper 모듈은 브라우저 shell 조립 entrypoint를 제공한다', () => {
  ensureRuntimeModules();
  assert.equal(typeof runtimeApi.createGameRuntimeState, 'function');
  assert.equal(typeof canvasApi.syncGameCanvasSize, 'function');
  assert.equal(typeof canvasApi.createGameResizeHandler, 'function');
  assert.equal(typeof inputApi.createGameInput, 'function');
});

test('Game는 runtime helper를 사용해 부트스트랩하고 직접 wiring을 줄인다', () => {
  const gameSource = readProjectSource('../src/core/Game.js');

  assert.equal(gameSource.includes("from '../app/GameApp.js'"), true, 'Game가 GameApp을 import해야 함');
  assert.equal(gameSource.includes("from '../adapters/browser/BrowserGameShell.js'"), true, 'Game가 BrowserGameShell을 import해야 함');
  assert.equal(gameSource.includes('new InputManager()'), false, 'Game가 입력 생성 세부사항을 직접 조립하면 안 됨');
  assert.equal(gameSource.includes("document.getElementById('game-canvas')"), false, 'Game가 canvas lookup을 직접 수행하면 안 됨');
  assert.equal(gameSource.includes('GameDataLoader.loadDefault()'), false, 'Game가 game data loading 세부사항을 직접 수행하면 안 됨');
});

summary();
