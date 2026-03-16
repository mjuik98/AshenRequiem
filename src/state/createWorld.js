/** createWorld — 월드 상태 초기화 */
export function createWorld() {
  return {
    time:        0,
    deltaTime:   0,
    elapsedTime: 0,
    killCount:   0,
    /** 'playing' | 'levelup' | 'dead' */
    playMode:    'playing',

    player:      null,
    enemies:     [],
    projectiles: [],
    pickups:     [],
    effects:     [],

    spawnQueue:    [],
    destroyQueue:  [],

    events: {
      hits:             [],
      deaths:           [],
      pickupCollected:  [],
      levelUpRequested: [],
    },
  };
}

/** 프레임 이벤트 배열 초기화 (매 프레임 시작 시 호출) */
export function clearFrameEvents(world) {
  world.events.hits.length            = 0;
  world.events.deaths.length          = 0;
  world.events.pickupCollected.length = 0;
  world.events.levelUpRequested.length= 0;
}
