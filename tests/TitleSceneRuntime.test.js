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
    createTitleLoadoutServiceImpl: () => ({
      startRun: (...args) => {
        saves.push(args);
        return { saved: false, selectedWeaponId: 'magic_bolt', nextScene: null };
      },
    }),
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
      accessories: [{ id: 'ring_of_speed' }],
      stages: [{ id: 'ash_plains' }, { id: 'ember_hollow' }],
      selectedWeaponId: 'magic_bolt',
      selectedStartAccessoryId: 'ring_of_speed',
      selectedAscensionLevel: 3,
      selectedStageId: 'ember_hollow',
      selectedSeedMode: 'custom',
      selectedSeedText: 'ashen-seed',
      canStart: true,
      onCancel: callbacks.onCancel,
      onStart: callbacks.onStart,
    }),
    createTitleLoadoutServiceImpl: () => ({
      startRun: (...args) => {
        saves.push(args);
        return { saved: true, selectedWeaponId: 'magic_bolt', nextScene: { id: 'play-scene' } };
      },
    }),
    createPlaySceneImpl: () => ({ id: 'play-scene' }),
    setTimeoutFn: (callback) => {
      callback();
      return 1;
    },
  });

  config.onStart('magic_bolt', {
    ascensionLevel: 3,
    startAccessoryId: 'ring_of_speed',
    stageId: 'ember_hollow',
    seedMode: 'custom',
    seedText: 'ashen-seed',
  });
  assert.equal(flashes.length, 1, '시작 가능 상태에서 pulseFlash가 호출되지 않음');
  assert.equal(messages.at(-1), '씬 전환 중…');
  assert.equal(saves.length, 1, '시작 가능 상태에서 시작 무기 저장이 호출되지 않음');
  assert.deepEqual(saves[0], ['magic_bolt', {
    ascensionLevel: 3,
    startAccessoryId: 'ring_of_speed',
    stageId: 'ember_hollow',
    seedMode: 'custom',
    seedText: 'ashen-seed',
  }], '확장된 런 설정이 시작 서비스로 전달되지 않음');
  assert.deepEqual(transitions, [{ id: 'play-scene' }], '시작 가능 상태에서 PlayScene 전환이 발생하지 않음');
});

test('runTitleAction는 동적 import 실패 시 서버 재시작 안내를 상태 메시지로 남긴다', () => {
  const navigation = getTitleSceneNavigation();
  const messages = [];
  const errors = [];
  const scene = {
    game: {},
    _nav: {
      load(_loader, _commit, onError) {
        onError(new TypeError('Failed to fetch dynamically imported module: http://127.0.0.1:4177/assets/CodexScene-DEytcOb1.js'));
      },
    },
  };

  const originalConsoleError = console.error;
  console.error = (...args) => {
    errors.push(args);
  };

  try {
    navigation.runTitleAction('codex', scene, {
      pulseFlash: () => {},
      setMessage: (message) => messages.push(message),
      windowRef: { close() {}, setTimeout() {}, closed: false },
      attemptWindowCloseImpl: () => {},
      openTitleStartLoadoutImpl: () => {},
      createMetaShopSceneImpl: async () => null,
    });
  } finally {
    console.error = originalConsoleError;
  }

  assert.equal(
    messages.at(-1),
    'Codex 화면을 불러오지 못했습니다. 개발 서버가 중지되었을 수 있습니다. 서버를 다시 켜고 새로고침한 뒤 다시 시도해주세요.',
    '동적 import 실패 시 상태 메시지가 서버 재시작 안내로 갱신되어야 함',
  );
  assert.equal(errors.length, 1, '실패 로그는 유지되어야 함');
});

summary();
