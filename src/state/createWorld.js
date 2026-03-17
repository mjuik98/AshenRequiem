/** @see worldTypes.js for WorldState typedef */
/** createWorld — 월드 상태 초기화 */
export function createWorld() {
  return {
    time:        0,
    deltaTime:   0,
    elapsedTime: 0,

    player: null,
    enemies: [],
    projectiles: [],
    effects: [],
    pickups: [],

    // CHANGE(P0-2): EventRegistry를 통한 이벤트 필드 동적 등록
    events: {},

    killCount: 0,
    spawnQueue: [], // SpawnSystem -> FlushSystem 연동

    camera: { x: 0, y: 0, targetX: 0, targetY: 0 },
  };

  EventRegistry.initWorldEvents(world);

  return world;
}

/**
 * 매 프레임 시작 시 이벤트 배열을 비운다.
 * CHANGE(P0-2): EventRegistry.clearAll()로 대체 권장되나, 
 * 하위 호환성을 위해 우선 유지하되 EventRegistry 연동.
 */
export function clearFrameEvents(world) {
  if (!world.events) return;
  EventRegistry.clearAll(world.events);
}
