import { earnCurrency } from '../../state/createSessionState.js';

/**
 * src/systems/event/currencyHandler.js — 통화 적립 이벤트 핸들러
 *
 * BUGFIX: DeathSystem이 currencyEarned를 발행하지만 처리 핸들러가 없던 버그 수정.
 *   Before (버그):
 *     DeathSystem → world.events.currencyEarned.push({ amount })
 *     → PipelineBuilder에 처리 핸들러 없음
 *     → 통화가 전혀 적립되지 않는 침묵 버그
 *
 *   After (수정):
 *     registerCurrencyHandler()를 PipelineBuilder._registerEventHandlers()에 추가
 *     → session은 클로저 내부에서만 참조 (R-14 준수)
 *     → EventRegistry.dispose() 시 자동 정리
 *
 * R-14 원칙: 시스템은 session에 직접 접근하지 않는다.
 *            session 수정은 이벤트 핸들러(PipelineBuilder 등록)가 담당.
 *
 * @param {import('../../state/createSessionState.js').SessionState} session
 * @param {import('./EventRegistry.js').EventRegistry} registry
 */
export function registerCurrencyHandler(session, registry) {
  if (!session || !registry) return;

  registry.register('currencyEarned', (event) => {
    earnCurrency(session, event.amount ?? 0);
  });
}
