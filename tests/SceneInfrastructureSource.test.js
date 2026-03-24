import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { makeSessionState, makeWorld } from './fixtures/index.js';
import { PlayResultHandler } from '../src/scenes/play/PlayResultHandler.js';
import { createSceneNavigationGuard } from '../src/scenes/sceneNavigation.js';
import {
  persistSession,
  purchasePermanentUpgradeAndSave,
  setSelectedStartWeaponAndSave,
  updateSessionOptionsAndSave,
} from '../src/state/sessionFacade.js';
import {
  resetSessionStorage,
  setSessionStorage,
} from '../src/state/createSessionState.js';

console.log('\n[SceneInfrastructureSource]');

const { test, summary } = createRunner('SceneInfrastructureSource');

test('scene navigation guard는 중복 전환과 stale async commit을 막는다', async () => {
  const guard = createSceneNavigationGuard();
  guard.reset();

  let resolveLoader;
  const firstLoad = guard.load(
    () => new Promise((resolve) => {
      resolveLoader = resolve;
    }),
    () => {},
  );
  const secondLoad = guard.load(
    async () => ({ value: 2 }),
    () => {
      throw new Error('second load should not commit');
    },
  );

  assert.equal(await secondLoad, false);
  guard.reset();
  resolveLoader({ value: 1 });
  assert.equal(await firstLoad, true);
  assert.equal(guard.isNavigating(), false);
});

test('session facade와 play result handler는 저장소 기반 세션 갱신을 수행한다', () => {
  const writes = [];
  setSessionStorage({
    setItem(key, value) {
      writes.push({ key, value: JSON.parse(value) });
    },
    getItem() {
      return null;
    },
  });

  try {
    const session = makeSessionState({
      meta: {
        currency: 100,
        permanentUpgrades: {},
      },
    });

    const options = updateSessionOptionsAndSave(session, { showFps: true });
    assert.equal(options.showFps, true);

    session.meta.unlockedWeapons = ['magic_bolt', 'boomerang'];
    const selected = setSelectedStartWeaponAndSave(session, 'boomerang', {
      weaponData: [
        { id: 'magic_bolt', isEvolved: false },
        { id: 'boomerang', isEvolved: false },
      ],
    });
    assert.deepEqual(selected, { saved: true, selectedWeaponId: 'boomerang' });

    const purchased = purchasePermanentUpgradeAndSave(session, 'perm_hp', 10);
    assert.equal(purchased, true);
    assert.equal(session.meta.currency, 90);

    persistSession(session);
    assert.equal(writes.length >= 4, true);

    const handler = new PlayResultHandler(session);
    session.meta.currency = 123;
    const result = handler.process(makeWorld({
      killCount: 44,
      elapsedTime: 180,
      player: { level: 7, weapons: [{ id: 'magic_bolt' }] },
      runOutcome: { type: 'victory' },
    }));

    assert.equal(result.killCount, 44);
    assert.equal(result.currencyEarned, 33);
    assert.equal(result.outcome, 'victory');
    assert.equal(writes.length >= 5, true);
  } finally {
    resetSessionStorage();
  }
});

summary();
