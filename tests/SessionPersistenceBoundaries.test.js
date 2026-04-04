import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { readProjectSource, stripLineComments } from './helpers/sourceInspection.js';

console.log('\n[SessionPersistenceBoundaries]');

const { test, summary } = createRunner('SessionPersistenceBoundaries');

const sessionPersistenceSource = stripLineComments(readProjectSource('../src/app/session/sessionPersistenceService.js'));

test('session persistence app service does not depend on createSessionState barrel directly', () => {
  assert.equal(
    /from\s+['"]\.\.\/\.\.\/state\/createSessionState\.js['"]/.test(sessionPersistenceSource),
    false,
    'sessionPersistenceService가 createSessionState barrel에 직접 의존하고 있음',
  );
});

test('session persistence exposes an injectable factory for command/save ownership', async () => {
  const persistence = await import('../src/app/session/sessionPersistenceService.js');

  assert.equal(typeof persistence.createSessionPersistenceService, 'function', 'injectable session persistence factory가 없음');

  const calls = [];
  const session = {
    options: { quality: 'medium' },
    activeRun: null,
    meta: {
      permanentUpgrades: {},
    },
  };
  const service = persistence.createSessionPersistenceService({
    persistSessionImpl(nextSession) {
      calls.push(['persist', nextSession.options.quality, nextSession.activeRun]);
      return nextSession;
    },
    mergeSessionOptionsImpl(prevOptions, nextOptions) {
      calls.push(['merge', prevOptions.quality, nextOptions.quality]);
      return { ...prevOptions, ...nextOptions };
    },
    purchasePermanentUpgradeImpl(targetSession, upgradeId, cost) {
      calls.push(['purchase', upgradeId, cost]);
      targetSession.meta.permanentUpgrades[upgradeId] = (targetSession.meta.permanentUpgrades[upgradeId] ?? 0) + 1;
      return true;
    },
  });

  service.updateSessionOptionsAndSave(session, { quality: 'high' });
  service.setActiveRunAndSave(session, { id: 'run-1' });
  const purchased = service.purchasePermanentUpgradeAndSave(session, 'custom_upgrade', 9);

  assert.equal(purchased, true, 'factory-backed purchase helper가 성공 결과를 반환하지 않음');
  assert.equal(session.options.quality, 'high', 'factory-backed options merge가 세션에 반영되지 않음');
  assert.deepEqual(session.activeRun, { id: 'run-1' }, 'factory-backed activeRun write가 세션에 반영되지 않음');
  assert.equal(session.meta.permanentUpgrades.custom_upgrade, 1, 'factory-backed purchase command가 세션을 갱신하지 않음');
  assert.deepEqual(calls, [
    ['merge', 'medium', 'high'],
    ['persist', 'high', null],
    ['persist', 'high', { id: 'run-1' }],
    ['purchase', 'custom_upgrade', 9],
    ['persist', 'high', { id: 'run-1' }],
  ], 'session persistence factory가 command/save 경계를 올바르게 조합하지 않음');
});

summary();
