import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { readProjectSource } from './helpers/sourceInspection.js';

console.log('\n[RuntimeLogger]');

const { test, summary } = createRunner('RuntimeLogger');

let runtimeLogger = null;
let runtimeIssue = null;

try {
  runtimeLogger = await import('../src/utils/runtimeLogger.js');
} catch (error) {
  runtimeLogger = { error };
}

try {
  runtimeIssue = await import('../src/utils/runtimeIssue.js');
} catch (error) {
  runtimeIssue = { error };
}

function getRuntimeLoggerApi() {
  assert.ok(
    !runtimeLogger.error,
    runtimeLogger.error?.message ?? 'src/utils/runtimeLogger.js가 아직 없음',
  );
  return runtimeLogger;
}

function getRuntimeIssueApi() {
  assert.ok(
    !runtimeIssue.error,
    runtimeIssue.error?.message ?? 'src/utils/runtimeIssue.js가 아직 없음',
  );
  return runtimeIssue;
}

test('runtime logger helper exposes info/debug gating helpers', () => {
  const api = getRuntimeLoggerApi();
  assert.equal(typeof api.isRuntimeDebugEnabled, 'function', 'isRuntimeDebugEnabled helper가 없음');
  assert.equal(typeof api.logRuntimeInfo, 'function', 'logRuntimeInfo helper가 없음');
  assert.equal(typeof api.logRuntimeWarn, 'function', 'logRuntimeWarn helper가 없음');
  assert.equal(typeof api.logRuntimeError, 'function', 'logRuntimeError helper가 없음');
  assert.equal(typeof api.setRuntimeDebugEnabledResolver, 'function', 'runtime logger debug resolver setter가 없음');
  assert.equal(typeof api.resetRuntimeDebugEnabledResolver, 'function', 'runtime logger debug resolver reset helper가 없음');
});

test('runtime issue helper exposes shared module-load failure detection and messaging', () => {
  const api = getRuntimeIssueApi();

  assert.equal(typeof api.isModuleLoadFailure, 'function', 'module load failure classifier가 없음');
  assert.equal(typeof api.buildModuleLoadFailureMessage, 'function', 'module load failure message helper가 없음');
  assert.equal(
    api.isModuleLoadFailure(new TypeError('Failed to fetch dynamically imported module: /assets/CodexScene.js')),
    true,
    'dynamic import fetch failure가 module load failure로 분류되지 않음',
  );
  assert.equal(
    api.buildModuleLoadFailureMessage('Codex', new TypeError('Failed to fetch dynamically imported module: /assets/CodexScene.js')),
    'Codex 화면을 불러오지 못했습니다. 개발 서버가 중지되었을 수 있습니다. 서버를 다시 켜고 새로고침한 뒤 다시 시도해주세요.',
    'shared module load failure message가 개발 서버 복구 안내를 제공하지 않음',
  );
});

test('runtime info logs are routed through shared logger helpers', () => {
  const weaponEvolutionSource = readProjectSource('../src/systems/progression/WeaponEvolutionSystem.js');
  const bossPhaseHandlerSource = readProjectSource('../src/adapters/play/events/bossPhaseEventAdapter.js');
  const titleSceneNavigationSource = readProjectSource('../src/scenes/title/titleSceneNavigation.js');
  const playUiSource = readProjectSource('../src/scenes/play/PlayUI.js');
  const settingsSceneSource = readProjectSource('../src/scenes/SettingsScene.js');
  const metaShopSceneSource = readProjectSource('../src/scenes/MetaShopScene.js');
  const codexSceneSource = readProjectSource('../src/scenes/CodexScene.js');
  const validateGameDataSource = readProjectSource('../src/utils/validateGameData.js');
  const sessionRecoveryPolicySource = readProjectSource('../src/adapters/browser/session/sessionRecoveryPolicy.js');
  const sessionMigrationsSource = readProjectSource('../src/state/session/sessionMigrations.js');

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
  assert.equal(validateGameDataSource.includes('console.error('), false, 'validateGameData에 console.error가 남아 있으면 안 됨');
  assert.equal(validateGameDataSource.includes('console.warn('), false, 'validateGameData에 console.warn이 남아 있으면 안 됨');
  assert.equal(validateGameDataSource.includes('logRuntimeError('), true, 'validateGameData가 shared runtime error logger를 사용하지 않음');
  assert.equal(validateGameDataSource.includes('logRuntimeWarn('), true, 'validateGameData가 shared runtime warn logger를 사용하지 않음');
  assert.equal(sessionRecoveryPolicySource.includes('console.warn('), false, 'sessionRecoveryPolicy에 console.warn이 남아 있으면 안 됨');
  assert.equal(sessionRecoveryPolicySource.includes('logRuntimeWarn('), true, 'sessionRecoveryPolicy가 shared runtime warn logger를 사용하지 않음');
  assert.equal(sessionMigrationsSource.includes('console.warn('), false, 'sessionMigrations에 console.warn이 남아 있으면 안 됨');
  assert.equal(sessionMigrationsSource.includes('logRuntimeWarn('), true, 'sessionMigrations가 shared runtime warn logger를 사용하지 않음');
});

test('runtime logger browser policy wiring is owned by bootstrap/browser modules', () => {
  const runtimeLoggerSource = readProjectSource('../src/utils/runtimeLogger.js');
  const runtimeLoggerPolicySource = readProjectSource('../src/adapters/browser/runtimeLoggerPolicy.js');
  const bootstrapSource = readProjectSource('../src/app/bootstrap/bootstrapBrowserGame.js');

  assert.equal(runtimeLoggerSource.includes("from '../adapters/browser/runtimeFeatureFlags.js'"), false, 'runtimeLogger가 browser runtime flag adapter를 직접 import하면 안 됨');
  assert.equal(runtimeLoggerSource.includes('setRuntimeDebugEnabledResolver'), true, 'runtimeLogger가 debug resolver setter를 제공하지 않음');
  assert.equal(runtimeLoggerSource.includes('resetRuntimeDebugEnabledResolver'), true, 'runtimeLogger가 debug resolver reset helper를 제공하지 않음');
  assert.equal(runtimeLoggerPolicySource.includes("from './runtimeFeatureFlags.js'"), true, 'browser runtime logger policy helper가 runtimeFeatureFlags owner를 사용하지 않음');
  assert.equal(runtimeLoggerPolicySource.includes("from '../../utils/runtimeLogger.js'"), true, 'browser runtime logger policy helper가 shared runtime logger facade를 연결하지 않음');
  assert.equal(bootstrapSource.includes("from '../../adapters/browser/runtimeLoggerPolicy.js'"), true, 'bootstrap이 browser runtime logger policy wiring을 소유하지 않음');
});

summary();
