import { createPlayWorld } from '../../domain/play/state/createPlayWorld.js';
import { createPlayer } from '../../entities/createPlayer.js';
import {
  applyPlayerArchetype,
  applyPlayerPermanentUpgrades,
  applyPlayerRiskRelic,
  applyPlayerStartAccessories,
  resolvePlayerSpawnState,
} from './playerSpawnApplicationService.js';
import { restoreActiveRunSnapshot } from './activeRunApplicationService.js';
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
  applyArchetypeImpl = applyPlayerArchetype,
  applyRiskRelicImpl = applyPlayerRiskRelic,
  applyStartAccessoriesImpl = applyPlayerStartAccessories,
  applyPermanentUpgradesImpl = applyPlayerPermanentUpgrades,
  initializeRunStateImpl = applyRunSessionState,
  queueStartEventsImpl = queueRunStartEvents,
  restoreActiveRunSnapshotImpl = restoreActiveRunSnapshot,
} = {}) {
  const world = createWorldImpl();
  const playerSpawnState = buildPlayerSpawnStateImpl(session, gameData);
  const player = createPlayerImpl(0, 0, playerSpawnState);

  world.runtime ??= {};
  world.run ??= {};
  world.entities ??= {};
  world.entities.player = player;
  if (playerSpawnState.rng) {
    world.runtime.rng = playerSpawnState.rng;
  }
  world.run.ascensionLevel = playerSpawnState.selectedAscensionLevel ?? 0;
  world.run.ascension = playerSpawnState.ascension ?? { level: world.run.ascensionLevel };
  world.run.archetypeId = playerSpawnState.selectedArchetypeId ?? 'vanguard';
  world.run.archetype = playerSpawnState.archetype ?? { id: world.run.archetypeId };
  world.run.riskRelicId = playerSpawnState.selectedRiskRelicId ?? null;
  world.run.riskRelic = playerSpawnState.riskRelic ?? null;
  world.run.stageId = playerSpawnState.selectedStageId ?? 'ash_plains';
  world.run.stage = playerSpawnState.stage ?? { id: world.run.stageId };
  world.run.seedMode = playerSpawnState.seedMode ?? 'none';
  world.run.seedLabel = playerSpawnState.seedLabel ?? '';

  if (session?.activeRun) {
    initializeRunStateImpl(world, session);
    restoreActiveRunSnapshotImpl(world, player, session.activeRun);
  } else {
    applyArchetypeImpl(player, playerSpawnState.archetype ?? null);
    applyRiskRelicImpl(player, playerSpawnState.riskRelic ?? null);
    applyStartAccessoriesImpl(player, playerSpawnState.startAccessories ?? []);
    applyPermanentUpgradesImpl(player, playerSpawnState.permanentUpgrades);
    initializeRunStateImpl(world, session);
    queueStartEventsImpl(world, player);
  }

  return {
    world,
    player,
    playerSpawnState,
  };
}
