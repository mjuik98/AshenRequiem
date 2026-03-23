import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { registerRuntimeHooks, unregisterRuntimeHooks } from '../src/core/runtimeHooks.js';

const { test, summary } = createRunner('RuntimeHooks');

console.log('\n[RuntimeHooks]');

test('runtime hook은 기본적으로 비활성 상태이며 전역 debug host를 노출하지 않는다', () => {
  registerRuntimeHooks({ sceneManager: { currentScene: null } });

  try {
    assert.equal('__ASHEN_DEBUG__' in globalThis, false);
    assert.equal('render_game_to_text' in globalThis, false);
    assert.equal('advanceTime' in globalThis, false);
  } finally {
    unregisterRuntimeHooks();
  }
});

test('활성화된 runtime hook은 안정적인 debug host에서 snapshot과 제어 API를 제공한다', () => {
  const game = {
    advanceTime(ms) {
      this.lastAdvanceMs = ms;
    },
    sceneManager: {
      currentScene: {
        sceneId: 'PlayScene',
        constructor: { name: 'e' },
        _ui: {
          isPaused: () => true,
          isLevelUpVisible: () => false,
          isResultVisible: () => false,
        },
        world: {
          playMode: 'playing',
          elapsedTime: 12.5,
          killCount: 3,
          player: {
            hp: 100,
            maxHp: 100,
            level: 4,
            weapons: [{ id: 'solar_ray' }],
            accessories: [{ id: 'arcane_prism' }],
          },
          runRerollsRemaining: 2,
          runBanishesRemaining: 1,
          pendingLevelUpChoices: [{ id: 'up_solar_ray_plus' }],
        },
      },
    },
  };

  registerRuntimeHooks(game, { enabled: true });

  try {
    const snapshot = globalThis.__ASHEN_DEBUG__?.getSnapshot();
    assert.equal(snapshot.scene, 'PlayScene');
    assert.equal(snapshot.playMode, 'playing');
    assert.deepEqual(snapshot.player.weapons, ['solar_ray']);
    assert.deepEqual(snapshot.ui, {
      pauseVisible: true,
      levelUpVisible: false,
      resultVisible: false,
    });
    globalThis.__ASHEN_DEBUG__?.advanceTime(136);
    assert.equal(game.lastAdvanceMs, 136);
  } finally {
    unregisterRuntimeHooks();
  }
});

test('unregisterRuntimeHooks는 등록한 전역 훅을 제거한다', () => {
  registerRuntimeHooks({ sceneManager: { currentScene: null } }, { enabled: true });
  unregisterRuntimeHooks();
  assert.equal('__ASHEN_DEBUG__' in globalThis, false);
  assert.equal('render_game_to_text' in globalThis, false);
  assert.equal('advanceTime' in globalThis, false);
});

test('debug host는 현재 game 인스턴스와 자동화용 overlay helper를 노출한다', () => {
  let pauseOpened = false;
  let resultOpened = false;
  const game = { sceneManager: { currentScene: null } };
  game.sceneManager.currentScene = {
    sceneId: 'PlayScene',
    _ui: {
      isPaused: () => pauseOpened,
      isLevelUpVisible: () => false,
      isResultVisible: () => resultOpened,
      showPause: () => { pauseOpened = true; },
      showResult: () => { resultOpened = true; },
    },
    _gameData: {},
    world: {
      elapsedTime: 17,
      killCount: 9,
      player: { level: 3, weapons: [], accessories: [] },
    },
  };
  registerRuntimeHooks(game, { enabled: true });

  try {
    assert.equal(globalThis.__ASHEN_DEBUG__?.getGame(), game);
    assert.equal(globalThis.__ASHEN_DEBUG__?.openPauseOverlay(), true);
    assert.equal(globalThis.__ASHEN_DEBUG__?.openResultOverlay(), true);
  } finally {
    unregisterRuntimeHooks();
  }
});

summary();
