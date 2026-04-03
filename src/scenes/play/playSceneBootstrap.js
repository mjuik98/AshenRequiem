import { PlayContext } from '../../core/PlayContext.js';
import { prepareStartRunState } from '../../app/play/startRunApplicationService.js';
import { normalizeSessionOptions } from '../../state/sessionOptions.js';
import { createPlayBrowserRuntimeServices } from '../../adapters/browser/playRuntimeServices.js';
import { buildPlayRuntime } from './playRuntimeComposer.js';
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
  mountUiImpl = undefined,
  createPlayUiImpl = undefined,
  buildPlayRuntimeImpl = buildPlayRuntime,
  createRuntimeServicesImpl = createPlayBrowserRuntimeServices,
} = {}) {
  const runtimeServices = createRuntimeServicesImpl({
    host: game?.runtimeHost ?? globalThis,
    accessibilityRuntime: game?.accessibilityRuntime ?? null,
  });
  const runtime = buildPlayRuntimeImpl({
    game,
    createWorldStateImpl: createPlaySceneWorldStateImpl,
    normalizeSessionOptionsImpl,
    shouldEnableProfilingImpl: shouldEnablePipelineProfilingImpl,
    createPlayContextImpl,
    ...(typeof mountUiImpl === 'function' ? { mountUiImpl } : {}),
    ...(typeof createPlayUiImpl === 'function' ? { createPlayUiImpl } : {}),
    runtimeServices,
  });
  runtime.accessibilityRuntime = runtimeServices.accessibilityRuntime ?? null;
  runtime.devicePixelRatioReader = runtimeServices.devicePixelRatioReader ?? (() => 1);
  return runtime;
}
