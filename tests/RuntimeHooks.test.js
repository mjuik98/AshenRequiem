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
          run: {
            playMode: 'playing',
            elapsedTime: 12.5,
            killCount: 3,
            runCurrencyEarned: 0,
            runOutcome: null,
            guidance: {
              stageModifier: {
                title: 'Glacial Draft',
                ruleText: '원거리 적 투사체 속도가 빨라집니다.',
                counterplay: '측면 이동으로 각도를 먼저 비우세요.',
              },
            },
            encounterState: {
              currentBeat: {
                label: '빙결 압박',
                intensity: 'pressure',
                summaryText: '교차 각이 빠르게 닫힙니다.',
              },
              nextBossStartsIn: 38,
            },
          },
          entities: {
            player: {
              hp: 100,
              maxHp: 100,
              level: 4,
              weapons: [{ id: 'solar_ray' }],
              accessories: [{ id: 'arcane_prism' }],
            },
          },
          progression: {
            runRerollsRemaining: 2,
            runBanishesRemaining: 1,
            pendingLevelUpChoices: [{ id: 'up_solar_ray_plus' }],
          },
          runtime: {
            replayTrace: [{ frame: 1, moveX: 1, moveY: 0, actions: ['pause'] }],
          },
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
    assert.equal(snapshot.authoring.stageModifierTitle, 'Glacial Draft');
    assert.equal(snapshot.authoring.replayTraceLength, 1);
    assert.equal(snapshot.authoring.counterplay, '측면 이동으로 각도를 먼저 비우세요.');
    assert.equal(snapshot.encounter.label, '빙결 압박');
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
  let levelUpOpened = false;
  let resultArgs = null;
  const game = { sceneManager: { currentScene: null } };
  game.sceneManager.currentScene = {
    sceneId: 'PlayScene',
    _ui: {
      isPaused: () => pauseOpened,
      isLevelUpVisible: () => levelUpOpened,
      isResultVisible: () => resultOpened,
      showPause: () => { pauseOpened = true; },
      hidePause: () => { pauseOpened = false; },
      hideLevelUp: () => { levelUpOpened = false; },
      hideResult: () => { resultOpened = false; },
      showLevelUp: () => {
        levelUpOpened = true;
      },
      showResult: (...args) => {
        resultOpened = true;
        resultArgs = args;
      },
    },
    _levelUpController: {
      show() {
        levelUpOpened = true;
      },
    },
    _gameData: {},
    world: {
      run: {
        playMode: 'playing',
        elapsedTime: 17,
        killCount: 9,
        runOutcome: null,
        guidance: {
          recommendedBuild: {
            title: 'Arcane Nova Route',
            baseWeaponId: 'magic_bolt',
            targetEvolutionId: 'arcane_nova',
            targetAccessoryIds: ['tome_of_power'],
          },
        },
      },
      entities: {
        player: { level: 3, weapons: [], accessories: [] },
      },
    },
  };
  registerRuntimeHooks(game, { enabled: true });

  try {
    assert.equal(globalThis.__ASHEN_DEBUG__?.getGame(), game);
    assert.equal(globalThis.__ASHEN_DEBUG__?.openPauseOverlay(), true);
    assert.equal(globalThis.__ASHEN_DEBUG__?.openLevelUpOverlay(), true);
    assert.equal(
      game.sceneManager.currentScene.world.run.guidance.recommendedBuild,
      null,
      'debug level up overlay는 안정적인 smoke 상태를 위해 추천 빌드 경로를 비워야 함',
    );
    assert.deepEqual(globalThis.__ASHEN_DEBUG__?.getSnapshot()?.ui, {
      pauseVisible: false,
      levelUpVisible: true,
      resultVisible: false,
    });
    assert.equal(globalThis.__ASHEN_DEBUG__?.openResultOverlay(), true);
    assert.deepEqual(globalThis.__ASHEN_DEBUG__?.getSnapshot()?.ui, {
      pauseVisible: false,
      levelUpVisible: false,
      resultVisible: true,
    });
    assert.equal(typeof resultArgs?.[1], 'function', 'debug result overlay가 restart callback을 전달하지 않음');
    assert.equal(typeof resultArgs?.[2], 'function', 'debug result overlay가 title callback을 전달하지 않음');
  } finally {
    unregisterRuntimeHooks();
  }
});

test('debug host는 boss readability smoke를 위한 강제 보스 상태 helper를 노출한다', () => {
  let updatedEnemies = null;
  const game = { sceneManager: { currentScene: null } };
  game.sceneManager.currentScene = {
    sceneId: 'PlayScene',
    _ui: {
      isPaused: () => false,
      isLevelUpVisible: () => false,
      isResultVisible: () => false,
      update(world) {
        updatedEnemies = world.entities.enemies;
      },
    },
    world: {
      run: {
        playMode: 'playing',
        elapsedTime: 220,
        killCount: 12,
        runOutcome: null,
        stageId: 'frost_harbor',
        stage: { id: 'frost_harbor', name: 'Frost Harbor' },
        guidance: {
          primaryObjective: { title: '차가운 봉쇄선' },
          stageDirective: { title: '교차 화망' },
        },
        encounterState: {
          currentBeat: {
            label: '봉쇄 구간',
            summaryText: '교차 탄막과 보스가 동선을 잘라냅니다.',
          },
        },
      },
      entities: {
        player: { level: 5, weapons: [], accessories: [] },
        enemies: [],
      },
    },
  };
  registerRuntimeHooks(game, { enabled: true });

  try {
    assert.equal(typeof globalThis.__ASHEN_DEBUG__?.openBossReadabilityOverlay, 'function', 'boss readability helper가 노출되지 않음');
    assert.equal(globalThis.__ASHEN_DEBUG__?.openBossReadabilityOverlay(), true, 'boss readability helper가 false를 반환함');
    assert.equal(Array.isArray(updatedEnemies), true, 'boss readability helper가 UI update를 유도하지 않음');
    assert.equal(updatedEnemies.some((enemy) => enemy.isBoss), true, 'boss readability helper가 boss enemy를 주입하지 않음');
  } finally {
    unregisterRuntimeHooks();
  }
});

test('debug host는 encounter authoring snapshot helper를 노출한다', () => {
  const game = {
    sceneManager: {
      currentScene: {
        sceneId: 'PlayScene',
        _ui: {
          isPaused: () => false,
          isLevelUpVisible: () => false,
          isResultVisible: () => false,
        },
        world: {
          run: {
            playMode: 'playing',
            elapsedTime: 48,
            killCount: 4,
            runCurrencyEarned: 18,
            runOutcome: null,
            guidance: {
              stageDirective: { title: '교차 화망', detail: '중앙 동선을 오래 점유하지 마세요.' },
              stageModifier: {
                title: 'Cold Front',
                ruleText: '원거리 적 탄속 +12%',
                counterplay: '거리보다 각도 정리를 우선하세요.',
              },
            },
            encounterState: {
              currentBeat: {
                label: '교차 화망',
                intensity: 'pressure',
                summaryText: '양 측면에서 탄막이 합쳐집니다.',
              },
              nextBossStartsIn: 102,
            },
          },
          entities: {
            player: { level: 2, weapons: [], accessories: [] },
          },
          runtime: {
            replayTrace: [
              { frame: 12, moveX: 1, moveY: 0, actions: [] },
              { frame: 13, moveX: 0, moveY: -1, actions: ['pause'] },
            ],
          },
        },
      },
    },
  };

  registerRuntimeHooks(game, { enabled: true });

  try {
    assert.equal(typeof globalThis.__ASHEN_DEBUG__?.getAuthoringSnapshot, 'function', 'authoring snapshot helper가 노출되지 않음');
    const snapshot = globalThis.__ASHEN_DEBUG__?.getAuthoringSnapshot();
    assert.equal(snapshot.stageModifierTitle, 'Cold Front');
    assert.equal(snapshot.counterplay, '거리보다 각도 정리를 우선하세요.');
    assert.equal(snapshot.replayTraceLength, 2);
    assert.equal(snapshot.currentBeatLabel, '교차 화망');
  } finally {
    unregisterRuntimeHooks();
  }
});

summary();
