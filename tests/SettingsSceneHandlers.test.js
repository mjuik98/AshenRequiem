import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { makeSessionState } from './fixtures/index.js';

console.log('\n[SettingsSceneHandlers]');

const { test, summary } = createRunner('SettingsSceneHandlers');

test('createSettingsSceneHandlers는 SettingsView callback 조립과 저장 후 복귀를 함께 수행한다', async () => {
  const {
    createSettingsSceneHandlers,
  } = await import('../src/app/session/settingsSceneApplicationService.js');

  const session = makeSessionState({
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
  });

  const runtimeCalls = [];
  let closeCalls = 0;
  let runtimeDepsCalls = 0;
  const handlers = createSettingsSceneHandlers({
    session,
    createRuntimeDeps() {
      runtimeDepsCalls += 1;
      return {
        renderer: {
          setGlowEnabled(value) {
            runtimeCalls.push(['glow', value]);
          },
          setQualityPreset(value) {
            runtimeCalls.push(['quality', value]);
          },
        },
        resizeCanvas() {
          runtimeCalls.push(['resize']);
        },
      };
    },
    onRequestClose() {
      closeCalls += 1;
    },
  });

  const saveResult = handlers.onSave({
    glowEnabled: false,
    quality: 'high',
  });

  assert.equal(runtimeDepsCalls, 1, 'save handler가 runtime deps를 지연 조립하지 않음');
  assert.equal(closeCalls, 1, 'save handler가 저장 후 복귀 콜백을 호출하지 않음');
  assert.equal(session.options.glowEnabled, false, 'save handler가 settings 저장을 위임하지 않음');
  assert.equal(session.options.quality, 'high', 'save handler가 quality 변경을 반영하지 않음');
  assert.equal(saveResult.quality, 'high', 'save handler가 저장된 options를 반환하지 않음');
  assert.deepEqual(runtimeCalls, [
    ['resize'],
    ['glow', false],
    ['quality', 'high'],
  ]);
  assert.equal(typeof handlers.onExport, 'function');
  assert.equal(typeof handlers.onImport, 'function');
  assert.equal(typeof handlers.onReset, 'function');
  assert.equal(typeof handlers.onRestoreBackup, 'function');
});

test('createSettingsSceneHandlers는 navigation guard 중에는 저장/복귀를 건너뛴다', async () => {
  const {
    createSettingsSceneHandlers,
  } = await import('../src/app/session/settingsSceneApplicationService.js');

  const session = makeSessionState({
    options: {
      quality: 'medium',
      glowEnabled: true,
    },
  });

  let runtimeDepsCalls = 0;
  let closeCalls = 0;
  const handlers = createSettingsSceneHandlers({
    session,
    isNavigating() {
      return true;
    },
    createRuntimeDeps() {
      runtimeDepsCalls += 1;
      return {};
    },
    onRequestClose() {
      closeCalls += 1;
    },
  });

  const result = handlers.onSave({
    quality: 'high',
    glowEnabled: false,
  });

  assert.equal(result, null, 'navigation guard 중 save handler는 null을 반환해야 함');
  assert.equal(runtimeDepsCalls, 0, 'navigation guard 중 runtime deps를 조립하면 안 됨');
  assert.equal(closeCalls, 0, 'navigation guard 중 복귀 콜백을 호출하면 안 됨');
  assert.equal(session.options.quality, 'medium', 'navigation guard 중 세션 옵션이 바뀌면 안 됨');
  assert.equal(session.options.glowEnabled, true, 'navigation guard 중 세션 옵션이 바뀌면 안 됨');
});

summary();
