import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { readProjectSource } from './helpers/sourceInspection.js';

console.log('\n[DomainNamespaces]');

const { test, summary } = createRunner('DomainNamespaces');

let playWorldApi = null;
let loadoutApi = null;
let playResultApi = null;

try {
  playWorldApi = await import('../src/domain/play/state/createPlayWorld.js');
  loadoutApi = await import('../src/domain/meta/loadout/startLoadoutDomain.js');
  playResultApi = await import('../src/domain/meta/progression/playResultDomain.js');
} catch (error) {
  playWorldApi = { error };
  loadoutApi = { error };
  playResultApi = { error };
}

test('domain namespace entrypoints expose play world, loadout, and play result APIs', () => {
  assert.ok(!playWorldApi.error, playWorldApi.error?.message ?? 'createPlayWorld domain module이 없음');
  assert.ok(!loadoutApi.error, loadoutApi.error?.message ?? 'startLoadoutDomain module이 없음');
  assert.ok(!playResultApi.error, playResultApi.error?.message ?? 'playResultDomain module이 없음');

  assert.equal(typeof playWorldApi.createPlayWorld, 'function');
  assert.equal(typeof loadoutApi.resolveStartWeaponSelection, 'function');
  assert.equal(typeof loadoutApi.buildPlayerStartWeapons, 'function');
  assert.equal(typeof playResultApi.processPlayResult, 'function');
  assert.equal(typeof playResultApi.buildPlayResultSummary, 'function');
});

test('legacy runtime modules re-export from domain namespaces instead of owning the implementation', () => {
  const createWorldSource = readProjectSource('../src/state/createWorld.js');
  const loadoutSource = readProjectSource('../src/state/startLoadoutRuntime.js');
  const playResultSource = readProjectSource('../src/scenes/play/playResultRuntime.js');

  assert.equal(createWorldSource.includes("from '../domain/play/state/createPlayWorld.js'"), true, 'createWorld wrapper가 domain play module을 re-export해야 함');
  assert.equal(loadoutSource.includes("from '../domain/meta/loadout/startLoadoutDomain.js'"), true, 'startLoadoutRuntime wrapper가 domain meta module을 re-export해야 함');
  assert.equal(playResultSource.includes("from '../../domain/meta/progression/playResultDomain.js'"), true, 'playResultRuntime wrapper가 domain meta module을 re-export해야 함');
});

summary();
