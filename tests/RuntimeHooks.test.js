import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { registerRuntimeHooks, unregisterRuntimeHooks } from '../src/core/runtimeHooks.js';

const { test, summary } = createRunner('RuntimeHooks');

console.log('\n[RuntimeHooks]');

test('render_game_to_text는 minify된 constructor.name 대신 안정적인 sceneId를 우선 사용한다', () => {
  const game = {
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

  registerRuntimeHooks(game);

  try {
    const snapshot = JSON.parse(globalThis.render_game_to_text());
    assert.equal(snapshot.scene, 'PlayScene');
    assert.equal(snapshot.playMode, 'playing');
    assert.deepEqual(snapshot.player.weapons, ['solar_ray']);
    assert.deepEqual(snapshot.ui, {
      pauseVisible: true,
      levelUpVisible: false,
      resultVisible: false,
    });
  } finally {
    unregisterRuntimeHooks();
  }
});

test('unregisterRuntimeHooks는 등록한 전역 훅을 제거한다', () => {
  registerRuntimeHooks({ sceneManager: { currentScene: null } });
  unregisterRuntimeHooks();
  assert.equal('render_game_to_text' in globalThis, false);
  assert.equal('advanceTime' in globalThis, false);
});

test('registerRuntimeHooks는 현재 game 인스턴스에 접근 가능한 debug host를 노출한다', () => {
  const game = { sceneManager: { currentScene: null } };
  registerRuntimeHooks(game);

  try {
    assert.equal(globalThis.__ASHEN_RUNTIME__?.game, game);
  } finally {
    unregisterRuntimeHooks();
  }
});

summary();
