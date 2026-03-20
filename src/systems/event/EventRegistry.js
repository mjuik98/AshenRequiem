/**
 * src/systems/event/EventRegistry.js
 *
 * REFACTOR: 모듈 레벨 싱글턴 → 인스턴스 기반 클래스 (메모리 누수 수정)
 *
 * Before (버그):
 *   const _handlers = new Map(); // 모듈 레벨 상태
 *   PipelineBuilder._registerEventHandlers() 호출마다 핸들러가 push만 됨
 *   PlayScene 2회 재시작 → 보스 페이즈 알림 3번 발생, 사운드 3중 재생
 *
 * After:
 *   PlayContext가 new EventRegistry() 소유
 *   PlayContext.dispose() 시 GC에 의해 자동 정리
 *   → 재시작마다 완전히 새로운 핸들러 세트 보장
 *
 * CHANGE(SSOT): EVENT_TYPES는 constants/events.js에서 단일 관리 (기존 유지)
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
   * @param {object} events  world.events
   */
  clearAll(events) {
    for (const type of EVENT_TYPES) {
      if (Array.isArray(events[type])) events[type].length = 0;
    }
  }

  // ── 처리 ─────────────────────────────────────────────────────────────

  /**
   * 등록된 핸들러를 실행하고 큐를 비운다.
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
    this.clearAll(events);
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
   * 인스턴스 메서드이므로 this가 올바르게 바인딩됨.
   *
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
