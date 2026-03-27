import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';

console.log('\n[PlaySceneBootstrap]');

const { test, summary } = createRunner('PlaySceneBootstrap');

let bootstrapApi = null;

try {
  bootstrapApi = await import('../src/scenes/play/playSceneBootstrap.js');
} catch (error) {
  bootstrapApi = { error };
}

function getBootstrapApi() {
  assert.ok(
    !bootstrapApi.error,
    bootstrapApi.error?.message ?? 'src/scenes/play/playSceneBootstrap.js가 아직 없음',
  );
  return bootstrapApi;
}

test('play scene bootstrap helper는 world/context/ui/pipeline 조립 계약을 노출한다', () => {
  const api = getBootstrapApi();
  assert.equal(typeof api.createPlaySceneWorldState, 'function', 'createPlaySceneWorldState helper가 없음');
  assert.equal(typeof api.bootstrapPlaySceneRuntime, 'function', 'bootstrapPlaySceneRuntime helper가 없음');
});

test('bootstrapPlaySceneRuntime는 startup 조립을 한 곳에서 수행한다', () => {
  const { bootstrapPlaySceneRuntime } = getBootstrapApi();
  const calls = [];
  const fakeSession = { options: { soundEnabled: false } };
  const fakeWorld = { tag: 'world' };
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
    game: {
      session: fakeSession,
      gameData: { weaponData: [{ id: 'magic_bolt' }] },
      input: { id: 'input' },
      canvas: { id: 'canvas' },
      renderer: { id: 'renderer' },
    },
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
    createRuntimeServicesImpl() {
      calls.push(['runtime-services']);
      return {
        nowSeconds: () => 42,
        createAudioContext: () => ({ id: 'audio' }),
      };
    },
  });

  assert.equal(runtime.world, fakeWorld);
  assert.equal(runtime.ui, fakeUi);
  assert.equal(runtime.ctx, fakeCtx);
  assert.deepEqual(runtime.systems, ['s1']);
  assert.equal(fakeUi.shown, 1, 'HUD가 즉시 표시되지 않음');
  assert.deepEqual(calls[0], ['runtime-services']);
  assert.deepEqual(calls[1], ['world', {
    session: fakeSession,
    gameData: { weaponData: [{ id: 'magic_bolt' }] },
  }]);
  assert.deepEqual(calls[2], ['normalize', fakeSession.options]);
  assert.deepEqual(calls[3], ['profile']);
  assert.deepEqual(calls[4], ['context', {
    canvas: { id: 'canvas' },
    renderer: { id: 'renderer' },
    soundEnabled: false,
    profilingEnabled: true,
    session: fakeSession,
    nowSeconds: calls[4][1]?.nowSeconds,
    createAudioContext: calls[4][1]?.createAudioContext,
  }]);
  assert.equal(typeof calls[4][1].nowSeconds, 'function');
  assert.equal(typeof calls[4][1].createAudioContext, 'function');
  assert.deepEqual(calls[5], ['mount-ui']);
  assert.deepEqual(calls[6], ['ui', { id: 'ui-root' }]);
  assert.deepEqual(calls[7], ['views', 'boss-view', 'evo-view']);
  assert.deepEqual(calls[8], ['pipeline', fakeWorld, { id: 'input' }, { weaponData: [{ id: 'magic_bolt' }] }]);
});

summary();
