import { PlayContext } from '../../core/PlayContext.js';
import { prepareStartRunState } from '../../app/play/startRunApplicationService.js';
import { normalizeSessionOptions } from '../../state/sessionOptions.js';
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

export function resolvePlaySceneRuntimeServices(game) {
  return game?.playRuntimeServices ?? null;
}

export function resolvePlaySceneEventHandlers(game) {
  return game?.registerPlayEventHandlers ?? null;
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
  resolveRuntimeServicesImpl = resolvePlaySceneRuntimeServices,
  resolveEventHandlersImpl = resolvePlaySceneEventHandlers,
} = {}) {
  const runtimeServices = resolveRuntimeServicesImpl(game) ?? null;
  const registerEventHandlersImpl = resolveEventHandlersImpl(game) ?? null;
  const runtime = buildPlayRuntimeImpl({
    game,
    createWorldStateImpl: createPlaySceneWorldStateImpl,
    normalizeSessionOptionsImpl,
    shouldEnableProfilingImpl: shouldEnablePipelineProfilingImpl,
    createPlayContextImpl,
    ...(typeof mountUiImpl === 'function' ? { mountUiImpl } : {}),
    ...(typeof createPlayUiImpl === 'function' ? { createPlayUiImpl } : {}),
    ...(registerEventHandlersImpl ? { registerEventHandlersImpl } : {}),
    runtimeServices,
  });
  runtime.accessibilityRuntime = runtimeServices?.accessibilityRuntime ?? null;
  runtime.devicePixelRatioReader = runtimeServices?.devicePixelRatioReader ?? (() => 1);
  return runtime;
}
