/**
 * src/systems/event/EventRegistry.js
 *
 * CHANGE(P2-④): EVENT_TYPES 상수 기반으로 clearAll 자동화
 *
 * FIX(BUG-E): asSystem() 메서드 누락
 *   Before: EventRegistry.asSystem()이 정의되지 않아
 *           PlayContext.buildPipeline() 호출 시
 *           TypeError: EventRegistry.asSystem is not a function 발생
 *   After:  asSystem()을 추가 — EventRegistry 자신을 Pipeline 어댑터로 반환
 *           Pipeline은 { update(ctx) } 인터페이스만 요구하므로
 *           EventRegistry 자체가 해당 인터페이스를 충족함
 */

import { EVENT_TYPES } from '../../data/constants.js';

/** @type {Map<string, Function[]>} */
const _handlers = new Map();

export const EventRegistry = {
  /**
   * 이벤트 타입에 핸들러 함수를 등록한다.
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
   * CHANGE(P2-④): EVENT_TYPES 루프로 자동화
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
   * @param {{ world: { events: object } }} ctx
   */
  update(ctx) {
    this.processAll(ctx.world.events);
    this.clearAll(ctx.world.events);
  },

  /**
   * FIX(BUG-E): Pipeline 등록 어댑터 메서드 추가
   *
   * PlayContext.buildPipeline()이 pipeline.register(EventRegistry.asSystem(), ...)
   * 형태로 호출하므로 Pipeline이 기대하는 { update(ctx) } 인터페이스를 가진
   * 객체를 반환해야 한다.
   *
   * EventRegistry 자체가 update(ctx)를 갖고 있으므로 this를 반환하면 충분하나,
   * 메서드 컨텍스트(this) 바인딩이 끊기지 않도록 래퍼 객체를 반환한다.
   *
   * @returns {{ update: (ctx: object) => void }}
   */
  asSystem() {
    return {
      update: (ctx) => this.update(ctx),
    };
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
