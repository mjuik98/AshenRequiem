/**
 * src/systems/event/EventRegistry.js
 *
 * P0-② 개선: clearAll 수동 나열 → EVENT_TYPES 루프 자동화
 *
 * Before:
 *   clearAll() 내부에 hits, deaths, pickupCollected, ... 를 수동 나열.
 *   새 이벤트 타입 추가 시 clearAll 목록에 추가를 잊으면
 *   이벤트 큐가 프레임 간 누적되어 중복 처리 버그가 발생한다.
 *
 * After:
 *   EVENT_TYPES 상수 배열을 단일 진실의 원천으로 삼고,
 *   clearAll / createEmptyEvents 모두 이 배열을 루프로 처리한다.
 *   새 이벤트 타입 추가 = EVENT_TYPES에 문자열 1개 추가.
 */

// ── 이벤트 타입 목록 (단일 진실의 원천) ────────────────────────────────
export const EVENT_TYPES = [
  'hits',
  'deaths',
  'pickupCollected',
  'levelUpRequested',
  'statusApplied',
  'bossPhaseChanged',
  'spawnRequested',
];

// ── 핸들러 저장소 ────────────────────────────────────────────────────────
/** @type {Map<string, Function[]>} */
const _handlers = new Map();

// ── 등록 ─────────────────────────────────────────────────────────────────

/**
 * 이벤트 핸들러를 등록한다.
 * @param {string}   eventType  EVENT_TYPES 중 하나
 * @param {Function} handlerFn  (event, world) => void
 */
export function register(eventType, handlerFn) {
  if (!EVENT_TYPES.includes(eventType)) {
    console.warn(`[EventRegistry] 알 수 없는 이벤트 타입: "${eventType}"`);
  }
  if (!_handlers.has(eventType)) _handlers.set(eventType, []);
  _handlers.get(eventType).push(handlerFn);
}

// ── 비우기 ────────────────────────────────────────────────────────────────

/**
 * world.events 의 모든 큐를 비운다.
 * Pipeline priority 105에서 EventRegistry.asSystem.update() 가 호출한다.
 *
 * Before(수동 나열):
 *   events.hits = [];
 *   events.deaths = [];
 *   events.pickupCollected = [];
 *   // ... 추가할 때마다 여기도 수동으로 추가해야 했음
 *
 * After(자동):
 *   EVENT_TYPES 루프로 처리 — 목록에 추가하면 자동 반영.
 *
 * @param {object} events  world.events
 */
export function clearAll(events) {
  for (const type of EVENT_TYPES) {
    if (Array.isArray(events[type])) {
      events[type].length = 0;
    }
  }
}

// ── 처리 ─────────────────────────────────────────────────────────────────

/**
 * 등록된 핸들러를 실행하고 큐를 비운다.
 * @param {object} events  world.events
 * @param {object} world
 */
export function processAll(events, world) {
  for (const type of EVENT_TYPES) {
    const queue    = events[type];
    const handlers = _handlers.get(type);
    if (!handlers || !Array.isArray(queue) || queue.length === 0) continue;

    for (const event of queue) {
      for (const fn of handlers) {
        fn(event, world);
      }
    }
  }
  clearAll(events);
}

// ── 빈 이벤트 객체 생성 ────────────────────────────────────────────────

/**
 * world.events 초기값을 생성한다.
 * createWorld.js 에서 호출.
 *
 * Before: 수동으로 각 배열 선언
 * After:  EVENT_TYPES 루프로 자동 생성 — 새 타입 추가 시 여기도 자동 반영.
 *
 * @returns {object}
 */
export function createEmptyEvents() {
  const events = {};
  for (const type of EVENT_TYPES) {
    events[type] = [];
  }
  return events;
}

// ── Pipeline System 어댑터 ────────────────────────────────────────────

/**
 * Pipeline에 priority 105로 등록하는 시스템 어댑터.
 * PlayContext.buildPipeline() 에서:
 *   pipeline.register(EventRegistry.asSystem, 105);
 */
export const asSystem = {
  update({ world }) {
    processAll(world.events, world);
  },
};
