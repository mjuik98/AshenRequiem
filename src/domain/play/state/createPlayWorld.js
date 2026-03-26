import { EVENT_TYPES } from '../../../data/constants/events.js';
import { createSynergyState } from '../../../state/createSynergyState.js';
import { createRng } from '../../../utils/random.js';

function createEventQueues() {
  const events = {};
  for (const type of EVENT_TYPES) events[type] = [];
  return events;
}

export function createPlayWorld() {
  const entities = {
    player: null,
    enemies: [],
    projectiles: [],
    effects: [],
    pickups: [],
  };
  const events = createEventQueues();
  const queues = {
    events,
    spawnQueue: [],
  };
  const presentation = {
    camera: { x: 0, y: 0, targetX: 0, targetY: 0 },
  };
  const runtime = {
    rng: createRng(),
    deltaTime: 0,
  };
  const run = {
    elapsedTime: 0,
    killCount: 0,
    runCurrencyEarned: 0,
    bossKillCount: 0,
    playMode: 'playing',
    runOutcome: null,
  };
  const progression = {
    pendingUpgrade: null,
    pendingLevelUpChoices: null,
    pendingEventQueue: null,
    runRerollsRemaining: 0,
    runBanishesRemaining: 0,
    banishedUpgradeIds: [],
    levelUpActionMode: 'select',
    pendingLevelUpType: null,
    chestRewardQueue: 0,
    synergyState: createSynergyState(),
  };

  const world = {
    entities,
    queues,
    presentation,
    runtime,
    run,
    progression,
  };

  return world;
}
