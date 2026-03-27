import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { makePlayer, makeSessionState, makeWorld } from './fixtures/index.js';

console.log('\n[ActiveRunApplicationService]');

const { test, summary } = createRunner('ActiveRunApplicationService');

const api = await import('../src/app/play/activeRunApplicationService.js');

test('active run service는 world/player snapshot을 캡처하고 복원한다', () => {
  const world = makeWorld({
    run: {
      elapsedTime: 123,
      killCount: 45,
      runCurrencyEarned: 12,
      stageId: 'ember_hollow',
      stage: { id: 'ember_hollow', name: 'Ember Hollow' },
      seedMode: 'custom',
      seedLabel: 'ashen-seed',
      lastDamageSource: { attackerId: 'boss_lich', label: 'boss_lich' },
    },
    entities: {
      player: makePlayer({
        x: 10,
        y: 20,
        hp: 77,
        level: 5,
        weapons: [{ id: 'magic_bolt', level: 3 }],
        accessories: [{ id: 'ring_of_speed', level: 1 }],
        acquiredUpgrades: new Set(['up_magic_bolt']),
      }),
    },
  });

  const snapshot = api.captureActiveRunSnapshot(world);
  assert.equal(snapshot.run.stageId, 'ember_hollow');
  assert.equal(snapshot.player.level, 5);
  assert.deepEqual(snapshot.player.acquiredUpgrades, ['up_magic_bolt']);

  const freshWorld = makeWorld({ run: {}, entities: { player: makePlayer({ weapons: [], accessories: [] }) } });
  const restored = api.restoreActiveRunSnapshot(freshWorld, freshWorld.entities.player, snapshot);

  assert.equal(restored.restored, true, 'restoreActiveRunSnapshot이 복원 상태를 반환하지 않음');
  assert.equal(freshWorld.run.elapsedTime, 123, 'run snapshot이 복원되지 않음');
  assert.equal(freshWorld.entities.player.level, 5, 'player snapshot이 복원되지 않음');
  assert.equal(freshWorld.entities.player.acquiredUpgrades.has('up_magic_bolt'), true, 'Set 기반 업그레이드가 복원되지 않음');
});

test('active run service는 세션에 snapshot 저장/삭제를 캡슐화한다', () => {
  const session = makeSessionState();
  const world = makeWorld({ entities: { player: makePlayer({ weapons: [], accessories: [] }) } });
  const persisted = [];

  const saveResult = api.saveActiveRunAndPersist(session, world, {
    persistSessionImpl(targetSession) {
      persisted.push(targetSession.activeRun ? 'saved' : 'cleared');
    },
  });
  assert.equal(saveResult.saved, true, 'active run snapshot 저장이 실패함');
  assert.ok(session.activeRun, '세션에 activeRun이 기록되지 않음');

  const clearResult = api.clearActiveRunAndPersist(session, {
    persistSessionImpl(targetSession) {
      persisted.push(targetSession.activeRun ? 'saved' : 'cleared');
    },
  });
  assert.equal(clearResult.saved, true, 'active run snapshot 삭제가 실패함');
  assert.equal(session.activeRun, null, '세션 activeRun이 비워지지 않음');
  assert.deepEqual(persisted, ['saved', 'cleared']);
});

summary();
