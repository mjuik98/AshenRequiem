/**
 * src/systems/event/EventRegistry.js
 *
 * CHANGE(P1-A): EVENT_TYPES 자체 선언 제거 → constants/events.js에서 import
 *   Before: EVENT_TYPES를 이 파일 안에 중복 정의
 *           → constants/events.js에 타입 추가 시 이 파일도 수동 동기화 필요
 *           → 두 파일이 실제로 일치하는지 런타임 전까지 검증 불가
 *   After:  단일 진실의 원천(SSOT) — constants/events.js에서 import
 *           → 타입 추가 시 constants/events.js 한 곳만 수정
 *           → re-export로 기존 import 경로 호환성 유지
 *
 * 이전 사용 코드는 변경 없이 동작:
 *   import { EVENT_TYPES } from '../systems/event/EventRegistry.js';  ← 여전히 동작
 */
import { EVENT_TYPES } from '../../data/constants/events.js';

// re-export — 기존 코드 하위 호환
export { EVENT_TYPES };

/** @type {Map<string, Function[]>} */
const _handlers = new Map();

// ── 등록 ─────────────────────────────────────────────────────────────────────

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

// ── 비우기 ────────────────────────────────────────────────────────────────────

/**
 * world.events의 모든 큐를 비운다.
 * EVENT_TYPES 루프로 자동화 — 새 타입 추가 시 constants/events.js만 수정하면 자동 반영.
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

// ── 처리 ─────────────────────────────────────────────────────────────────────

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

// ── 빈 이벤트 객체 생성 ────────────────────────────────────────────────────

/**
 * world.events 초기값을 생성한다.
 * EVENT_TYPES 루프로 자동 생성 — 새 타입 추가 시 자동 반영.
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

// ── Pipeline System 어댑터 ────────────────────────────────────────────────

/**
 * Pipeline에 priority 105로 등록하는 시스템 어댑터.
 */
export const asSystem = {
  update({ world }) {
    processAll(world.events, world);
  },
};

export const EventRegistry = {
  register,
  clearAll,
  processAll,
  createEmptyEvents,
  asSystem,
};
