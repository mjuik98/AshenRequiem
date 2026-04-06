import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';

console.log('\n[PlaySceneBootstrap]');

const { test, summary } = createRunner('PlaySceneBootstrap');

let bootstrapApi = null;
let runtimeStateApi = null;

try {
  bootstrapApi = await import('../src/scenes/play/playSceneBootstrap.js');
} catch (error) {
  bootstrapApi = { error };
}

try {
  runtimeStateApi = await import('../src/scenes/play/playSceneRuntimeState.js');
} catch (error) {
  runtimeStateApi = { error };
}

function getBootstrapApi() {
  assert.ok(
    !bootstrapApi.error,
    bootstrapApi.error?.message ?? 'src/scenes/play/playSceneBootstrap.js가 아직 없음',
  );
  return bootstrapApi;
}

function getRuntimeStateApi() {
  assert.ok(
    !runtimeStateApi.error,
    runtimeStateApi.error?.message ?? 'src/scenes/play/playSceneRuntimeState.js가 아직 없음',
  );
  return runtimeStateApi;
}

test('play scene bootstrap helper는 world/context/ui/pipeline 조립 계약을 노출한다', () => {
  const api = getBootstrapApi();
  const runtimeState = getRuntimeStateApi();
  assert.equal(typeof api.createPlaySceneWorldState, 'function', 'createPlaySceneWorldState helper가 없음');
  assert.equal(typeof api.bootstrapPlaySceneRuntime, 'function', 'bootstrapPlaySceneRuntime helper가 없음');
  assert.equal(typeof runtimeState.createPlaySceneRuntimeState, 'function', 'PlayScene runtime state helper가 없음');
  assert.equal(typeof runtimeState.disposePlaySceneRuntimeState, 'function', 'PlayScene runtime dispose helper가 없음');
  assert.equal(typeof runtimeState.getPlaySceneDebugSurface, 'function', 'PlayScene debug surface helper가 없음');
});

test('bootstrapPlaySceneRuntime는 startup 조립을 한 곳에서 수행한다', () => {
  const { bootstrapPlaySceneRuntime } = getBootstrapApi();
  const calls = [];
  const fakeSession = { options: { soundEnabled: false } };
  const fakeWorld = { tag: 'world' };
  const fakeRegisterEventHandlers = () => {};
  const runtimeServices = {
    nowSeconds: () => 42,
    createAudioContext: () => ({ id: 'audio' }),
    devicePixelRatioReader: () => 2,
    accessibilityRuntime: { id: 'a11y' },
  };
  const fakeGame = {
    session: fakeSession,
    gameData: { weaponData: [{ id: 'magic_bolt' }] },
    input: { id: 'input' },
    canvas: { id: 'canvas' },
    renderer: { id: 'renderer' },
    playRuntimeServices: runtimeServices,
    registerPlayEventHandlers: fakeRegisterEventHandlers,
  };
  const fakeUi = {
    shown: 0,
    showHud() {
      this.shown += 1;
    },
    getBossAnnouncementView() {
      return 'boss-view';
    },
    getWeaponEvolutionView() {
      return 'evo-view';
    },
  };
  const fakeCtx = {
    setAnnouncementViews(...args) {
      calls.push(['views', ...args]);
    },
    buildPipeline(world, input, data) {
      calls.push(['pipeline', world, input, data]);
      return { pipeline: { id: 'pipeline' }, pipelineCtx: { id: 'ctx' }, systems: ['s1'] };
    },
  };

  const runtime = bootstrapPlaySceneRuntime({
    game: fakeGame,
    createPlaySceneWorldStateImpl(options) {
      calls.push(['world', options]);
      return fakeWorld;
    },
    normalizeSessionOptionsImpl(options) {
      calls.push(['normalize', options]);
      return { soundEnabled: false };
    },
    shouldEnablePipelineProfilingImpl() {
      calls.push(['profile']);
      return true;
    },
    createPlayContextImpl(options) {
      calls.push(['context', options]);
      return fakeCtx;
    },
    mountUiImpl() {
      calls.push(['mount-ui']);
      return { id: 'ui-root' };
    },
    createPlayUiImpl(root) {
      calls.push(['ui', root]);
      return fakeUi;
    },
    resolveRuntimeServicesImpl(game) {
      calls.push(['runtime-services', game]);
      return game.playRuntimeServices;
    },
    resolveEventHandlersImpl(game) {
      calls.push(['event-registrar', game]);
      return game.registerPlayEventHandlers;
    },
  });

  assert.equal(runtime.world, fakeWorld);
  assert.equal(runtime.ui, fakeUi);
  assert.equal(runtime.ctx, fakeCtx);
  assert.deepEqual(runtime.systems, ['s1']);
  assert.equal(fakeUi.shown, 1, 'HUD가 즉시 표시되지 않음');
  assert.deepEqual(calls[0], ['runtime-services', fakeGame]);
  assert.deepEqual(calls[1], ['event-registrar', fakeGame]);
  assert.deepEqual(calls[2], ['world', {
    session: fakeSession,
    gameData: { weaponData: [{ id: 'magic_bolt' }] },
  }]);
  assert.deepEqual(calls[3], ['normalize', fakeSession.options]);
  assert.deepEqual(calls[4], ['profile']);
  assert.deepEqual(calls[5], ['context', {
    canvas: { id: 'canvas' },
    renderer: { id: 'renderer' },
    soundEnabled: false,
    profilingEnabled: true,
    session: fakeSession,
    nowSeconds: calls[5][1]?.nowSeconds,
    createAudioContext: calls[5][1]?.createAudioContext,
    accessibilityRuntime: runtimeServices.accessibilityRuntime,
    devicePixelRatioReader: runtimeServices.devicePixelRatioReader,
    registerEventHandlersImpl: fakeRegisterEventHandlers,
  }]);
  assert.equal(typeof calls[5][1].nowSeconds, 'function');
  assert.equal(typeof calls[5][1].createAudioContext, 'function');
  assert.deepEqual(calls[6], ['mount-ui']);
  assert.deepEqual(calls[7], ['ui', { id: 'ui-root' }]);
  assert.deepEqual(calls[8], ['views', 'boss-view', 'evo-view']);
  assert.deepEqual(calls[9], ['pipeline', fakeWorld, { id: 'input' }, { weaponData: [{ id: 'magic_bolt' }] }]);
  assert.equal(runtime.accessibilityRuntime, runtimeServices.accessibilityRuntime);
  assert.equal(runtime.devicePixelRatioReader, runtimeServices.devicePixelRatioReader);
});

test('bootstrapPlaySceneRuntime는 overlay load failure callback seam을 runtime builder에 전달한다', () => {
  const { bootstrapPlaySceneRuntime } = getBootstrapApi();
  const onOverlayLoadFailure = () => {};
  const calls = [];

  bootstrapPlaySceneRuntime({
    game: {
      session: { options: {} },
      gameData: {},
      input: {},
      canvas: {},
      renderer: {},
    },
    onOverlayLoadFailure,
    buildPlayRuntimeImpl(options) {
      calls.push(options);
      return {
        world: {},
        ui: null,
        ctx: null,
        pipeline: null,
        pipelineCtx: null,
        systems: null,
      };
    },
  });

  assert.equal(calls.length, 1, 'bootstrap helper가 runtime builder를 호출하지 않음');
  assert.equal(calls[0].onOverlayLoadFailure, onOverlayLoadFailure, 'overlay load failure seam이 runtime builder까지 전달되지 않음');
});

test('play scene runtime state debug surface는 마지막 UI issue snapshot을 노출한다', () => {
  const runtimeState = getRuntimeStateApi();
  const debugSurface = runtimeState.getPlaySceneDebugSurface({
    ui: { id: 'ui' },
    gameData: { id: 'game-data' },
    levelUpController: { id: 'level-up' },
    lastUiIssue: {
      overlayKind: 'result',
      message: '결과 화면을 불러오지 못했습니다.',
    },
  });

  assert.deepEqual(debugSurface.lastUiIssue, {
    overlayKind: 'result',
    message: '결과 화면을 불러오지 못했습니다.',
  });
});

summary();
