import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { installMockDom } from './helpers/mockDom.js';
import { readProjectSource } from './helpers/sourceInspection.js';

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

let titleSceneRuntimeState = null;

try {
  titleSceneRuntimeState = await import('../src/scenes/title/titleSceneRuntimeState.js');
} catch (error) {
  titleSceneRuntimeState = { error };
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

function getTitleSceneRuntimeState() {
  assert.ok(
    !titleSceneRuntimeState.error,
    titleSceneRuntimeState.error?.message ?? 'src/scenes/title/titleSceneRuntimeState.js가 아직 없음',
  );
  return titleSceneRuntimeState;
}

test('title scene runtime helper는 DOM, 이벤트, 로드아웃 orchestration entrypoint를 노출한다', () => {
  const api = getRuntimeApi();
  const navigation = getTitleSceneNavigation();
  const input = getTitleSceneInput();
  const loadoutFlow = getTitleLoadoutFlow();
  const runtimeState = getTitleSceneRuntimeState();
  assert.equal(typeof api.buildTitleSceneDom, 'function', 'buildTitleSceneDom helper가 없음');
  assert.equal(typeof api.teardownTitleSceneRuntime, 'function', 'teardownTitleSceneRuntime helper가 없음');
  assert.equal(typeof api.bindTitleSceneEvents, 'function', 'bindTitleSceneEvents helper가 없음');
  assert.equal(typeof api.ensureTitleLoadoutView, 'function', 'ensureTitleLoadoutView helper가 없음');
  assert.equal(typeof api.openTitleStartLoadout, 'function', 'openTitleStartLoadout helper가 없음');
  assert.equal(typeof runtimeState.createTitleSceneRuntimeState, 'function', 'createTitleSceneRuntimeState helper가 없음');
  assert.equal(typeof navigation.runTitleAction, 'function', 'titleSceneNavigation.runTitleAction helper가 없음');
  assert.equal(typeof navigation.bindTitleActionButtons, 'function', 'titleSceneNavigation.bindTitleActionButtons helper가 없음');
  assert.equal(typeof input.bindTitleSceneInput, 'function', 'titleSceneInput.bindTitleSceneInput helper가 없음');
  assert.equal(typeof loadoutFlow.ensureTitleLoadoutView, 'function', 'titleLoadoutFlow.ensureTitleLoadoutView helper가 없음');
  assert.equal(typeof loadoutFlow.openTitleStartLoadout, 'function', 'titleLoadoutFlow.openTitleStartLoadout helper가 없음');
  assert.equal(api.ensureTitleLoadoutView, loadoutFlow.ensureTitleLoadoutView, 'titleSceneRuntime가 loadout flow facade를 재-export하지 않음');
  assert.equal(api.openTitleStartLoadout, loadoutFlow.openTitleStartLoadout, 'titleSceneRuntime가 loadout flow facade를 재-export하지 않음');
});

test('buildTitleSceneDom는 기존 title shell을 재사용하고 shell refs를 캐시한다', () => {
  const api = getRuntimeApi();
  const runtimeStateApi = getTitleSceneRuntimeState();
  const { document, restore } = installMockDom();

  try {
    const uiContainer = document.createElement('div');
    uiContainer.setAttribute('id', 'ui-container');
    document.body.appendChild(uiContainer);

    const scene = {
      _runtimeState: runtimeStateApi.createTitleSceneRuntimeState(),
    };

    const firstRoot = api.buildTitleSceneDom(scene, {
      documentRef: document,
      ensureTitleStylesImpl: () => {},
      initBackgroundImpl: () => {},
    });
    const secondRoot = api.buildTitleSceneDom(scene, {
      documentRef: document,
      ensureTitleStylesImpl: () => {},
      initBackgroundImpl: () => {},
    });

    assert.equal(firstRoot, secondRoot, 'title shell root가 재사용되지 않음');
    assert.equal(uiContainer.children.length, 1, 'title shell root가 중복 append되면 안 됨');
    assert.ok(scene._runtimeState.shellRefs, 'title shell refs가 runtime state에 캐시되지 않음');
    assert.equal(scene._runtimeState.shellRefs.live.id, 'title-live', 'title 상태 메시지 ref가 캐시되지 않음');
    assert.equal(scene._runtimeState.shellRefs.flash.id, 'title-flash', 'title flash ref가 캐시되지 않음');
    assert.equal(scene._runtimeState.shellRefs.canvas.id, 'title-bg-canvas', 'title background canvas ref가 캐시되지 않음');
  } finally {
    restore();
  }
});

test('initTitleSceneBackground는 scene runtime host를 배경 renderer로 주입한다', async () => {
  const api = getRuntimeApi();
  const runtimeStateApi = getTitleSceneRuntimeState();
  const { document, restore } = installMockDom();

  try {
    const uiContainer = document.createElement('div');
    uiContainer.setAttribute('id', 'ui-container');
    document.body.appendChild(uiContainer);

    const scene = {
      game: {
        runtimeHost: { id: 'runtime-host' },
      },
      _runtimeState: runtimeStateApi.createTitleSceneRuntimeState(),
    };

    api.buildTitleSceneDom(scene, {
      documentRef: document,
      ensureTitleStylesImpl: () => {},
      initBackgroundImpl: () => {},
    });

    const ctorCalls = [];
    await api.initTitleSceneBackground(scene, {
      loadTitleBackgroundRenderer: async () => ({
        TitleBackgroundRenderer: class StubTitleBackgroundRenderer {
          constructor(canvas, options = {}) {
            ctorCalls.push([canvas?.id ?? null, options.host ?? null]);
          }
          start() {}
        },
      }),
    });

    assert.deepEqual(ctorCalls, [['title-bg-canvas', scene.game.runtimeHost]], 'title background renderer가 runtime host를 주입받지 않음');
  } finally {
    restore();
  }
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

test('runTitleAction는 동적 import 실패 시 서버 재시작 안내를 상태 메시지로 남긴다', async () => {
  const navigation = getTitleSceneNavigation();
  const navigationSource = readProjectSource('../src/scenes/title/titleSceneNavigation.js');
  const messages = [];
  const errors = [];
  const scene = {
    game: {
      sceneFactory: {},
    },
    _runtimeState: {
      nav: {
        async change(commit, onError) {
          try {
            await commit();
          } catch (error) {
            onError?.(error);
          }
        },
      },
    },
  };

  const originalConsoleError = console.error;
  console.error = (...args) => {
    errors.push(args);
  };

  try {
    await navigation.runTitleAction('codex', scene, {
      pulseFlash: () => {},
      setMessage: (message) => messages.push(message),
      windowRef: { close() {}, setTimeout() {}, closed: false },
      attemptWindowCloseImpl: () => {},
      openTitleStartLoadoutImpl: () => {},
      createMetaShopSceneImpl: async () => null,
      createCodexSceneImpl: async () => {
        throw new TypeError('Failed to fetch dynamically imported module: http://127.0.0.1:4177/assets/CodexScene-DEytcOb1.js');
      },
    });
  } finally {
    console.error = originalConsoleError;
  }

  assert.equal(navigationSource.includes("from '../../utils/runtimeIssue.js'"), true, 'titleSceneNavigation이 shared runtime issue helper를 사용하지 않음');
  assert.equal(navigationSource.includes('Failed to fetch dynamically imported module'), false, 'titleSceneNavigation이 dynamic import failure 문자열을 인라인으로 유지하면 안 됨');
  assert.equal(
    messages.at(-1),
    'Codex 화면을 불러오지 못했습니다. 개발 서버가 중지되었을 수 있습니다. 서버를 다시 켜고 새로고침한 뒤 다시 시도해주세요.',
    '동적 import 실패 시 상태 메시지가 서버 재시작 안내로 갱신되어야 함',
  );
  assert.equal(errors.length, 1, '실패 로그는 유지되어야 함');
});

test('bindTitleSceneInput는 session key binding confirm 설정을 따른다', () => {
  const input = getTitleSceneInput();
  const listeners = new Map();
  const scene = {
    game: {
      session: {
        options: {
          keyBindings: {
            confirm: ['f'],
          },
        },
      },
    },
  };
  const calls = [];
  const windowRef = {
    addEventListener(type, listener) {
      const entries = listeners.get(type) ?? [];
      entries.push(listener);
      listeners.set(type, entries);
    },
    removeEventListener() {},
  };

  input.bindTitleSceneInput(scene, {
    startGame: () => calls.push('start'),
    windowRef,
  });

  for (const listener of listeners.get('keydown') ?? []) {
    listener({ key: 'f', code: 'KeyF', preventDefault() {}, target: { tagName: 'DIV' } });
  }

  assert.deepEqual(calls, ['start'], 'title confirm binding이 session key binding을 따르지 않음');
});

test('bindTitleSceneInput는 start loadout overlay가 열려 있으면 confirm을 무시한다', () => {
  const input = getTitleSceneInput();
  const listeners = new Map();
  const calls = [];
  const scene = {
    _loadoutView: {
      _el: {
        style: {
          display: 'flex',
        },
      },
    },
    game: {
      session: {
        options: {
          keyBindings: {
            confirm: ['f'],
          },
        },
      },
    },
  };
  const windowRef = {
    addEventListener(type, listener) {
      const entries = listeners.get(type) ?? [];
      entries.push(listener);
      listeners.set(type, entries);
    },
    removeEventListener() {},
  };

  input.bindTitleSceneInput(scene, {
    startGame: () => calls.push('start'),
    windowRef,
  });

  for (const listener of listeners.get('keydown') ?? []) {
    listener({ key: 'f', code: 'KeyF', preventDefault() {}, target: { tagName: 'DIV' } });
  }

  assert.deepEqual(calls, [], 'start loadout overlay가 열린 상태에서 title confirm이 다시 실행되면 안 됨');
});

test('bindTitleSceneInput는 loadout view visibility contract로 overlay open 상태를 판별한다', () => {
  const input = getTitleSceneInput();
  const listeners = new Map();
  const calls = [];
  const scene = {
    _loadoutView: {
      isVisible() {
        return true;
      },
    },
    game: {
      session: {
        options: {
          keyBindings: {
            confirm: ['f'],
          },
        },
      },
    },
  };
  const windowRef = {
    addEventListener(type, listener) {
      const entries = listeners.get(type) ?? [];
      entries.push(listener);
      listeners.set(type, entries);
    },
    removeEventListener() {},
  };

  input.bindTitleSceneInput(scene, {
    startGame: () => calls.push('start'),
    windowRef,
  });

  for (const listener of listeners.get('keydown') ?? []) {
    listener({ key: 'f', code: 'KeyF', preventDefault() {}, target: { tagName: 'DIV' } });
  }

  assert.deepEqual(calls, [], 'visibility contract 기반 overlay open 판별이 동작하지 않음');
});

test('runTitleAction는 start loadout overlay가 열려 있으면 배경 메뉴 액션을 무시한다', () => {
  const navigation = getTitleSceneNavigation();
  const transitions = [];
  const scene = {
    _loadoutView: {
      _el: {
        style: {
          display: 'flex',
        },
      },
    },
    _nav: {
      change(callback) {
        transitions.push(callback);
      },
      load(loader, commit) {
        transitions.push([loader, commit]);
      },
    },
    game: {
      sceneManager: {
        changeScene(nextScene) {
          transitions.push(nextScene);
        },
      },
    },
  };

  navigation.runTitleAction('shop', scene, {
    pulseFlash: () => {},
    setMessage: () => {},
    windowRef: { close() {}, setTimeout() {}, closed: false },
    attemptWindowCloseImpl: () => {},
    openTitleStartLoadoutImpl: () => {},
    createMetaShopSceneImpl: async () => ({ id: 'meta-shop-scene' }),
  });

  assert.deepEqual(transitions, [], 'start loadout overlay가 열린 상태에서 background 메뉴 액션이 실행되면 안 됨');
});

summary();
