export default [
  {
    ignores: ['dist/**', 'output/**', 'node_modules/**'],
  },
  {
    files: ['src/**/*.js'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          '**/state/createSessionState.js',
          '**/state/createWorld.js',
          '**/state/startLoadoutRuntime.js',
          '**/state/sessionMeta.js',
          '**/state/session/sessionStorageDriver.js',
          '**/state/session/sessionRecoveryPolicy.js',
          '**/state/session/sessionRepository.js',
          '**/state/session/sessionStorage.js',
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
          '**/core/gameRuntime.js',
          '**/core/gameInputRuntime.js',
          '**/core/gameCanvasRuntime.js',
          '**/core/runtimeHost.js',
          '**/core/runtimeFeatureFlags.js',
          '**/core/runtimeHooks.js',
          '**/scenes/play/PlayResultHandler.js',
          '**/scenes/sceneLoaders.js',
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
    files: ['src/utils/**/*.js', 'src/math/**/*.js', 'src/core/GameConfig.js'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          '**/adapters/browser/**',
        ],
      }],
    },
  },
  {
    files: ['src/core/**/*.js'],
    ignores: [
      'src/core/Game.js',
      'src/core/gameRuntime.js',
      'src/core/gameInputRuntime.js',
      'src/core/gameCanvasRuntime.js',
      'src/core/runtimeHost.js',
      'src/core/runtimeFeatureFlags.js',
      'src/core/runtimeHooks.js',
    ],
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
          '**/scenes/sceneLoaders.js',
        ],
      }],
    },
  },
  {
    files: ['src/app/meta/settingsQueryService.js', 'src/app/meta/settingsCommandService.js'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          '**/adapters/browser/**',
        ],
      }],
    },
  },
  {
    files: [
      'src/app/session/sessionSnapshotPreview.js',
      'src/app/session/sessionSnapshotCodec.js',
      'src/app/session/sessionSnapshotMutationService.js',
    ],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          '**/adapters/browser/**',
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
    files: ['src/systems/debug/PipelineProfiler.js'],
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
  {
    files: ['src/utils/runtimeLogger.js'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          '**/adapters/browser/**',
        ],
      }],
    },
  },
];
