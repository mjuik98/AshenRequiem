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
});

test('runtime info logs are routed through shared logger helpers', () => {
  const weaponEvolutionSource = readProjectSource('../src/systems/progression/WeaponEvolutionSystem.js');
  const bossPhaseHandlerSource = readProjectSource('../src/adapters/play/events/bossPhaseEventAdapter.js');

  assert.equal(weaponEvolutionSource.includes('console.info('), false, 'WeaponEvolutionSystem에 console.info가 남아 있음');
  assert.equal(bossPhaseHandlerSource.includes('console.info('), false, 'bossPhaseHandler에 console.info가 남아 있음');
  assert.equal(weaponEvolutionSource.includes('logRuntimeInfo('), true, 'WeaponEvolutionSystem이 shared runtime logger를 사용하지 않음');
  assert.equal(bossPhaseHandlerSource.includes('logRuntimeInfo('), true, 'bossPhaseHandler가 shared runtime logger를 사용하지 않음');
});

summary();
