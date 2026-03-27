import { buildPlayRuntime } from '../../core/PlayRuntimeBuilder.js';
import { PlayContext } from '../../core/PlayContext.js';
import { prepareStartRunState } from '../../app/play/startRunApplicationService.js';
import { normalizeSessionOptions } from '../../state/sessionOptions.js';
import { createPlayBrowserRuntimeServices } from '../../adapters/browser/playRuntimeServices.js';
import { mountUI } from '../../ui/dom/mountUI.js';
import { PlayUI } from './PlayUI.js';
import {
  shouldEnablePipelineProfiling,
} from './playSceneRuntime.js';

export function createPlaySceneWorldState({
  session,
  gameData = {},
  prepareStartRunStateImpl = prepareStartRunState,
} = {}) {
  return prepareStartRunStateImpl({
    session,
    gameData,
  }).world;
}

export function bootstrapPlaySceneRuntime({
  game,
  createPlaySceneWorldStateImpl = createPlaySceneWorldState,
  normalizeSessionOptionsImpl = normalizeSessionOptions,
  shouldEnablePipelineProfilingImpl = shouldEnablePipelineProfiling,
  createPlayContextImpl = PlayContext.create,
  mountUiImpl = mountUI,
  createPlayUiImpl = (container) => new PlayUI(container),
  buildPlayRuntimeImpl = buildPlayRuntime,
  createRuntimeServicesImpl = createPlayBrowserRuntimeServices,
} = {}) {
  return buildPlayRuntimeImpl({
    game,
    createWorldStateImpl: createPlaySceneWorldStateImpl,
    normalizeSessionOptionsImpl,
    shouldEnableProfilingImpl: shouldEnablePipelineProfilingImpl,
    createPlayContextImpl,
    mountUiImpl,
    createPlayUiImpl,
    runtimeServices: createRuntimeServicesImpl(),
  });
}
