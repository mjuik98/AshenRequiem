import { PlayContext } from '../../core/PlayContext.js';
import { createPlayer } from '../../entities/createPlayer.js';
import { createWorld } from '../../state/createWorld.js';
import { normalizeSessionOptions } from '../../state/sessionOptions.js';
import { mountUI } from '../../ui/dom/mountUI.js';
import { PlayUI } from './PlayUI.js';
import {
  applyRunSessionState,
  shouldEnablePipelineProfiling,
} from './playSceneRuntime.js';

export function createPlaySceneWorldState({
  session,
  createWorldImpl = createWorld,
  createPlayerImpl = createPlayer,
  applyRunSessionStateImpl = applyRunSessionState,
} = {}) {
  const world = createWorldImpl();
  world.player = createPlayerImpl(0, 0, session);
  applyRunSessionStateImpl(world, session);
  return world;
}

export function bootstrapPlaySceneRuntime({
  game,
  createPlaySceneWorldStateImpl = createPlaySceneWorldState,
  normalizeSessionOptionsImpl = normalizeSessionOptions,
  shouldEnablePipelineProfilingImpl = shouldEnablePipelineProfiling,
  createPlayContextImpl = PlayContext.create,
  mountUiImpl = mountUI,
  createPlayUiImpl = (container) => new PlayUI(container),
} = {}) {
  const session = game?.session ?? null;
  const world = createPlaySceneWorldStateImpl({ session });
  const gameData = game?.gameData ?? {};
  const options = normalizeSessionOptionsImpl(session?.options);
  const ctx = createPlayContextImpl({
    canvas: game?.canvas,
    renderer: game?.renderer ?? null,
    soundEnabled: options.soundEnabled ?? true,
    profilingEnabled: shouldEnablePipelineProfilingImpl(),
    session,
  });
  const ui = createPlayUiImpl(mountUiImpl());

  ui.showHud();
  ctx.setAnnouncementViews(
    ui.getBossAnnouncementView(),
    ui.getWeaponEvolutionView(),
  );

  const { pipeline, pipelineCtx, systems } = ctx.buildPipeline(
    world,
    game?.input,
    gameData,
  );

  return {
    world,
    gameData,
    ctx,
    ui,
    pipeline,
    pipelineCtx,
    systems,
  };
}
