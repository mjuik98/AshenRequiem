import { PlayContext } from './PlayContext.js';
import { normalizeSessionOptions } from '../state/sessionOptions.js';

export function buildPlayRuntime({
  game,
  createWorldStateImpl,
  normalizeSessionOptionsImpl = normalizeSessionOptions,
  shouldEnableProfilingImpl = () => false,
  createPlayContextImpl = PlayContext.create,
  mountUiImpl,
  createPlayUiImpl,
  registerEventHandlersImpl = null,
  runtimeServices = null,
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
    ...(registerEventHandlersImpl ? { registerEventHandlersImpl } : {}),
    ...(runtimeServices ?? {}),
  });
  if (typeof mountUiImpl !== 'function') {
    throw new Error('buildPlayRuntime requires mountUiImpl to be provided by the scene/bootstrap boundary.');
  }
  if (typeof createPlayUiImpl !== 'function') {
    throw new Error('buildPlayRuntime requires createPlayUiImpl to be provided by the scene/bootstrap boundary.');
  }
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
