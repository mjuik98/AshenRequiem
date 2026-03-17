import { EVENT_TYPES } from '../data/constants.js';

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

    // FIX(BUG-A): EVENT_TYPES 기반으로 각 이벤트 배열을 createWorld 단계에서 초기화.
    events: EVENT_TYPES.reduce((acc, t) => { acc[t] = []; return acc; }, {}),

    killCount: 0,
    playMode:  'playing',
    spawnQueue: [], // SpawnSystem -> FlushSystem 연동

    camera: { x: 0, y: 0, targetX: 0, targetY: 0 },
  };
}
