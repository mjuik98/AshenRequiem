import { SESSION_OPTION_DEFAULTS } from '../../sessionOptions.js';

export const migration0To1 = {
  from: 0,
  migrate(sessionState) {
    return {
      ...sessionState,
      _version: 1,
      best: {
        kills: sessionState.best?.kills ?? sessionState.best?.killCount ?? 0,
        survivalTime: sessionState.best?.survivalTime ?? sessionState.best?.elapsedTime ?? 0,
        level: sessionState.best?.level ?? sessionState.best?.playerLevel ?? 1,
      },
      meta: {
        currency: sessionState.meta?.currency ?? 0,
        permanentUpgrades: sessionState.meta?.permanentUpgrades ?? {},
      },
      options: {
        ...SESSION_OPTION_DEFAULTS,
        soundEnabled: sessionState.options?.soundEnabled ?? sessionState.options?.soundOn ?? SESSION_OPTION_DEFAULTS.soundEnabled,
        musicEnabled: sessionState.options?.musicEnabled ?? SESSION_OPTION_DEFAULTS.musicEnabled,
        showFps: sessionState.options?.showFps ?? SESSION_OPTION_DEFAULTS.showFps,
      },
    };
  },
};
