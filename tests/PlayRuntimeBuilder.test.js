import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';

console.log('\n[PlayRuntimeBuilder]');

const { test, summary } = createRunner('PlayRuntimeBuilder');

let builderApi = null;
let bootstrapApi = null;

try {
  builderApi = await import('../src/core/PlayRuntimeBuilder.js');
  bootstrapApi = await import('../src/scenes/play/playSceneBootstrap.js');
} catch (error) {
  builderApi = { error };
  bootstrapApi = { error };
}

function getBuilderApi() {
  assert.ok(
    !builderApi.error,
    builderApi.error?.message ?? 'src/core/PlayRuntimeBuilder.js가 아직 없음',
  );
  return builderApi;
}

test('play runtime builder는 world/context/ui/pipeline 조립 entrypoint를 노출한다', () => {
  const api = getBuilderApi();
  assert.equal(typeof api.buildPlayRuntime, 'function', 'buildPlayRuntime export가 필요함');
});

test('buildPlayRuntime는 플레이 런타임 조립을 한 곳에서 수행한다', () => {
  const { buildPlayRuntime } = getBuilderApi();
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

  const runtime = buildPlayRuntime({
    game: {
      session: fakeSession,
      gameData: { weaponData: [{ id: 'magic_bolt' }] },
      input: { id: 'input' },
      canvas: { id: 'canvas' },
      renderer: { id: 'renderer' },
    },
    createWorldStateImpl(options) {
      calls.push(['world', options]);
      return fakeWorld;
    },
    normalizeSessionOptionsImpl(options) {
      calls.push(['normalize', options]);
      return { soundEnabled: false };
    },
    shouldEnableProfilingImpl() {
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
  });

  assert.equal(runtime.world, fakeWorld);
  assert.equal(runtime.ui, fakeUi);
  assert.equal(runtime.ctx, fakeCtx);
  assert.deepEqual(runtime.systems, ['s1']);
  assert.equal(fakeUi.shown, 1, 'HUD가 즉시 표시되지 않음');
  assert.deepEqual(calls[0], ['world', {
    session: fakeSession,
    gameData: { weaponData: [{ id: 'magic_bolt' }] },
  }]);
  assert.deepEqual(calls[1], ['normalize', fakeSession.options]);
  assert.deepEqual(calls[2], ['profile']);
  assert.deepEqual(calls[3], ['context', {
    canvas: { id: 'canvas' },
    renderer: { id: 'renderer' },
    soundEnabled: false,
    profilingEnabled: true,
    session: fakeSession,
  }]);
  assert.deepEqual(calls[4], ['mount-ui']);
  assert.deepEqual(calls[5], ['ui', { id: 'ui-root' }]);
  assert.deepEqual(calls[6], ['views', 'boss-view', 'evo-view']);
  assert.deepEqual(calls[7], ['pipeline', fakeWorld, { id: 'input' }, { weaponData: [{ id: 'magic_bolt' }] }]);
});

test('bootstrapPlaySceneRuntime는 전용 runtime builder에 위임한다', () => {
  const { bootstrapPlaySceneRuntime } = bootstrapApi;
  const sentinel = { world: { id: 'runtime' } };
  const calls = [];

  const result = bootstrapPlaySceneRuntime({
    game: { session: { options: {} }, gameData: {}, input: {}, canvas: {}, renderer: {} },
    buildPlayRuntimeImpl(options) {
      calls.push(options);
      return sentinel;
    },
  });

  assert.equal(result, sentinel);
  assert.equal(calls.length, 1, 'bootstrap helper는 runtime builder를 정확히 한 번 호출해야 함');
});

summary();
