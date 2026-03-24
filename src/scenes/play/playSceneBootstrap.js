import { PlayContext } from '../../core/PlayContext.js';
import { createPlayer } from '../../entities/createPlayer.js';
import { createWorld } from '../../state/createWorld.js';
import { normalizeSessionOptions } from '../../state/sessionOptions.js';
import { mountUI } from '../../ui/dom/mountUI.js';
import { PlayUI } from './PlayUI.js';
import {
  applyRunSessionState,
  queueRunStartEvents,
  shouldEnablePipelineProfiling,
} from './playSceneRuntime.js';
import {
  applyPlayerPermanentUpgrades,
  resolvePlayerSpawnState,
} from './playerSpawnRuntime.js';

export function createPlaySceneWorldState({
  session,
  gameData = {},
  createWorldImpl = createWorld,
  createPlayerImpl = createPlayer,
  applyRunSessionStateImpl = applyRunSessionState,
  resolvePlayerSpawnStateImpl = resolvePlayerSpawnState,
  applyPlayerPermanentUpgradesImpl = applyPlayerPermanentUpgrades,
} = {}) {
  const world = createWorldImpl();
  const playerSpawnState = resolvePlayerSpawnStateImpl(session, gameData);
  world.player = createPlayerImpl(0, 0, playerSpawnState);
  applyPlayerPermanentUpgradesImpl(world.player, playerSpawnState.permanentUpgrades);
  applyRunSessionStateImpl(world, session);
  queueRunStartEvents(world, world.player);
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
  const gameData = game?.gameData ?? {};
  const world = createPlaySceneWorldStateImpl({ session, gameData });
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
