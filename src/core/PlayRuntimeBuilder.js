import { PlayContext } from './PlayContext.js';
import { normalizeSessionOptions } from '../state/sessionOptions.js';
import { mountUI } from '../ui/dom/mountUI.js';
import { PlayUI } from '../scenes/play/PlayUI.js';
import { shouldEnablePipelineProfiling } from '../scenes/play/playSceneRuntime.js';

export function buildPlayRuntime({
  game,
  createWorldStateImpl,
  normalizeSessionOptionsImpl = normalizeSessionOptions,
  shouldEnableProfilingImpl = shouldEnablePipelineProfiling,
  createPlayContextImpl = PlayContext.create,
  mountUiImpl = mountUI,
  createPlayUiImpl = (container) => new PlayUI(container),
} = {}) {
  const session = game?.session ?? null;
  const gameData = game?.gameData ?? {};
  const world = createWorldStateImpl({ session, gameData });
  const options = normalizeSessionOptionsImpl(session?.options);
  const ctx = createPlayContextImpl({
    canvas: game?.canvas,
    renderer: game?.renderer ?? null,
    soundEnabled: options.soundEnabled ?? true,
    profilingEnabled: shouldEnableProfilingImpl(),
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
