import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';

console.log('\n[PauseViewRuntime]');

const { test, summary } = createRunner('PauseViewRuntime');

let runtimeApi = null;

try {
  runtimeApi = await import('../src/ui/pause/pauseViewRuntime.js');
} catch (error) {
  runtimeApi = { error };
}

function getRuntimeApi() {
  assert.ok(
    !runtimeApi.error,
    runtimeApi.error?.message ?? 'src/ui/pause/pauseViewRuntime.js가 아직 없음',
  );
  return runtimeApi;
}

test('pause view runtime helper는 orchestration entrypoint를 노출한다', () => {
  const api = getRuntimeApi();
  assert.equal(typeof api.renderPauseViewRuntime, 'function', 'renderPauseViewRuntime helper가 없음');
  assert.equal(typeof api.refreshPauseLoadoutPanelRuntime, 'function', 'refreshPauseLoadoutPanelRuntime helper가 없음');
  assert.equal(typeof api.bindPauseViewRuntime, 'function', 'bindPauseViewRuntime helper가 없음');
  assert.equal(typeof api.disposePauseViewRuntime, 'function', 'disposePauseViewRuntime helper가 없음');
});

summary();
