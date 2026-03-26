import { ensureCodexMeta, reconcileSessionUnlocks } from '../../state/sessionMeta.js';

export function prepareCodexSceneState({ session, gameData } = {}) {
  ensureCodexMeta(session);
  reconcileSessionUnlocks(session);

  return {
    session,
    gameData,
  };
}
