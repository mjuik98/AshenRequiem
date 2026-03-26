import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';

console.log('\n[MetaApplicationServices]');

const { test, summary } = createRunner('MetaApplicationServices');

test('settings application service는 저장과 runtime 반영을 한 곳에서 처리한다', async () => {
  const { setSessionRepository, resetSessionRepository } = await import('../src/state/createSessionState.js');
  const { saveSettingsAndApplyRuntime } = await import('../src/app/meta/settingsApplicationService.js');

  const savedSessions = [];
  setSessionRepository({
    save(session) {
      savedSessions.push(session.options);
    },
    load() {
      return null;
    },
  });

  try {
    const runtimeCalls = [];
    const session = {
      options: {
        soundEnabled: true,
        musicEnabled: true,
        masterVolume: 80,
        bgmVolume: 60,
        sfxVolume: 100,
        quality: 'medium',
        glowEnabled: true,
        showFps: false,
        useDevicePixelRatio: true,
      },
    };
    let resized = 0;

    const resolved = saveSettingsAndApplyRuntime({
      session,
      nextOptions: { glowEnabled: false, quality: 'high' },
      renderer: {
        setGlowEnabled(value) {
          runtimeCalls.push(['glow', value]);
        },
        setQualityPreset(value) {
          runtimeCalls.push(['quality', value]);
        },
      },
      resizeCanvas() {
        resized += 1;
      },
    });

    assert.equal(resized, 1);
    assert.equal(savedSessions.length, 1);
    assert.equal(session.options.glowEnabled, false);
    assert.equal(resolved.quality, 'high');
    assert.deepEqual(runtimeCalls, [['glow', false], ['quality', 'high']]);
  } finally {
    resetSessionRepository();
  }
});

test('meta shop application service는 업그레이드 검증, 비용 계산, 저장을 함께 처리한다', async () => {
  const { setSessionRepository, resetSessionRepository } = await import('../src/state/createSessionState.js');
  const { purchaseMetaShopUpgrade } = await import('../src/app/meta/metaShopApplicationService.js');

  let saveCount = 0;
  setSessionRepository({
    save() {
      saveCount += 1;
    },
    load() {
      return null;
    },
  });

  try {
    const session = {
      meta: {
        currency: 100,
        permanentUpgrades: {},
      },
    };

    const result = purchaseMetaShopUpgrade(session, 'perm_hp');

    assert.equal(result.success, true);
    assert.equal(result.definition.id, 'perm_hp');
    assert.equal(session.meta.permanentUpgrades.perm_hp, 1);
    assert.equal(session.meta.currency, 90);
    assert.equal(saveCount, 1);
  } finally {
    resetSessionRepository();
  }
});

test('codex application service는 메타 보정과 gameData/session 전달을 함께 수행한다', async () => {
  const { prepareCodexSceneState } = await import('../src/app/meta/codexApplicationService.js');

  const session = {
    best: { kills: 0, survivalTime: 0, level: 1 },
    meta: {
      unlockedWeapons: ['magic_bolt'],
      unlockedAccessories: [],
      completedUnlocks: [],
      selectedStartWeaponId: 'magic_bolt',
    },
  };
  const gameData = { enemyData: [], weaponData: [] };

  const prepared = prepareCodexSceneState({ session, gameData });

  assert.equal(prepared.session, session);
  assert.equal(prepared.gameData, gameData);
  assert.deepEqual(session.meta.enemyKills, {});
  assert.deepEqual(session.meta.enemiesEncountered, []);
  assert.deepEqual(session.meta.weaponsUsedAll, []);
});

summary();
