/**
 * src/systems/event/eventHandlerRegistry.js — 이벤트 핸들러 등록 레지스트리 (P3)
 */

/** @type {Array<(services: object, registry: import('./EventRegistry.js').EventRegistry, session: object) => void>} */
const _handlers = [];

/**
 * 이벤트 핸들러 등록 함수를 레지스트리에 추가한다.
 *
 * @param {(services: object, registry: object, session: object) => void} registerFn
 */
export function addEventHandler(registerFn) {
  if (typeof registerFn !== 'function') {
    console.warn('[eventHandlerRegistry] registerFn은 함수여야 합니다.');
    return;
  }
  _handlers.push(registerFn);
}

/**
 * 등록된 모든 핸들러 등록 함수 목록을 반환한다.
 * PipelineBuilder._registerEventHandlers()에서 순회하여 일괄 실행한다.
 *
 * @returns {Array<Function>}
 */
export function getEventHandlers() {
  return _handlers.slice();
}

/**
 * 레지스트리를 초기화한다. (테스트 격리용)
 */
export function clearEventHandlers() {
  _handlers.length = 0;
}
