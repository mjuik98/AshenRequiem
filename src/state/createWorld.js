export function createWorld() {
  return {
    time: 0, deltaTime: 0, elapsedTime: 0, killCount: 0,
    playMode: 'playing',
    player: null,
    enemies: [], projectiles: [], pickups: [], effects: [],
    spawnQueue: [], destroyQueue: [],
    events: {
      hits: [], deaths: [], pickupCollected: [],
      levelUpRequested: [], spawnRequested: [],
    },
  };
}

export function clearFrameEvents(world) {
  world.events.hits.length = 0;
  world.events.deaths.length = 0;
  world.events.pickupCollected.length = 0;
  world.events.levelUpRequested.length = 0;
  world.events.spawnRequested.length = 0;
}
