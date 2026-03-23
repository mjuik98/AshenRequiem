import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';

console.log('\n[CodexViewRuntime]');

const { test, summary } = createRunner('CodexViewRuntime');

let runtimeApi = null;

try {
  runtimeApi = await import('../src/ui/codex/codexViewRuntime.js');
} catch (error) {
  runtimeApi = { error };
}

function getRuntimeApi() {
  assert.ok(
    !runtimeApi.error,
    runtimeApi.error?.message ?? 'src/ui/codex/codexViewRuntime.js가 아직 없음',
  );
  return runtimeApi;
}

test('codex view runtime helper는 shell/panel orchestration entrypoint를 노출한다', () => {
  const api = getRuntimeApi();
  assert.equal(typeof api.renderCodexViewRuntime, 'function', 'renderCodexViewRuntime helper가 없음');
  assert.equal(typeof api.renderCodexPanelsRuntime, 'function', 'renderCodexPanelsRuntime helper가 없음');
  assert.equal(typeof api.activateCodexTabRuntime, 'function', 'activateCodexTabRuntime helper가 없음');
  assert.equal(typeof api.showCodexAccessoryRuntime, 'function', 'showCodexAccessoryRuntime helper가 없음');
  assert.equal(typeof api.showCodexWeaponRuntime, 'function', 'showCodexWeaponRuntime helper가 없음');
});

summary();
