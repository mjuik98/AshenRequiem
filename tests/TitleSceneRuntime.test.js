import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';

console.log('\n[TitleSceneRuntime]');

const { test, summary } = createRunner('TitleSceneRuntime');

let runtimeApi = null;
let titleSceneNavigation = null;
let titleSceneInput = null;
let titleLoadoutFlow = null;

try {
  runtimeApi = await import('../src/scenes/title/titleSceneRuntime.js');
} catch (error) {
  runtimeApi = { error };
}

try {
  titleSceneNavigation = await import('../src/scenes/title/titleSceneNavigation.js');
} catch (error) {
  titleSceneNavigation = { error };
}

try {
  titleSceneInput = await import('../src/scenes/title/titleSceneInput.js');
} catch (error) {
  titleSceneInput = { error };
}

try {
  titleLoadoutFlow = await import('../src/scenes/title/titleLoadoutFlow.js');
} catch (error) {
  titleLoadoutFlow = { error };
}

function getRuntimeApi() {
  assert.ok(
    !runtimeApi.error,
    runtimeApi.error?.message ?? 'src/scenes/title/titleSceneRuntime.js가 아직 없음',
  );
  return runtimeApi;
}

function getTitleSceneNavigation() {
  assert.ok(
    !titleSceneNavigation.error,
    titleSceneNavigation.error?.message ?? 'src/scenes/title/titleSceneNavigation.js가 아직 없음',
  );
  return titleSceneNavigation;
}

function getTitleSceneInput() {
  assert.ok(
    !titleSceneInput.error,
    titleSceneInput.error?.message ?? 'src/scenes/title/titleSceneInput.js가 아직 없음',
  );
  return titleSceneInput;
}

function getTitleLoadoutFlow() {
  assert.ok(
    !titleLoadoutFlow.error,
    titleLoadoutFlow.error?.message ?? 'src/scenes/title/titleLoadoutFlow.js가 아직 없음',
  );
  return titleLoadoutFlow;
}

test('title scene runtime helper는 DOM, 이벤트, 로드아웃 orchestration entrypoint를 노출한다', () => {
  const api = getRuntimeApi();
  const navigation = getTitleSceneNavigation();
  const input = getTitleSceneInput();
  const loadoutFlow = getTitleLoadoutFlow();
  assert.equal(typeof api.buildTitleSceneDom, 'function', 'buildTitleSceneDom helper가 없음');
  assert.equal(typeof api.teardownTitleSceneRuntime, 'function', 'teardownTitleSceneRuntime helper가 없음');
  assert.equal(typeof api.bindTitleSceneEvents, 'function', 'bindTitleSceneEvents helper가 없음');
  assert.equal(typeof api.ensureTitleLoadoutView, 'function', 'ensureTitleLoadoutView helper가 없음');
  assert.equal(typeof api.openTitleStartLoadout, 'function', 'openTitleStartLoadout helper가 없음');
  assert.equal(typeof navigation.runTitleAction, 'function', 'titleSceneNavigation.runTitleAction helper가 없음');
  assert.equal(typeof navigation.bindTitleActionButtons, 'function', 'titleSceneNavigation.bindTitleActionButtons helper가 없음');
  assert.equal(typeof input.bindTitleSceneInput, 'function', 'titleSceneInput.bindTitleSceneInput helper가 없음');
  assert.equal(typeof loadoutFlow.ensureTitleLoadoutView, 'function', 'titleLoadoutFlow.ensureTitleLoadoutView helper가 없음');
  assert.equal(typeof loadoutFlow.openTitleStartLoadout, 'function', 'titleLoadoutFlow.openTitleStartLoadout helper가 없음');
  assert.equal(api.ensureTitleLoadoutView, loadoutFlow.ensureTitleLoadoutView, 'titleSceneRuntime가 loadout flow facade를 재-export하지 않음');
  assert.equal(api.openTitleStartLoadout, loadoutFlow.openTitleStartLoadout, 'titleSceneRuntime가 loadout flow facade를 재-export하지 않음');
});

test('openTitleStartLoadout는 시작 불가 상태에서 저장과 씬 전환을 막는다', async () => {
  const api = getRuntimeApi();
  const messages = [];
  const saves = [];
  const transitions = [];
  const shownConfigs = [];

  const config = await api.openTitleStartLoadout({
    game: {
      gameData: { weaponData: [] },
      session: { meta: { selectedStartWeaponId: 'magic_bolt', unlockedWeapons: ['magic_bolt'] } },
      sceneManager: {
        changeScene(nextScene) {
          transitions.push(nextScene);
        },
      },
    },
  }, {
    setMessage: (message) => messages.push(message),
    pulseFlash: () => {},
    ensureTitleLoadoutViewImpl: async () => ({
      show(nextConfig) {
        shownConfigs.push(nextConfig);
      },
    }),
    buildTitleLoadoutConfigImpl: (_gameData, _session, callbacks) => ({
      weapons: [],
      selectedWeaponId: null,
      canStart: false,
      onCancel: callbacks.onCancel,
      onStart: callbacks.onStart,
    }),
    setSelectedStartWeaponAndSaveImpl: (...args) => {
      saves.push(args);
      return { saved: false, selectedWeaponId: 'magic_bolt' };
    },
    createPlaySceneImpl: () => ({ id: 'play-scene' }),
    setTimeoutFn: (callback) => {
      callback();
      return 1;
    },
  });

  assert.equal(shownConfigs.length, 1, 'loadout view가 구성되지 않음');
  assert.equal(messages.at(-1), '시작 가능한 기본 무기가 없습니다.');
  config.onStart('magic_bolt');
  assert.deepEqual(saves, [], '시작 불가 상태에서 시작 무기 저장이 호출되면 안 됨');
  assert.deepEqual(transitions, [], '시작 불가 상태에서 PlayScene 전환이 발생하면 안 됨');
});

test('openTitleStartLoadout는 시작 가능 상태에서 저장 후 PlayScene으로 전환한다', async () => {
  const api = getRuntimeApi();
  const messages = [];
  const saves = [];
  const transitions = [];
  const flashes = [];
  const game = {
    gameData: { weaponData: [{ id: 'magic_bolt', isEvolved: false }] },
    session: { meta: { selectedStartWeaponId: 'magic_bolt', unlockedWeapons: ['magic_bolt'] } },
    sceneManager: {
      changeScene(nextScene) {
        transitions.push(nextScene);
      },
    },
  };

  const config = await api.openTitleStartLoadout({ game }, {
    setMessage: (message) => messages.push(message),
    pulseFlash: () => {
      flashes.push('flash');
    },
    ensureTitleLoadoutViewImpl: async () => ({
      show() {},
    }),
    buildTitleLoadoutConfigImpl: (_gameData, _session, callbacks) => ({
      weapons: [{ id: 'magic_bolt' }],
      selectedWeaponId: 'magic_bolt',
      canStart: true,
      onCancel: callbacks.onCancel,
      onStart: callbacks.onStart,
    }),
    setSelectedStartWeaponAndSaveImpl: (...args) => {
      saves.push(args);
      return { saved: true, selectedWeaponId: 'magic_bolt' };
    },
    createPlaySceneImpl: () => ({ id: 'play-scene' }),
    setTimeoutFn: (callback) => {
      callback();
      return 1;
    },
  });

  config.onStart('magic_bolt');
  assert.equal(flashes.length, 1, '시작 가능 상태에서 pulseFlash가 호출되지 않음');
  assert.equal(messages.at(-1), '씬 전환 중…');
  assert.equal(saves.length, 1, '시작 가능 상태에서 시작 무기 저장이 호출되지 않음');
  assert.deepEqual(transitions, [{ id: 'play-scene' }], '시작 가능 상태에서 PlayScene 전환이 발생하지 않음');
});

summary();
