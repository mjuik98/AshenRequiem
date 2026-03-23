import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';

console.log('\n[TitleSceneRuntime]');

const { test, summary } = createRunner('TitleSceneRuntime');

let runtimeApi = null;

try {
  runtimeApi = await import('../src/scenes/title/titleSceneRuntime.js');
} catch (error) {
  runtimeApi = { error };
}

function getRuntimeApi() {
  assert.ok(
    !runtimeApi.error,
    runtimeApi.error?.message ?? 'src/scenes/title/titleSceneRuntime.js가 아직 없음',
  );
  return runtimeApi;
}

test('title scene runtime helper는 DOM, 이벤트, 로드아웃 orchestration entrypoint를 노출한다', () => {
  const api = getRuntimeApi();
  assert.equal(typeof api.buildTitleSceneDom, 'function', 'buildTitleSceneDom helper가 없음');
  assert.equal(typeof api.teardownTitleSceneRuntime, 'function', 'teardownTitleSceneRuntime helper가 없음');
  assert.equal(typeof api.bindTitleSceneEvents, 'function', 'bindTitleSceneEvents helper가 없음');
  assert.equal(typeof api.ensureTitleLoadoutView, 'function', 'ensureTitleLoadoutView helper가 없음');
  assert.equal(typeof api.openTitleStartLoadout, 'function', 'openTitleStartLoadout helper가 없음');
});

summary();
