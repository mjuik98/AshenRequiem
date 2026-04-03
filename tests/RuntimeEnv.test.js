import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { readProjectSource } from './helpers/sourceInspection.js';

console.log('\n[RuntimeEnv]');

const { test, summary } = createRunner('RuntimeEnv');

let envApi = null;

try {
  envApi = await import('../src/adapters/browser/runtimeEnv.js');
} catch (error) {
  envApi = { error };
}

test('runtime env adapter는 browser global 접근 헬퍼를 노출한다', () => {
  assert.ok(!envApi.error, envApi.error?.message ?? 'runtimeEnv.js가 아직 없음');
  assert.equal(typeof envApi.getDevicePixelRatio, 'function');
  assert.equal(typeof envApi.getViewportSize, 'function');
  assert.equal(typeof envApi.getNowMs, 'function');
  assert.equal(typeof envApi.getNowSeconds, 'function');
  assert.equal(typeof envApi.hasRuntimeQueryFlag, 'function');

  assert.equal(envApi.getDevicePixelRatio({ devicePixelRatio: 2 }, 1), 2);
  assert.deepEqual(envApi.getViewportSize({ innerWidth: 640, innerHeight: 360 }), { width: 640, height: 360 });
  assert.equal(envApi.hasRuntimeQueryFlag('debugRuntime', { location: { search: '?debugRuntime&x=1' } }), true);
});

test('high-coupling runtime modules는 shared runtime env adapter를 사용한다', () => {
  const runtimeEnvSource = readProjectSource('../src/adapters/browser/runtimeEnv.js');
  const runtimeHooksSource = readProjectSource('../src/adapters/browser/runtimeHooks.js');
  const runtimeDebugSurfaceSource = readProjectSource('../src/adapters/browser/runtimeHooks/runtimeDebugSurface.js');
  const runtimeHooksWrapperSource = readProjectSource('../src/core/runtimeHooks.js');
  const playSceneRuntimeSource = readProjectSource('../src/scenes/play/playSceneRuntime.js');
  const playContextRuntimeSource = readProjectSource('../src/core/playContextRuntime.js');
  const playRuntimeServicesSource = readProjectSource('../src/adapters/browser/playRuntimeServices.js');
  const runtimeHostSource = readProjectSource('../src/core/runtimeHost.js');
  const renderSystemSource = readProjectSource('../src/systems/render/RenderSystem.js');
  const soundSfxControllerSource = readProjectSource('../src/systems/sound/soundSfxController.js');
  const soundSystemLifecycleSource = readProjectSource('../src/systems/sound/soundSystemLifecycle.js');
  const drawEffectSource = readProjectSource('../src/renderer/draw/drawEffect.js');
  const gameLoopSource = readProjectSource('../src/core/GameLoop.js');
  const gameCanvasRuntimeSource = readProjectSource('../src/core/gameCanvasRuntime.js');
  const titleBackgroundStateSource = readProjectSource('../src/scenes/title/titleBackgroundState.js');
  const cameraCullSource = readProjectSource('../src/utils/cameraCull.js');

  assert.equal(runtimeHooksSource.includes("from './runtimeHooks/runtimeHostRegistration.js'"), true, 'runtimeHooks facade가 host registration helper를 사용하지 않음');
  assert.equal(runtimeDebugSurfaceSource.includes("from '../runtimeEnv.js'"), true, 'runtime debug surface helper가 runtime env adapter를 사용하지 않음');
  assert.equal(runtimeHooksWrapperSource.includes("from '../adapters/browser/runtimeEnv.js'"), false, 'core/runtimeHooks wrapper가 browser runtime env에 직접 결합되면 안 됨');
  assert.equal(runtimeHooksWrapperSource.includes("from '../adapters/browser/runtimeHooks.js'"), true, 'core/runtimeHooks wrapper가 browser runtime hooks를 재노출하지 않음');
  assert.equal(playSceneRuntimeSource.includes("from '../../adapters/browser/runtimeEnv.js'"), true, 'playSceneRuntime이 runtime env adapter를 사용하지 않음');
  assert.equal(playContextRuntimeSource.includes("from '../adapters/browser/runtimeEnv.js'"), false, 'playContextRuntime은 browser runtime adapter를 직접 import하면 안 됨');
  assert.equal(playRuntimeServicesSource.includes("from './runtimeEnv.js'"), true, 'play runtime browser service adapter가 runtime env adapter를 사용하지 않음');
  assert.equal(gameCanvasRuntimeSource.includes("from './runtimeHost.js'"), true, 'gameCanvasRuntime이 runtime host helper를 사용하지 않음');
  assert.equal(runtimeEnvSource.includes("from '../../core/runtimeHost.js'"), true, 'runtime env adapter가 shared runtime host helper를 사용하지 않음');
  assert.equal(runtimeHostSource.includes('export function getViewportSize'), true, 'runtime host helper가 viewport contract를 소유하지 않음');
  assert.equal(gameCanvasRuntimeSource.includes('function getRuntimeHost('), false, 'gameCanvasRuntime에 runtime env helper 중복이 남아 있음');
  assert.equal(renderSystemSource.includes("from '../../adapters/browser/runtimeEnv.js'"), false, 'RenderSystem이 browser runtime adapter에 직접 결합되어 있으면 안 됨');
  assert.equal(drawEffectSource.includes("from '../../adapters/browser/runtimeEnv.js'"), true, 'drawEffect가 runtime env adapter를 사용하지 않음');
  assert.equal(gameLoopSource.includes("from '../adapters/browser/runtimeEnv.js'"), false, 'GameLoop는 browser runtime env adapter에 직접 결합되면 안 됨');
  assert.equal(gameLoopSource.includes('getNowMs = defaultGetNowMs'), true, 'GameLoop가 주입 가능한 clock seam을 제공하지 않음');
  assert.equal(drawEffectSource.includes('window.devicePixelRatio'), false, 'drawEffect에 직접 window.devicePixelRatio가 남아 있음');
  assert.equal(renderSystemSource.includes('performance.now()'), false, 'RenderSystem에 직접 performance.now가 남아 있음');
  assert.equal(renderSystemSource.includes('services.nowSeconds'), true, 'RenderSystem이 주입된 clock service를 사용하지 않음');
  assert.equal(soundSfxControllerSource.includes("from '../../adapters/browser/runtimeEnv.js'"), false, 'soundSfxController가 browser runtime adapter에 직접 결합되어 있으면 안 됨');
  assert.equal(soundSfxControllerSource.includes('target._nowSeconds'), true, 'soundSfxController가 주입된 nowSeconds helper를 사용하지 않음');
  assert.equal(soundSystemLifecycleSource.includes('globalThis.window'), false, 'soundSystemLifecycle에 직접 window 접근이 남아 있으면 안 됨');
  assert.equal(titleBackgroundStateSource.includes("from '../../core/runtimeHost.js'"), true, 'title background state가 shared runtime host를 사용하지 않음');
  assert.equal(cameraCullSource.includes("from '../core/runtimeHost.js'"), true, 'cameraCull가 shared runtime host를 사용하지 않음');
  assert.equal(cameraCullSource.includes('window.innerWidth'), false, 'cameraCull에 직접 window viewport 접근이 남아 있음');
});

summary();
