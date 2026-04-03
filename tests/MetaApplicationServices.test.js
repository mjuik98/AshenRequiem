import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { readProjectSource } from './helpers/sourceInspection.js';

console.log('\n[MetaApplicationServices]');

const { test, summary } = createRunner('MetaApplicationServices');

test('settings application service는 preview/codec/mutation helper로 internals를 분리한다', async () => {
  const settingsAppSource = readProjectSource('../src/app/meta/settingsApplicationService.js');
  const settingsQuerySource = readProjectSource('../src/app/meta/settingsQueryService.js');
  const settingsCommandSource = readProjectSource('../src/app/meta/settingsCommandService.js');

  await import('../src/app/meta/settingsApplicationService.js');
  await import('../src/app/meta/settingsQueryService.js');
  await import('../src/app/meta/settingsCommandService.js');
  await import('../src/app/meta/settingsPreviewDiff.js');
  await import('../src/app/meta/settingsSessionCodec.js');
  await import('../src/app/meta/settingsSessionMutation.js');

  assert.equal(settingsAppSource.includes("from './settingsQueryService.js'"), true, 'settings application facade가 query service를 사용하지 않음');
  assert.equal(settingsAppSource.includes("from './settingsCommandService.js'"), true, 'settings application facade가 command service를 사용하지 않음');
  assert.equal(settingsQuerySource.includes("from './settingsPreviewDiff.js'"), true, 'settings query service가 preview helper를 사용하지 않음');
  assert.equal(settingsCommandSource.includes("from './settingsSessionMutation.js'"), true, 'settings command service가 mutation helper를 사용하지 않음');
  assert.equal(settingsCommandSource.includes("from '../session/sessionRuntimeApplicationService.js'"), true, 'settings command service가 runtime apply helper를 사용하지 않음');
});

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

test('settings application service는 세션 export/import/reset 관리도 제공한다', async () => {
  const { setSessionRepository, resetSessionRepository } = await import('../src/state/createSessionState.js');
  const {
    exportSessionSnapshot,
    importSessionSnapshot,
    inspectStoredSessionSnapshots,
    previewSessionSnapshotImport,
    resetSessionProgress,
    restoreStoredSessionSnapshot,
  } = await import('../src/app/meta/settingsApplicationService.js');

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
      best: { kills: 10, survivalTime: 90, level: 3 },
      last: { kills: 2, survivalTime: 30, level: 1, weaponsUsed: [] },
      meta: {
        currency: 77,
        totalRuns: 5,
        recentRuns: [{ outcome: 'victory', stageId: 'ash_plains' }],
        unlockedWeapons: ['magic_bolt'],
        unlockedAccessories: [],
        completedUnlocks: [],
        permanentUpgrades: {},
        selectedStartWeaponId: 'magic_bolt',
      },
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
        keyBindings: { pause: ['escape'], confirm: ['enter', 'space'] },
      },
      activeRun: null,
    };

    const exported = exportSessionSnapshot({ session });
    assert.equal(exported.includes('"currency":123'), false, 'export snapshot이 잘못된 데이터에 의존함');
    assert.equal(exported.includes('"currency":77'), true, 'export snapshot이 현재 세션 메타를 포함하지 않음');

    const preview = previewSessionSnapshotImport({
      session,
      rawSnapshot: JSON.stringify({
        meta: {
          currency: 140,
          totalRuns: 8,
          unlockedWeapons: ['magic_bolt', 'holy_aura'],
          unlockedAccessories: ['iron_heart'],
          completedUnlocks: ['unlock_iron_heart'],
          dailyChallengeStreak: 3,
          selectedStageId: 'ember_hollow',
          selectedStartWeaponId: 'holy_aura',
        },
        options: {
          quality: 'high',
          keyBindings: { pause: ['p'], confirm: ['f'] },
        },
      }),
    });

    assert.equal(preview.summary.currency, 140, 'preview helper가 imported currency를 요약하지 않음');
    assert.equal(preview.diffLines.some((line) => line.includes('재화 77 → 140')), true, 'preview helper가 currency diff를 노출하지 않음');
    assert.equal(preview.diffLines.some((line) => line.includes('일일 연속 보상 0일 → 3일')), true, 'preview helper가 daily streak diff를 노출하지 않음');

    importSessionSnapshot({
      session,
      rawSnapshot: JSON.stringify({
        best: { kills: 55, survivalTime: 180, level: 8 },
        meta: {
          currency: 123,
          totalRuns: 9,
          recentRuns: [{ outcome: 'defeat', stageId: 'ember_hollow' }],
          unlockedWeapons: ['magic_bolt', 'holy_aura'],
          unlockedAccessories: ['iron_heart'],
          completedUnlocks: ['unlock_iron_heart'],
          permanentUpgrades: {},
          selectedStartWeaponId: 'holy_aura',
        },
        options: { quality: 'high', glowEnabled: false },
      }),
      renderer: {
        setGlowEnabled() {},
        setQualityPreset() {},
      },
      inputManager: {
        configureKeyBindings(bindings) {
          session._importedBindings = bindings;
        },
      },
      resizeCanvas() {},
    });

    assert.equal(session.meta.currency, 123, 'session import가 메타 값을 현재 세션에 반영하지 않음');
    assert.equal(session.best.kills, 55, 'session import가 best snapshot을 반영하지 않음');
    assert.equal(session.options.quality, 'high', 'session import가 options를 반영하지 않음');
    assert.deepEqual(session._importedBindings?.pause, ['escape'], 'session import가 input binding runtime을 재적용하지 않음');

    resetSessionProgress({
      session,
      inputManager: {
        configureKeyBindings(bindings) {
          session._resetBindings = bindings;
        },
      },
    });
    assert.equal(session.meta.currency, 0, 'reset session progress가 currency를 초기화하지 않음');
    assert.equal(session.meta.totalRuns, 0, 'reset session progress가 totalRuns를 초기화하지 않음');
    assert.equal(session.options.quality, 'high', 'reset session progress가 options를 보존하지 않음');
    assert.deepEqual(session._resetBindings?.confirm, ['enter', 'space'], 'reset session progress가 input binding runtime을 유지하지 않음');
    assert.equal(saveCount >= 2, true, 'import/reset 경로가 세션 저장을 수행하지 않음');

    const memoryStore = new Map();
    const storage = {
      getItem(key) {
        return memoryStore.has(key) ? memoryStore.get(key) : null;
      },
      setItem(key, value) {
        memoryStore.set(key, String(value));
      },
    };
    memoryStore.set('ashenRequiem_session', JSON.stringify({ meta: { currency: 10 }, options: { quality: 'medium' } }));
    memoryStore.set('ashenRequiem_session_backup', JSON.stringify({ meta: { currency: 44 }, options: { quality: 'low' } }));

    const inspection = inspectStoredSessionSnapshots({ storage });
    assert.equal(inspection.backup.status, 'ok', 'settings application service가 backup inspection을 노출하지 않음');

    restoreStoredSessionSnapshot({
      session,
      target: 'backup',
      storage,
      renderer: {
        setGlowEnabled() {},
        setQualityPreset() {},
      },
      inputManager: {
        configureKeyBindings(bindings) {
          session._restoredBindings = bindings;
        },
      },
      resizeCanvas() {},
    });

    assert.equal(session.meta.currency, 44, 'backup restore가 현재 세션을 갱신하지 않음');
    assert.deepEqual(session._restoredBindings?.pause, ['escape'], 'backup restore가 input binding runtime을 갱신하지 않음');
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
