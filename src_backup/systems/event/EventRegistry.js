/**
 * src/systems/event/EventRegistry.js
 *
 * CHANGE(P1): processAll()에서 clearAll() 제거 — 이벤트 큐 초기화 SSOT 확립
 */

import { EVENT_TYPES } from '../../data/constants/events.js';

export { EVENT_TYPES };

export class EventRegistry {
  constructor() {
    /** @type {Map<string, Function[]>} */
    this._handlers = new Map();
  }

  // ── 등록 ─────────────────────────────────────────────────────────────

  /**
   * 이벤트 핸들러를 등록한다.
   * @param {string}   eventType  EVENT_TYPES 중 하나
   * @param {Function} handlerFn  (event, world) => void
   */
  register(eventType, handlerFn) {
    if (!EVENT_TYPES.includes(eventType)) {
      console.warn(`[EventRegistry] 알 수 없는 이벤트 타입: "${eventType}"`);
    }
    if (!this._handlers.has(eventType)) this._handlers.set(eventType, []);
    this._handlers.get(eventType).push(handlerFn);
  }

  // ── 비우기 ────────────────────────────────────────────────────────────

  /**
   * world.events의 모든 큐를 비운다.
   * WorldTickSystem(priority 0)이 프레임 시작 시 호출한다.
   * @param {object} events  world.events
   */
  clearAll(events) {
    for (const type of EVENT_TYPES) {
      if (Array.isArray(events[type])) events[type].length = 0;
    }
  }

  // ── 처리 ─────────────────────────────────────────────────────────────

  /**
   * 등록된 핸들러를 실행한다.
   *
   * CHANGE(P1): clearAll() 제거 — WorldTickSystem(priority 0)이 초기화 단독 담당.
   * @param {object} events  world.events
   * @param {object} world
   */
  processAll(events, world) {
    for (const type of EVENT_TYPES) {
      const queue    = events[type];
      const handlers = this._handlers.get(type);
      if (!handlers || !Array.isArray(queue) || queue.length === 0) continue;
      for (const event of queue) {
        for (const fn of handlers) fn(event, world);
      }
    }
    // clearAll(events) 제거 — WorldTickSystem(priority 0)이 다음 프레임 시작 시 초기화
  }

  // ── 빈 이벤트 객체 생성 ────────────────────────────────────────────────

  /**
   * world.events 초기값을 생성한다.
   * @returns {object}
   */
  createEmptyEvents() {
    const events = {};
    for (const type of EVENT_TYPES) events[type] = [];
    return events;
  }

  // ── Pipeline System 어댑터 ────────────────────────────────────────────

  /**
   * Pipeline에 priority 105로 등록하기 위한 시스템 어댑터 객체를 반환한다.
   * @returns {{ update: Function }}
   */
  asSystem() {
    return {
      update: ({ world }) => this.processAll(world.events, world),
    };
  }

  // ── 해제 ──────────────────────────────────────────────────────────────

  /**
   * 모든 핸들러를 제거한다. PlayContext.dispose() 시 호출.
   */
  dispose() {
    this._handlers.clear();
  }
}
