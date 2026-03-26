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
    files: ['src/scenes/**/*.js'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          '**/systems/**',
        ],
      }],
    },
  },
];
