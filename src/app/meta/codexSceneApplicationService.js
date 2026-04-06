import { prepareCodexSceneState } from './codexApplicationService.js';

export function createCodexSceneApplicationService({ session, gameData } = {}) {
  function getViewPayload() {
    return prepareCodexSceneState({ session, gameData });
  }

  return {
    getViewPayload,
  };
}
