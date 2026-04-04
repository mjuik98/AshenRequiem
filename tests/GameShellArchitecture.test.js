import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { readProjectSource } from './helpers/sourceInspection.js';

console.log('\n[GameShellArchitecture]');

const { test, summary } = createRunner('GameShellArchitecture');

let appApi = null;
let shellApi = null;
let bootstrapApi = null;

try {
  appApi = await import('../src/app/GameApp.js');
  shellApi = await import('../src/adapters/browser/BrowserGameShell.js');
  bootstrapApi = await import('../src/app/bootstrap/bootstrapBrowserGame.js');
} catch (error) {
  appApi = { error };
  shellApi = { error };
  bootstrapApi = { error };
}

test('GameApp과 BrowserGameShell은 분리된 entrypoint를 노출한다', () => {
  assert.ok(!appApi.error, appApi.error?.message ?? 'GameApp.js가 아직 없음');
  assert.ok(!shellApi.error, shellApi.error?.message ?? 'BrowserGameShell.js가 아직 없음');
  assert.ok(!bootstrapApi.error, bootstrapApi.error?.message ?? 'bootstrapBrowserGame.js가 아직 없음');
  assert.equal(typeof appApi.GameApp, 'function');
  assert.equal(typeof shellApi.createBrowserGameShell, 'function');
  assert.equal(typeof bootstrapApi.bootstrapBrowserGame, 'function');
});

test('Game facade는 thin helper export를 함께 노출한다', async () => {
  const gameApi = await import('../src/core/Game.js');
  assert.equal(typeof gameApi.Game, 'function');
  assert.equal(typeof gameApi.createGame, 'function', 'Game facade helper export가 없음');
});

test('browser bootstrap이 runtime hook 등록 책임을 소유한다', () => {
  const bootstrapSource = readProjectSource('../src/app/bootstrap/bootstrapBrowserGame.js');
  const gameAppSource = readProjectSource('../src/app/GameApp.js');

  assert.equal(bootstrapSource.includes("from '../../adapters/browser/runtimeHooks.js'"), true, 'browser bootstrap이 runtime hooks를 소유해야 함');
  assert.equal(gameAppSource.includes("from '../adapters/browser/runtimeHooks.js'"), false, 'GameApp이 runtime hooks 구현을 직접 import하면 안 됨');
});

test('Game는 shell/app 조합 facade로 축소된다', () => {
  const source = readProjectSource('../src/core/Game.js');

  assert.equal(source.includes("from '../app/GameApp.js'"), true, 'Game가 GameApp을 import해야 함');
  assert.equal(source.includes("from '../adapters/browser/BrowserGameShell.js'"), true, 'Game가 BrowserGameShell을 import해야 함');
  assert.equal(source.includes("from '../scenes/TitleScene.js'"), false, 'Game가 TitleScene을 직접 import하면 안 됨');
  assert.equal(source.includes("from './gameRuntime.js'"), false, 'Game가 runtime 세부 helper를 직접 붙잡고 있으면 안 됨');
});

test('main은 Game facade 대신 browser bootstrap helper를 직접 사용한다', () => {
  const source = readProjectSource('../src/main.js');

  assert.equal(source.includes("from './app/bootstrap/bootstrapBrowserGame.js'"), true, 'main이 browser bootstrap helper를 import해야 함');
  assert.equal(source.includes("from './core/Game.js'"), false, 'main이 Game facade를 직접 import하면 안 됨');
});

test('BrowserGameShell은 runtime host와 accessibility runtime을 game에 주입한다', () => {
  assert.ok(!shellApi.error, shellApi.error?.message ?? 'BrowserGameShell.js가 아직 없음');

  const host = {
    addEventListener() {},
    removeEventListener() {},
  };
  const documentRef = {
    documentElement: { id: 'root' },
  };
  const accessibilityRuntime = { id: 'accessibility-runtime' };
  const shell = shellApi.createBrowserGameShell({
    host,
    documentRef,
    createRuntimeStateImpl: () => ({ canvas: {}, ctx: {}, _loop: {} }),
    createResizeHandlerImpl: () => () => {},
    syncCanvasSizeImpl: () => {},
    createAccessibilityRuntimeImpl: (root) => {
      assert.equal(root, documentRef.documentElement, 'accessibility runtime이 document root를 주입받지 않음');
      return accessibilityRuntime;
    },
  });

  const game = {};
  shell.attach(game);

  assert.equal(game.runtimeHost, host, 'browser shell이 runtime host를 game에 주입하지 않음');
  assert.equal(game.accessibilityRuntime, accessibilityRuntime, 'browser shell이 accessibility runtime을 game에 주입하지 않음');
});

test('browser bootstrap은 play runtime service와 event registration wiring을 소유한다', () => {
  assert.ok(!bootstrapApi.error, bootstrapApi.error?.message ?? 'bootstrapBrowserGame.js가 아직 없음');

  const runtimeHost = { id: 'runtime-host' };
  const accessibilityRuntime = { id: 'accessibility-runtime' };
  const runtimeServices = { nowSeconds: () => 1 };
  const registerPlayEventHandlers = () => {};
  const shell = {
    attach(game) {
      game.runtimeHost = runtimeHost;
      game.accessibilityRuntime = accessibilityRuntime;
      game._loop = {};
      return game;
    },
    detach() {},
  };
  const app = {
    attach(game) {
      game._loop ??= {};
      return game;
    },
    start() {},
    destroy() {},
    advanceTime() {},
    tick() {},
  };
  const calls = [];

  const game = bootstrapApi.bootstrapBrowserGame({
    createShellImpl: () => shell,
    createAppImpl: () => app,
    createPlayRuntimeServicesImpl(options) {
      calls.push(['runtime-services', options]);
      return runtimeServices;
    },
    registerPlayEventHandlersImpl: registerPlayEventHandlers,
  });

  assert.deepEqual(calls, [[
    'runtime-services',
    {
      host: runtimeHost,
      accessibilityRuntime,
    },
  ]]);
  assert.equal(game.playRuntimeServices, runtimeServices, 'browser bootstrap이 play runtime services를 game에 주입하지 않음');
  assert.equal(game.registerPlayEventHandlers, registerPlayEventHandlers, 'browser bootstrap이 play event registration helper를 game에 주입하지 않음');
});

summary();
