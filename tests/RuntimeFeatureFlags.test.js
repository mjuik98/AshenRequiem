import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { readProjectSource } from './helpers/sourceInspection.js';

console.log('\n[RuntimeFeatureFlags]');

const { test, summary } = createRunner('RuntimeFeatureFlags');

let runtimeFlagsApi = null;

try {
  runtimeFlagsApi = await import('../src/adapters/browser/runtimeFeatureFlags.js');
} catch (error) {
  runtimeFlagsApi = { error };
}

function getRuntimeFlagsApi() {
  assert.ok(
    !runtimeFlagsApi.error,
    runtimeFlagsApi.error?.message ?? 'src/adapters/browser/runtimeFeatureFlags.js가 아직 없음',
  );
  return runtimeFlagsApi;
}

test('runtime feature flags adapter exposes shared browser flag readers', () => {
  const api = getRuntimeFlagsApi();

  assert.equal(typeof api.shouldEnablePipelineProfiling, 'function');
  assert.equal(typeof api.shouldForceTouchHud, 'function');
  assert.equal(typeof api.isRuntimeDebugScopeEnabled, 'function');
  assert.equal(typeof api.shouldEnableRuntimeHooks, 'function');

  assert.equal(api.shouldEnablePipelineProfiling({ __ASHEN_PROFILE_PIPELINE__: true }), true);
  assert.equal(api.shouldEnablePipelineProfiling({ location: { search: '?profilePipeline=1' } }), true);
  assert.equal(api.shouldForceTouchHud({ location: { search: '?forceTouchHud=1' } }, {}), true);
  assert.equal(api.shouldForceTouchHud({}, { forceTouchHud: true }), true);
  assert.equal(api.isRuntimeDebugScopeEnabled('audio', { __ASHEN_RUNTIME_DEBUG__: ['audio'] }), true);
  assert.equal(api.shouldEnableRuntimeHooks({}, { __ASHEN_DEBUG_RUNTIME__: true }), true);
});

test('core runtimeFeatureFlags wrapper re-exports the adapter-owned flag readers', async () => {
  const api = getRuntimeFlagsApi();
  const coreApi = await import('../src/core/runtimeFeatureFlags.js');

  assert.equal(coreApi.shouldEnablePipelineProfiling, api.shouldEnablePipelineProfiling, 'core runtimeFeatureFlags wrapper가 profiling helper를 재노출하지 않음');
  assert.equal(coreApi.shouldForceTouchHud, api.shouldForceTouchHud, 'core runtimeFeatureFlags wrapper가 touch helper를 재노출하지 않음');
  assert.equal(coreApi.isRuntimeDebugScopeEnabled, api.isRuntimeDebugScopeEnabled, 'core runtimeFeatureFlags wrapper가 debug scope helper를 재노출하지 않음');
  assert.equal(coreApi.shouldEnableRuntimeHooks, api.shouldEnableRuntimeHooks, 'core runtimeFeatureFlags wrapper가 runtime hooks helper를 재노출하지 않음');
});

test('runtime flag consumers delegate global/query parsing to the shared adapter', () => {
  const playRuntimeComposerSource = readProjectSource('../src/scenes/play/playRuntimeComposer.js');
  const gameInputRuntimeSource = readProjectSource('../src/adapters/browser/gameInputRuntime.js');
  const runtimeLoggerSource = readProjectSource('../src/utils/runtimeLogger.js');
  const runtimeLoggerPolicySource = readProjectSource('../src/adapters/browser/runtimeLoggerPolicy.js');
  const bootstrapSource = readProjectSource('../src/app/bootstrap/bootstrapBrowserGame.js');
  const runtimeDebugSurfaceSource = readProjectSource('../src/adapters/browser/runtimeHooks/runtimeDebugSurface.js');
  const runtimeFeatureFlagsSource = readProjectSource('../src/adapters/browser/runtimeFeatureFlags.js');
  const coreRuntimeFeatureFlagsSource = readProjectSource('../src/core/runtimeFeatureFlags.js');

  assert.equal(playRuntimeComposerSource.includes("from '../../adapters/browser/runtimeFeatureFlags.js'"), true, 'playRuntimeComposer가 shared runtime flag adapter를 사용하지 않음');
  assert.equal(playRuntimeComposerSource.includes("from '../../adapters/browser/runtimeEnv.js'"), false, 'playRuntimeComposer가 query parsing을 직접 runtimeEnv에 위임하면 안 됨');
  assert.equal(gameInputRuntimeSource.includes("from './runtimeFeatureFlags.js'"), true, 'gameInputRuntime이 shared runtime flag helper를 사용하지 않음');
  assert.equal(gameInputRuntimeSource.includes('new URLSearchParams('), false, 'gameInputRuntime에 query parsing 구현이 남아 있음');
  assert.equal(runtimeLoggerSource.includes("from '../adapters/browser/runtimeFeatureFlags.js'"), false, 'runtimeLogger가 browser runtime flag helper를 직접 import하면 안 됨');
  assert.equal(runtimeLoggerSource.includes('__ASHEN_RUNTIME_DEBUG__'), false, 'runtimeLogger가 runtime debug 전역 플래그를 직접 해석하면 안 됨');
  assert.equal(runtimeLoggerPolicySource.includes("from './runtimeFeatureFlags.js'"), true, 'runtimeLoggerPolicy가 shared runtime flag adapter를 사용하지 않음');
  assert.equal(bootstrapSource.includes("from '../../adapters/browser/runtimeLoggerPolicy.js'"), true, 'bootstrap이 browser runtime logger policy wiring을 소유하지 않음');
  assert.equal(runtimeDebugSurfaceSource.includes("from '../runtimeFeatureFlags.js'"), true, 'runtimeDebugSurface가 shared runtime flag adapter를 사용하지 않음');
  assert.equal(runtimeDebugSurfaceSource.includes("from '../runtimeEnv.js'"), false, 'runtimeDebugSurface가 runtimeEnv query helper를 직접 사용하면 안 됨');
  assert.equal(runtimeFeatureFlagsSource.includes("from '../../core/runtimeFeatureFlags.js'"), false, 'browser runtime flag adapter가 core wrapper를 다시 import하면 안 됨');
  assert.equal(runtimeFeatureFlagsSource.includes('export function shouldEnablePipelineProfiling'), true, 'browser runtime flag adapter가 실구현을 소유하지 않음');
  assert.equal(coreRuntimeFeatureFlagsSource.includes("from '../adapters/browser/runtimeFeatureFlags.js'"), true, 'core runtimeFeatureFlags wrapper가 adapter owner를 재노출하지 않음');
});

summary();
