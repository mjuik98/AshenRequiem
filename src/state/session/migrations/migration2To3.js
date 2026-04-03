import { SESSION_OPTION_DEFAULTS } from '../../sessionOptions.js';

export const migration2To3 = {
  from: 2,
  migrate(sessionState) {
    return {
      ...sessionState,
      _version: 3,
      options: {
        ...SESSION_OPTION_DEFAULTS,
        ...sessionState.options,
      },
    };
  },
};
