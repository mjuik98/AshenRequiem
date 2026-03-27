import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { readProjectSource } from './helpers/sourceInspection.js';

console.log('\n[RuntimeLogger]');

const { test, summary } = createRunner('RuntimeLogger');

let runtimeLogger = null;

try {
  runtimeLogger = await import('../src/utils/runtimeLogger.js');
} catch (error) {
  runtimeLogger = { error };
}

function getRuntimeLoggerApi() {
  assert.ok(
    !runtimeLogger.error,
    runtimeLogger.error?.message ?? 'src/utils/runtimeLogger.js가 아직 없음',
  );
  return runtimeLogger;
}

test('runtime logger helper exposes info/debug gating helpers', () => {
  const api = getRuntimeLoggerApi();
  assert.equal(typeof api.isRuntimeDebugEnabled, 'function', 'isRuntimeDebugEnabled helper가 없음');
  assert.equal(typeof api.logRuntimeInfo, 'function', 'logRuntimeInfo helper가 없음');
  assert.equal(typeof api.logRuntimeWarn, 'function', 'logRuntimeWarn helper가 없음');
  assert.equal(typeof api.logRuntimeError, 'function', 'logRuntimeError helper가 없음');
});

test('runtime info logs are routed through shared logger helpers', () => {
  const weaponEvolutionSource = readProjectSource('../src/systems/progression/WeaponEvolutionSystem.js');
  const bossPhaseHandlerSource = readProjectSource('../src/adapters/play/events/bossPhaseEventAdapter.js');
  const titleSceneNavigationSource = readProjectSource('../src/scenes/title/titleSceneNavigation.js');
  const playUiSource = readProjectSource('../src/scenes/play/PlayUI.js');
  const settingsSceneSource = readProjectSource('../src/scenes/SettingsScene.js');
  const metaShopSceneSource = readProjectSource('../src/scenes/MetaShopScene.js');
  const codexSceneSource = readProjectSource('../src/scenes/CodexScene.js');

  assert.equal(weaponEvolutionSource.includes('console.info('), false, 'WeaponEvolutionSystem에 console.info가 남아 있음');
  assert.equal(bossPhaseHandlerSource.includes('console.info('), false, 'bossPhaseHandler에 console.info가 남아 있음');
  assert.equal(weaponEvolutionSource.includes('logRuntimeInfo('), true, 'WeaponEvolutionSystem이 shared runtime logger를 사용하지 않음');
  assert.equal(bossPhaseHandlerSource.includes('logRuntimeInfo('), true, 'bossPhaseHandler가 shared runtime logger를 사용하지 않음');
  assert.equal(titleSceneNavigationSource.includes('console.error('), false, 'titleSceneNavigation에 console.error가 남아 있음');
  assert.equal(titleSceneNavigationSource.includes('console.warn('), false, 'titleSceneNavigation에 console.warn이 남아 있음');
  assert.equal(playUiSource.includes('console.error('), false, 'PlayUI에 console.error가 남아 있음');
  assert.equal(settingsSceneSource.includes('console.error('), false, 'SettingsScene에 console.error가 남아 있음');
  assert.equal(metaShopSceneSource.includes('console.error('), false, 'MetaShopScene에 console.error가 남아 있음');
  assert.equal(codexSceneSource.includes('console.error('), false, 'CodexScene에 console.error가 남아 있음');
  assert.equal(titleSceneNavigationSource.includes('logRuntimeError('), true, 'titleSceneNavigation이 shared runtime error logger를 사용하지 않음');
  assert.equal(titleSceneNavigationSource.includes('logRuntimeWarn('), true, 'titleSceneNavigation이 shared runtime warn logger를 사용하지 않음');
  assert.equal(playUiSource.includes('logRuntimeError('), true, 'PlayUI가 shared runtime error logger를 사용하지 않음');
  assert.equal(settingsSceneSource.includes('logRuntimeError('), true, 'SettingsScene이 shared runtime error logger를 사용하지 않음');
  assert.equal(metaShopSceneSource.includes('logRuntimeError('), true, 'MetaShopScene이 shared runtime error logger를 사용하지 않음');
  assert.equal(codexSceneSource.includes('logRuntimeError('), true, 'CodexScene이 shared runtime error logger를 사용하지 않음');
});

summary();
