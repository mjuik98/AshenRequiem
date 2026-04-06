import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { readProjectSource } from './helpers/sourceInspection.js';

console.log('\n[MetaApplicationServices]');

const { test, summary } = createRunner('MetaApplicationServices');

test('settings application service는 session snapshot owner services를 통해 settings internals를 분리한다', async () => {
  const settingsAppSource = readProjectSource('../src/app/meta/settingsApplicationService.js');
  const settingsQuerySource = readProjectSource('../src/app/meta/settingsQueryService.js');
  const settingsCommandSource = readProjectSource('../src/app/meta/settingsCommandService.js');
  const sessionSnapshotQuerySource = readProjectSource('../src/app/session/sessionSnapshotQueryService.js');
  const sessionSnapshotCommandSource = readProjectSource('../src/app/session/sessionSnapshotCommandService.js');
  const sessionRepositoryPortSource = readProjectSource('../src/app/session/sessionRepositoryPort.js');
  const sessionSnapshotPreviewSource = readProjectSource('../src/app/session/sessionSnapshotPreview.js');
  const sessionSnapshotCodecSource = readProjectSource('../src/app/session/sessionSnapshotCodec.js');
  const sessionSnapshotMutationSource = readProjectSource('../src/app/session/sessionSnapshotMutationService.js');

  const settingsApplicationService = await import('../src/app/meta/settingsApplicationService.js');
  const settingsQueryService = await import('../src/app/meta/settingsQueryService.js');
  const settingsCommandService = await import('../src/app/meta/settingsCommandService.js');
  const sessionSnapshotQueryService = await import('../src/app/session/sessionSnapshotQueryService.js');
  const sessionSnapshotCommandService = await import('../src/app/session/sessionSnapshotCommandService.js');
  await import('../src/app/session/sessionSnapshotPreview.js');
  await import('../src/app/session/sessionSnapshotCodec.js');
  await import('../src/app/session/sessionSnapshotMutationService.js');

  assert.equal(settingsAppSource.includes("from './settingsQueryService.js'"), true, 'settings application facade가 query service를 사용하지 않음');
  assert.equal(settingsAppSource.includes("from './settingsCommandService.js'"), true, 'settings application facade가 command service를 사용하지 않음');
  assert.equal(settingsQuerySource.includes("from '../session/sessionSnapshotQueryService.js'"), true, 'settings query service가 session snapshot query owner를 재노출하지 않음');
  assert.equal(settingsCommandSource.includes("from '../session/sessionSnapshotCommandService.js'"), true, 'settings command service가 session snapshot command owner를 재노출하지 않음');
  assert.equal(sessionRepositoryPortSource.includes("from '../../adapters/browser/session/sessionRepository.js'"), true, 'sessionRepositoryPort가 adapter-owned session repository를 연결하지 않음');
  assert.equal(sessionSnapshotQuerySource.includes("from './sessionRepositoryPort.js'"), true, 'session snapshot query service가 local session repository port를 사용하지 않음');
  assert.equal(sessionSnapshotQuerySource.includes("from './sessionSnapshotPreview.js'"), true, 'session snapshot query service가 preview helper를 사용하지 않음');
  assert.equal(sessionSnapshotCommandSource.includes("from './sessionRepositoryPort.js'"), true, 'session snapshot command service가 local session repository port를 사용하지 않음');
  assert.equal(sessionSnapshotCommandSource.includes("from './sessionSnapshotCodec.js'"), true, 'session snapshot command service가 codec helper를 사용하지 않음');
  assert.equal(sessionSnapshotCommandSource.includes("from './sessionSnapshotMutationService.js'"), true, 'session snapshot command service가 mutation helper를 사용하지 않음');
  assert.equal(sessionSnapshotMutationSource.includes("from './sessionSnapshotCodec.js'"), true, 'session snapshot mutation service가 codec helper를 사용하지 않음');
  assert.equal(sessionSnapshotMutationSource.includes("from './sessionRuntimeApplicationService.js'"), true, 'session snapshot mutation service가 runtime apply helper를 사용하지 않음');
  assert.equal(/buildSessionPreviewSummary/.test(sessionSnapshotPreviewSource), true, 'session snapshot preview helper가 preview summary builder를 노출하지 않음');
  assert.equal(/buildResetState/.test(sessionSnapshotCodecSource), true, 'session snapshot codec helper가 reset builder를 노출하지 않음');
  assert.equal(settingsApplicationService.exportSessionSnapshot, sessionSnapshotQueryService.exportSessionSnapshot, 'settings application service가 session snapshot query API를 재노출하지 않음');
  assert.equal(settingsQueryService.exportSessionSnapshot, sessionSnapshotQueryService.exportSessionSnapshot, 'settings query facade가 thin re-export가 아님');
  assert.equal(settingsCommandService.importSessionSnapshot, sessionSnapshotCommandService.importSessionSnapshot, 'settings command facade가 thin re-export가 아님');
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
  const metaShopAppSource = readProjectSource('../src/app/meta/metaShopApplicationService.js');
  const metaShopPurchaseDomainSource = readProjectSource('../src/domain/meta/metashop/metaShopPurchaseDomain.js');

  assert.equal(
    metaShopAppSource.includes("from '../../domain/meta/metashop/metaShopPurchaseDomain.js'"),
    true,
    'metaShopApplicationService가 domain purchase helper를 사용하지 않음',
  );
  assert.equal(
    /findPermanentUpgradeDefinition/.test(metaShopAppSource),
    false,
    'metaShopApplicationService가 purchase lookup 구현을 직접 소유하면 안 됨',
  );
  assert.equal(
    /export function resolveMetaShopPurchase/.test(metaShopPurchaseDomainSource),
    true,
    'meta shop purchase domain helper가 resolveMetaShopPurchase entrypoint를 노출하지 않음',
  );

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

    const result = purchaseMetaShopUpgrade(session, 'perm_hp', {
      gameData: {
        permanentUpgradeData: [
          {
            id: 'perm_hp',
            maxLevel: 10,
            costPerLevel() {
              return 10;
            },
          },
        ],
      },
    });

    assert.equal(result.success, true);
    assert.equal(result.definition.id, 'perm_hp');
    assert.equal(result.currentLevel, 0);
    assert.equal(result.cost, 10);
    assert.equal(session.meta.permanentUpgrades.perm_hp, 1);
    assert.equal(session.meta.currency, 90);
    assert.equal(saveCount, 1);
  } finally {
    resetSessionRepository();
  }
});

test('meta shop scene application service는 view payload와 refresh 조건 판단을 scene 경계로 올린다', async () => {
  const metaShopSceneAppSource = readProjectSource('../src/app/meta/metaShopSceneApplicationService.js');
  const metaShopAppSource = readProjectSource('../src/app/meta/metaShopApplicationService.js');
  const {
    createMetaShopSceneApplicationService,
  } = await import('../src/app/meta/metaShopSceneApplicationService.js');
  const { purchaseMetaShopUpgrade } = await import('../src/app/meta/metaShopApplicationService.js');

  assert.equal(
    metaShopSceneAppSource.includes("from './metaShopApplicationService.js'"),
    true,
    'meta shop scene application service가 low-level meta shop service를 사용하지 않음',
  );
  assert.equal(
    metaShopSceneAppSource.includes("from '../session/sessionPersistenceService.js'"),
    false,
    'meta shop scene application service가 세션 저장 구현에 직접 결합하면 안 됨',
  );
  assert.equal(
    metaShopSceneAppSource.includes("from '../../domain/meta/metashop/metaShopPurchaseDomain.js'"),
    false,
    'meta shop scene application service가 purchase domain helper에 직접 결합하면 안 됨',
  );
  assert.equal(
    metaShopAppSource.includes("from '../session/sessionPersistenceService.js'"),
    true,
    'meta shop application service가 세션 persistence owner를 사용하지 않음',
  );

  const session = {
    meta: {
      currency: 100,
      permanentUpgrades: {},
    },
  };
  const gameData = {
    permanentUpgradeData: [
      {
        id: 'perm_hp',
        maxLevel: 5,
        costPerLevel() {
          return 10;
        },
      },
    ],
  };
  const service = createMetaShopSceneApplicationService({ session, gameData });

  const initial = service.getViewPayload();
  assert.equal(initial.session, session, 'scene service가 현재 세션을 view payload에 그대로 전달하지 않음');
  assert.deepEqual(initial.viewOptions, { gameData }, 'scene service가 view payload에 gameData를 붙이지 않음');

  const sceneResult = service.purchaseUpgrade('perm_hp');
  const directResult = purchaseMetaShopUpgrade(session, 'perm_hp', { gameData });

  assert.equal(sceneResult.shouldRefresh, true, 'scene service가 성공 purchase에 refresh signal을 붙이지 않음');
  assert.equal(sceneResult.cost, 10, 'scene service가 purchase result를 scene에 재노출하지 않음');
  assert.equal(directResult.cost, 10, 'sanity');
});

test('meta shop purchase domain은 구매 가능 여부와 실패 사유를 순수 계산으로 제공한다', async () => {
  const { resolveMetaShopPurchase } = await import('../src/domain/meta/metashop/metaShopPurchaseDomain.js');

  const upgradeData = [
    {
      id: 'perm_hp',
      maxLevel: 2,
      costPerLevel(level) {
        return level === 0 ? 10 : 25;
      },
    },
  ];

  const purchasable = resolveMetaShopPurchase({
    session: {
      meta: {
        currency: 30,
        permanentUpgrades: {},
      },
    },
    upgradeId: 'perm_hp',
    upgradeData,
  });
  assert.equal(purchasable.allowed, true, 'domain helper가 구매 가능 업그레이드를 막음');
  assert.equal(purchasable.currentLevel, 0);
  assert.equal(purchasable.cost, 10);
  assert.equal(purchasable.reason, null);

  const maxed = resolveMetaShopPurchase({
    session: {
      meta: {
        currency: 999,
        permanentUpgrades: { perm_hp: 2 },
      },
    },
    upgradeId: 'perm_hp',
    upgradeData,
  });
  assert.equal(maxed.allowed, false, 'domain helper가 max-level 업그레이드를 허용하면 안 됨');
  assert.equal(maxed.reason, 'max-level');

  const missing = resolveMetaShopPurchase({
    session: {
      meta: {
        currency: 999,
        permanentUpgrades: {},
      },
    },
    upgradeId: 'missing',
    upgradeData,
  });
  assert.equal(missing.allowed, false, 'domain helper가 없는 업그레이드를 허용하면 안 됨');
  assert.equal(missing.reason, 'invalid-upgrade');
});

test('codex application service는 메타 보정과 gameData/session 전달을 함께 수행한다', async () => {
  const codexAppSource = readProjectSource('../src/app/meta/codexApplicationService.js');
  const codexSessionStateServiceSource = readProjectSource('../src/app/session/codexSessionStateService.js');
  const { prepareCodexSceneState } = await import('../src/app/meta/codexApplicationService.js');
  const { prepareCodexSessionState } = await import('../src/app/session/codexSessionStateService.js');

  assert.equal(
    codexAppSource.includes("from '../session/codexSessionStateService.js'"),
    true,
    'codexApplicationService가 session owner codex service를 사용하지 않음',
  );
  assert.equal(
    codexAppSource.includes("from '../../state/sessionMeta.js'"),
    false,
    'codexApplicationService가 sessionMeta 구현에 직접 결합하면 안 됨',
  );
  assert.equal(
    codexSessionStateServiceSource.includes("from '../../state/sessionMeta.js'"),
    false,
    'codexSessionStateService가 legacy sessionMeta shim에 직접 결합하면 안 됨',
  );
  assert.equal(
    codexSessionStateServiceSource.includes("from '../../state/session/sessionMetaState.js'"),
    true,
    'codexSessionStateService가 session meta owner module을 사용하지 않음',
  );
  assert.equal(
    codexSessionStateServiceSource.includes("from '../../state/session/sessionUnlockState.js'"),
    true,
    'codexSessionStateService가 session unlock owner module을 사용하지 않음',
  );

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

  const preparedSession = prepareCodexSessionState(session);
  assert.equal(preparedSession, session, 'codex session service가 동일 세션 객체를 정리하지 않음');

  const prepared = prepareCodexSceneState({ session, gameData });

  assert.equal(prepared.session, session);
  assert.equal(prepared.gameData, gameData);
  assert.deepEqual(session.meta.enemyKills, {});
  assert.deepEqual(session.meta.enemiesEncountered, []);
  assert.deepEqual(session.meta.weaponsUsedAll, []);
});

test('codex scene application service는 scene-facing payload를 codex application service 위에 조립한다', async () => {
  const codexSceneAppSource = readProjectSource('../src/app/meta/codexSceneApplicationService.js');
  const codexAppSource = readProjectSource('../src/app/meta/codexApplicationService.js');
  const {
    createCodexSceneApplicationService,
  } = await import('../src/app/meta/codexSceneApplicationService.js');
  const { prepareCodexSceneState } = await import('../src/app/meta/codexApplicationService.js');

  assert.equal(
    codexSceneAppSource.includes("from './codexApplicationService.js'"),
    true,
    'codex scene application service가 low-level codex prepare service를 사용하지 않음',
  );
  assert.equal(
    codexSceneAppSource.includes("from '../session/codexSessionStateService.js'"),
    false,
    'codex scene application service가 session owner service에 직접 결합하면 안 됨',
  );
  assert.equal(
    codexAppSource.includes("from '../session/codexSessionStateService.js'"),
    true,
    'codexApplicationService가 session owner codex service를 계속 사용해야 함',
  );

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
  const service = createCodexSceneApplicationService({ session, gameData });

  const payload = service.getViewPayload();
  const prepared = prepareCodexSceneState({ session, gameData });

  assert.equal(payload.session, prepared.session, 'scene service가 prepared session을 payload에 전달하지 않음');
  assert.equal(payload.gameData, prepared.gameData, 'scene service가 prepared gameData를 payload에 전달하지 않음');
});

summary();
