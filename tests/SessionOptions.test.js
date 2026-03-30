import assert from 'node:assert/strict';
import { test, summary } from './helpers/testRunner.js';

let SESSION_OPTION_DEFAULTS;
let normalizeSessionOptions;
let mergeSessionOptions;
let getEffectiveDevicePixelRatio;
let createSettingsRuntimeDependencies;
let applySessionOptionsToRuntime;

try {
  ({
    SESSION_OPTION_DEFAULTS,
    normalizeSessionOptions,
    mergeSessionOptions,
    getEffectiveDevicePixelRatio,
  } = await import('../src/state/sessionOptions.js'));
} catch (e) {
  console.warn('[테스트] sessionOptions import 실패 — 스킵:', e.message);
  process.exit(1);
}

try {
  ({ applySessionOptionsToRuntime } = await import('../src/app/session/sessionRuntimeApplicationService.js'));
} catch (e) {
  console.warn('[테스트] sessionRuntimeApplicationService import 실패 — 스킵:', e.message);
  process.exit(1);
}

try {
  ({ createSettingsRuntimeDependencies } = await import('../src/scenes/settingsRuntimeDependencies.js'));
} catch (e) {
  console.warn('[테스트] settingsRuntimeDependencies import 실패 — 스킵:', e.message);
  process.exit(1);
}

console.log('\n[SessionOptions]');

test('세션 옵션 기본값은 단일 기본 세트를 제공한다', () => {
  assert.deepEqual(SESSION_OPTION_DEFAULTS, {
    soundEnabled: true,
    musicEnabled: true,
    masterVolume: 80,
    bgmVolume: 60,
    sfxVolume: 100,
    quality: 'medium',
    glowEnabled: true,
    showFps: false,
    useDevicePixelRatio: true,
    reducedMotion: false,
    highVisibilityHud: false,
    largeText: false,
    keyBindings: {
      moveUp: ['w', 'arrowup'],
      moveDown: ['s', 'arrowdown'],
      moveLeft: ['a', 'arrowleft'],
      moveRight: ['d', 'arrowright'],
      pause: ['escape'],
      confirm: ['enter', 'space'],
      debug: ['backquote'],
    },
  });
});

test('normalizeSessionOptions()는 잘못된 quality를 기본값으로 보정한다', () => {
  const normalized = normalizeSessionOptions({
    soundEnabled: false,
    quality: 'ultra',
    bgmVolume: 20,
  });

  assert.equal(normalized.soundEnabled, false);
  assert.equal(normalized.bgmVolume, 20);
  assert.equal(normalized.quality, 'medium');
  assert.equal(normalized.useDevicePixelRatio, true);
  assert.equal(normalized.reducedMotion, false);
  assert.deepEqual(normalized.keyBindings.pause, ['escape']);
});

test('mergeSessionOptions()는 기존 값 위에 patch를 병합하고 정규화한다', () => {
  const merged = mergeSessionOptions(
    { quality: 'low', soundEnabled: false },
    { quality: 'invalid', glowEnabled: false },
  );

  assert.equal(merged.soundEnabled, false);
  assert.equal(merged.glowEnabled, false);
  assert.equal(merged.quality, 'medium');
  assert.deepEqual(merged.keyBindings.confirm, ['enter', 'space']);
});

test('getEffectiveDevicePixelRatio()는 옵션과 폴백 값을 반영한다', () => {
  assert.equal(
    getEffectiveDevicePixelRatio({ useDevicePixelRatio: false }, 2, true),
    1,
  );
  assert.equal(
    getEffectiveDevicePixelRatio({}, 2, false),
    1,
  );
  assert.equal(
    getEffectiveDevicePixelRatio({}, 2, true),
    2,
  );
});

test('applySessionOptionsToRuntime()는 사운드/렌더러에 정규화된 옵션을 전달한다', () => {
  const calls = [];
  const soundSystem = {
    setEnabled(value) { calls.push(['soundEnabled', value]); },
    setMusicEnabled(value) { calls.push(['musicEnabled', value]); },
    setVolume(master, bgm, sfx) { calls.push(['volume', master, bgm, sfx]); },
  };
  const renderer = {
    setGlowEnabled(value) { calls.push(['glowEnabled', value]); },
    setQualityPreset(value) { calls.push(['quality', value]); },
  };
  const accessibilityRuntime = {
    applyOptions(value) { calls.push(['accessibility', value.reducedMotion, value.highVisibilityHud, value.largeText]); },
  };
  const inputManager = {
    configureKeyBindings(value) { calls.push(['bindings', value.pause?.[0], value.confirm?.[0]]); },
  };

  const normalized = applySessionOptionsToRuntime(
    {
      soundEnabled: false,
      musicEnabled: false,
      masterVolume: 40,
      bgmVolume: 20,
      sfxVolume: 50,
      quality: 'high',
      glowEnabled: false,
      reducedMotion: true,
      highVisibilityHud: true,
      largeText: true,
      keyBindings: {
        pause: ['p'],
        confirm: ['f'],
      },
    },
    { soundSystem, renderer, accessibilityRuntime, inputManager },
  );

  assert.equal(normalized.quality, 'high');
  assert.deepEqual(calls, [
    ['soundEnabled', false],
    ['musicEnabled', false],
    ['volume', 0.4, 0.2, 0.5],
    ['glowEnabled', false],
    ['quality', 'high'],
    ['accessibility', true, true, true],
    ['bindings', 'p', 'f'],
  ]);
});

test('createSettingsRuntimeDependencies()는 SettingsScene 런타임 의존성 조립을 중앙화한다', () => {
  const game = {
    renderer: { id: 'renderer' },
    soundSystem: { id: 'sound' },
    input: { id: 'input' },
    _resizeCanvas() {},
  };
  const accessibilityRuntime = { id: 'accessibility' };

  const deps = createSettingsRuntimeDependencies(game, {
    accessibilityRuntimeFactory: () => accessibilityRuntime,
  });

  assert.deepEqual(Object.keys(deps).sort(), [
    'accessibilityRuntime',
    'inputManager',
    'renderer',
    'resizeCanvas',
    'soundSystem',
  ]);
  assert.equal(deps.renderer, game.renderer);
  assert.equal(deps.soundSystem, game.soundSystem);
  assert.equal(deps.accessibilityRuntime, accessibilityRuntime);
  assert.equal(deps.inputManager, game.input);
  assert.equal(typeof deps.resizeCanvas, 'function');
});

summary();
