import { createPlayWorld } from '../../domain/play/state/createPlayWorld.js';
import { createPlayer } from '../../entities/createPlayer.js';
import {
  applyPlayerPermanentUpgrades,
  resolvePlayerSpawnState,
} from '../../scenes/play/playerSpawnRuntime.js';
import {
  applyRunSessionState,
  queueRunStartEvents,
} from '../../scenes/play/playSceneRuntime.js';

export function prepareStartRunState({
  session = null,
  gameData = {},
  createWorldImpl = createPlayWorld,
  buildPlayerSpawnStateImpl = resolvePlayerSpawnState,
  createPlayerImpl = createPlayer,
  applyPermanentUpgradesImpl = applyPlayerPermanentUpgrades,
  initializeRunStateImpl = applyRunSessionState,
  queueStartEventsImpl = queueRunStartEvents,
} = {}) {
  const world = createWorldImpl();
  const playerSpawnState = buildPlayerSpawnStateImpl(session, gameData);
  const player = createPlayerImpl(0, 0, playerSpawnState);

  world.entities.player = player;
  applyPermanentUpgradesImpl(player, playerSpawnState.permanentUpgrades);
  initializeRunStateImpl(world, session);
  queueStartEventsImpl(world, player);

  return {
    world,
    player,
    playerSpawnState,
  };
}
