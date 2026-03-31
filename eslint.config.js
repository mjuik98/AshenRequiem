export default [
  {
    ignores: ['dist/**', 'output/**', 'node_modules/**'],
  },
  {
    files: ['src/**/*.js'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          '**/state/createWorld.js',
          '**/state/startLoadoutRuntime.js',
          '**/scenes/play/playerSpawnRuntime.js',
          '**/scenes/play/playSceneFlow.js',
          '**/progression/levelUpFlowRuntime.js',
          '**/systems/sound/soundEventHandler.js',
          '**/systems/event/bossAnnouncementHandler.js',
          '**/systems/event/bossPhaseHandler.js',
          '**/systems/event/chestRewardHandler.js',
          '**/systems/event/codexHandler.js',
          '**/systems/event/currencyHandler.js',
          '**/systems/event/weaponEvolutionHandler.js',
          '**/core/Game.js',
          '**/core/runtimeHooks.js',
          '**/scenes/play/PlayResultHandler.js',
        ],
      }],
    },
  },
  {
    files: ['tests/**/*.js', 'scripts/**/*.js'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          '**/scenes/play/playerSpawnRuntime.js',
          '**/scenes/play/playSceneFlow.js',
          '**/progression/levelUpFlowRuntime.js',
        ],
      }],
    },
  },
  {
    files: ['src/domain/**/*.js'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          '**/ui/**',
          '**/renderer/**',
          '**/adapters/browser/**',
          '**/scenes/**',
        ],
      }],
    },
  },
  {
    files: ['src/core/**/*.js'],
    ignores: ['src/core/Game.js', 'src/core/runtimeHooks.js'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          '**/scenes/**',
          '**/ui/**',
          '**/adapters/browser/**',
        ],
      }],
    },
  },
  {
    files: ['src/scenes/**/*.js'],
    ignores: ['src/scenes/sceneLoaders.js'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          '**/systems/**',
          '**/TitleScene.js',
          '**/PlayScene.js',
          '**/MetaShopScene.js',
          '**/SettingsScene.js',
          '**/CodexScene.js',
        ],
      }],
    },
  },
  {
    files: ['src/app/**/*.js'],
    ignores: ['src/app/bootstrap/**/*.js'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          '**/scenes/**',
          '**/state/sessionFacade.js',
        ],
      }],
    },
  },
  {
    files: ['src/domain/meta/progression/playResultDomain.js'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          '**/state/**',
        ],
      }],
    },
  },
  {
    files: ['src/systems/render/RenderSystem.js'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          '**/adapters/browser/**',
        ],
      }],
    },
  },
  {
    files: ['src/systems/sound/soundSfxController.js'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          '**/adapters/browser/**',
        ],
      }],
    },
  },
  {
    files: ['src/core/playContextRuntime.js'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          '**/adapters/browser/**',
        ],
      }],
    },
  },
];
