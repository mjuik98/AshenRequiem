/**
 * src/systems/event/EventRegistry.js
 *
 * CHANGE(P2-④): EVENT_TYPES 상수 기반으로 clearAll 자동화
 *   Before: clearAll(events)에서 각 타입을 수동으로 나열
 *           → 새 이벤트 타입 추가 시 createWorld.js + EventRegistry 두 곳 수동 동기화
 *   After:  constants.js의 EVENT_TYPES를 import해 루프 처리
 *           → 새 이벤트 타입 = EVENT_TYPES 배열에 1줄 추가만
 *
 * 사용 방법:
 *   EventRegistry.register('hits', handler)  — 핸들러 등록
 *   EventRegistry.processAll(events)         — 파이프라인 priority 105에서 실행
 *   EventRegistry.clearAll(events)           — 프레임 후 이벤트 큐 초기화
 */

import { EVENT_TYPES } from '../../data/constants.js';

/** @type {Map<string, Function[]>} */
const _handlers = new Map();

export const EventRegistry = {
  /**
   * 이벤트 타입에 핸들러 함수를 등록한다.
   *
   * @param {string}   eventType  EVENT_TYPES 중 하나
   * @param {Function} handler    (eventPayload) => void
   */
  register(eventType, handler) {
    if (!EVENT_TYPES.includes(eventType)) {
      console.warn(`[EventRegistry] 알 수 없는 이벤트 타입: "${eventType}". constants.js의 EVENT_TYPES에 추가하세요.`);
    }
    if (!_handlers.has(eventType)) _handlers.set(eventType, []);
    _handlers.get(eventType).push(handler);
  },

  /**
   * 등록된 모든 핸들러를 현재 프레임의 이벤트 큐로 실행한다.
   * 파이프라인 priority 105 (EventRegistry asSystem)에서 호출됨.
   *
   * @param {object} events  world.events
   */
  processAll(events) {
    for (const eventType of EVENT_TYPES) {
      const queue = events[eventType];
      if (!queue || queue.length === 0) continue;

      const handlers = _handlers.get(eventType);
      if (!handlers || handlers.length === 0) continue;

      for (let i = 0; i < queue.length; i++) {
        for (let h = 0; h < handlers.length; h++) {
          try {
            handlers[h](queue[i]);
          } catch (e) {
            console.error(`[EventRegistry] "${eventType}" 핸들러 오류:`, e);
          }
        }
      }
    }
  },

  /**
   * 프레임 내 이벤트 큐를 모두 비운다.
   *
   * CHANGE(P2-④): EVENT_TYPES 루프로 자동화
   *   Before: events.hits.length = 0; events.deaths.length = 0; ... (수동 나열)
   *   After:  EVENT_TYPES.forEach 루프
   *
   * @param {object} events  world.events
   */
  clearAll(events) {
    for (const eventType of EVENT_TYPES) {
      if (events[eventType]) events[eventType].length = 0;
    }
  },

  /**
   * Pipeline.run() 호환용 update 메서드.
   * priority 105에 등록해 사용.
   *
   * @param {{ world: { events: object } }} ctx
   */
  update(ctx) {
    this.processAll(ctx.world.events);
    this.clearAll(ctx.world.events);
  },

  /** 등록된 모든 핸들러를 제거한다. (테스트 초기화용) */
  reset() {
    _handlers.clear();
  },

  /** 현재 등록된 핸들러 목록 반환 (디버그용) */
  inspect() {
    return Object.fromEntries(
      [..._handlers.entries()].map(([type, handlers]) => [type, handlers.length])
    );
  },
};
