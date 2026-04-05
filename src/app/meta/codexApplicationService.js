import { prepareCodexSessionState } from '../session/codexSessionStateService.js';

export function prepareCodexSceneState({ session, gameData } = {}) {
  return {
    session: prepareCodexSessionState(session),
    gameData,
  };
}
