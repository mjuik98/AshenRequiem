import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { readProjectSource } from './helpers/sourceInspection.js';

console.log('\n[SettingsSceneApplicationService]');

const { test, summary } = createRunner('SettingsSceneApplicationService');

let serviceModule = null;

try {
  serviceModule = await import('../src/app/session/settingsSceneApplicationService.js');
} catch (error) {
  serviceModule = { error };
}

function getServiceModule() {
  assert.ok(
    !serviceModule.error,
    serviceModule.error?.message ?? 'src/app/session/settingsSceneApplicationService.js가 아직 없음',
  );
  return serviceModule;
}

test('settings scene application service는 scene-facing snapshot handlers를 노출한다', () => {
  const service = getServiceModule();
  const source = readProjectSource('../src/app/session/settingsSceneApplicationService.js');

  assert.equal(typeof service.createSettingsSceneHandlers, 'function', 'createSettingsSceneHandlers helper가 없음');
  assert.equal(typeof service.exportSettingsSceneSnapshot, 'function', 'exportSettingsSceneSnapshot helper가 없음');
  assert.equal(typeof service.saveSettingsSceneOptions, 'function', 'saveSettingsSceneOptions helper가 없음');
  assert.equal(typeof service.previewSettingsSceneImport, 'function', 'previewSettingsSceneImport helper가 없음');
  assert.equal(typeof service.importSettingsSceneSnapshot, 'function', 'importSettingsSceneSnapshot helper가 없음');
  assert.equal(typeof service.resetSettingsSceneProgress, 'function', 'resetSettingsSceneProgress helper가 없음');
  assert.equal(typeof service.inspectSettingsSceneStorage, 'function', 'inspectSettingsSceneStorage helper가 없음');
  assert.equal(typeof service.restoreSettingsSceneBackup, 'function', 'restoreSettingsSceneBackup helper가 없음');
  assert.equal(source.includes("from './sessionSnapshotQueryService.js'"), true, 'settings scene service가 session query owner를 사용하지 않음');
  assert.equal(source.includes("from './sessionSnapshotCommandService.js'"), true, 'settings scene service가 session command owner를 사용하지 않음');
  assert.equal(source.includes("from '../../utils/runtimeLogger.js'"), true, 'settings scene service가 runtime logger를 사용하지 않음');
});

test('previewSettingsSceneImport는 SettingsView가 바로 소비할 data payload를 반환한다', () => {
  const { previewSettingsSceneImport } = getServiceModule();
  const session = {
    meta: {
      currency: 77,
      totalRuns: 5,
      unlockedWeapons: ['magic_bolt'],
      unlockedAccessories: [],
      completedUnlocks: [],
      selectedStartWeaponId: 'magic_bolt',
    },
    options: {
      quality: 'medium',
      keyBindings: { pause: ['escape'], confirm: ['enter', 'space'] },
    },
  };
  const rawSnapshot = JSON.stringify({
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
  });

  const result = previewSettingsSceneImport({
    session,
    rawSnapshot,
  });

  assert.equal(result.snapshot, rawSnapshot, 'preview payload는 입력된 raw snapshot을 그대로 유지해야 함');
  assert.equal(result.options, session.options, 'preview payload는 현재 settings options를 유지해야 함');
  assert.equal(result.message, '가져오기 미리보기를 생성했습니다.');
  assert.equal(result.detailLines.some((line) => line.includes('재화 77 → 140')), true, 'preview payload가 currency diff를 노출하지 않음');
});

test('importSettingsSceneSnapshot는 성공/실패 결과를 scene-friendly payload로 감싼다', () => {
  const { importSettingsSceneSnapshot } = getServiceModule();
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

  const success = importSettingsSceneSnapshot({
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

  assert.equal(success.message, '세션 데이터를 가져왔습니다.');
  assert.equal(success.options, session.options, '성공 payload는 갱신된 options를 노출해야 함');
  assert.equal(typeof success.snapshot, 'string', '성공 payload는 export된 snapshot을 포함해야 함');
  assert.equal(session.meta.currency, 123, 'scene-facing import helper가 session mutation을 위임하지 않음');
  assert.deepEqual(session._importedBindings?.pause, ['escape']);

  const failure = importSettingsSceneSnapshot({
    session,
    rawSnapshot: '{',
  });

  assert.equal(failure.snapshot, '{', '실패 payload는 원본 입력을 유지해야 함');
  assert.equal(failure.message, '세션 데이터를 가져오지 못했습니다. JSON 형식을 확인하세요.');
  assert.deepEqual(failure.detailLines, []);
});

test('inspectSettingsSceneStorage와 restoreSettingsSceneBackup는 settings data panel payload를 직접 반환한다', () => {
  const {
    inspectSettingsSceneStorage,
    restoreSettingsSceneBackup,
  } = getServiceModule();
  const session = {
    best: { kills: 1, survivalTime: 10, level: 1 },
    last: { kills: 1, survivalTime: 10, level: 1, weaponsUsed: [] },
    meta: {
      currency: 10,
      totalRuns: 1,
      recentRuns: [],
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
  memoryStore.set('ashenRequiem_session_corrupt', '{');

  const inspection = inspectSettingsSceneStorage({
    session,
    storage,
  });

  assert.equal(
    inspection.message,
    'primary 재화 10 · backup 재화 44 · corrupt invalid',
    'inspect helper가 settings data panel summary를 조합하지 않음',
  );
  assert.equal(inspection.options, session.options, 'inspect helper가 현재 options를 유지하지 않음');

  const restored = restoreSettingsSceneBackup({
    session,
    storage,
    renderer: {
      setGlowEnabled() {},
      setQualityPreset() {},
    },
  });

  assert.equal(restored.message, 'backup 슬롯에서 세션을 복구했습니다.');
  assert.equal(restored.options, session.options, 'restore helper가 복구 후 options를 노출하지 않음');
  assert.equal(session.meta.currency, 44, 'restore helper가 backup session을 현재 세션에 적용하지 않음');

  const failedRestore = restoreSettingsSceneBackup({
    session,
    storage: {
      getItem() {
        return null;
      },
      setItem() {},
    },
  });

  assert.equal(failedRestore.message, 'backup 슬롯을 복구하지 못했습니다.');
  assert.equal(typeof failedRestore.snapshot, 'string', '실패 payload도 현재 snapshot을 유지해야 함');
});

summary();
