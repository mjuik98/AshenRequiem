import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { readProjectSource, stripLineComments } from './helpers/sourceInspection.js';
import { GameConfig } from '../src/core/GameConfig.js';

console.log('\n[RuntimeCanvasBoundaries]');

const { test, summary } = createRunner('RuntimeCanvasBoundaries');

const gameCanvasRuntimeSource = stripLineComments(readProjectSource('../src/adapters/browser/gameCanvasRuntime.js'));

test('core gameCanvasRuntime wrapper re-exports the adapter-owned canvas helpers', async () => {
  const adapterApi = await import('../src/adapters/browser/gameCanvasRuntime.js');
  const coreApi = await import('../src/core/gameCanvasRuntime.js');

  assert.equal(coreApi.syncGameCanvasSize, adapterApi.syncGameCanvasSize, 'core gameCanvasRuntime wrapper가 sync helper를 재노출하지 않음');
  assert.equal(coreApi.createGameResizeHandler, adapterApi.createGameResizeHandler, 'core gameCanvasRuntime wrapper가 resize helper를 재노출하지 않음');
});

test('game canvas runtime computes viewport state but does not mutate GameConfig directly', async () => {
  const { syncGameCanvasSize } = await import('../src/adapters/browser/gameCanvasRuntime.js');

  const originalWidth = GameConfig.canvasWidth;
  const originalHeight = GameConfig.canvasHeight;
  const canvas = { width: 0, height: 0, style: {} };
  const ctxCalls = [];
  const ctx = {
    setTransform(...args) {
      ctxCalls.push(args);
    },
  };

  try {
    const viewport = syncGameCanvasSize({
      canvas,
      ctx,
      sessionOptions: { useDevicePixelRatio: true },
      host: {
        innerWidth: 1111,
        innerHeight: 777,
        devicePixelRatio: 2,
      },
      defaultUseDevicePixelRatio: true,
    });

    assert.deepEqual(viewport, { width: 1111, height: 777, dpr: 2 }, 'canvas runtime이 explicit viewport state를 반환하지 않음');
    assert.equal(GameConfig.canvasWidth, originalWidth, 'gameCanvasRuntime이 GameConfig.canvasWidth를 직접 갱신하면 안 됨');
    assert.equal(GameConfig.canvasHeight, originalHeight, 'gameCanvasRuntime이 GameConfig.canvasHeight를 직접 갱신하면 안 됨');
    assert.deepEqual(ctxCalls, [[2, 0, 0, 2, 0, 0]], 'canvas runtime이 ctx transform을 DPR에 맞게 적용하지 않음');
  } finally {
    GameConfig.canvasWidth = originalWidth;
    GameConfig.canvasHeight = originalHeight;
  }
});

test('browser game shell owns the application of viewport state returned by canvas sync', async () => {
  const { createBrowserGameShell } = await import('../src/adapters/browser/BrowserGameShell.js');
  const originalWidth = GameConfig.canvasWidth;
  const originalHeight = GameConfig.canvasHeight;

  const host = {
    addEventListener() {},
    removeEventListener() {},
  };
  const shell = createBrowserGameShell({
    host,
    documentRef: { documentElement: {} },
    createRuntimeStateImpl: () => ({ canvas: {}, ctx: {}, _loop: {} }),
    createResizeHandlerImpl: () => () => {},
    syncCanvasSizeImpl: () => ({ width: 960, height: 540, dpr: 1.5 }),
    createAccessibilityRuntimeImpl: () => null,
  });

  const game = {};
  try {
    shell.attach(game);

    assert.deepEqual(game.viewport, { width: 960, height: 540, dpr: 1.5 }, 'browser shell이 viewport ownership을 game에 반영하지 않음');
    assert.equal(GameConfig.canvasWidth, originalWidth, 'browser shell이 live viewport를 GameConfig.canvasWidth에 되써서는 안 됨');
    assert.equal(GameConfig.canvasHeight, originalHeight, 'browser shell이 live viewport를 GameConfig.canvasHeight에 되써서는 안 됨');
  } finally {
    GameConfig.canvasWidth = originalWidth;
    GameConfig.canvasHeight = originalHeight;
  }
});

test('game canvas runtime source no longer mutates GameConfig viewport globals inline', () => {
  assert.equal(/GameConfig\.canvasWidth\s*=/.test(gameCanvasRuntimeSource), false, 'gameCanvasRuntime에 GameConfig.canvasWidth 직접 대입이 남아 있음');
  assert.equal(/GameConfig\.canvasHeight\s*=/.test(gameCanvasRuntimeSource), false, 'gameCanvasRuntime에 GameConfig.canvasHeight 직접 대입이 남아 있음');
});

summary();
