/**
 * createWorld — 월드 상태 생성
 *
 * 전투 중 실시간으로 변하는 상태를 담는다.
 */
export function createWorld() {
  return {
    time: 0,
    deltaTime: 0,
    elapsedTime: 0,
    killCount: 0,
    /** 'playing' | 'levelup' | 'paused' | 'dead' */
    playMode: 'playing',

    player: null,
    enemies: [],
    projectiles: [],
    pickups: [],
    effects: [],

    spawnQueue: [],
    destroyQueue: [],
    events: {
      hits: [],
      deaths: [],
      pickupCollected: [],
      levelUpRequested: [],
      spawnRequested: [],
    },
  };
}

/**
 * 매 프레임 시작 시 이벤트 배열을 비운다
 */
export function clearFrameEvents(world) {
  world.events.hits.length = 0;
  world.events.deaths.length = 0;
  world.events.pickupCollected.length = 0;
  world.events.levelUpRequested.length = 0;
  world.events.spawnRequested.length = 0;
}
