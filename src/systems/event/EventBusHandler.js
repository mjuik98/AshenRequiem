/**
 * EventBusHandler — 프레임 이벤트 후처리 전담 시스템
 *
 * WHY(P0):
 *   현재 PlayScene._runGamePipeline() 내부에서
 *   world.events.bossPhaseChanged를 직접 순회해 enemy.behaviorId를 바꾸고 있다.
 *
 *   이것은 Scene이 게임 규칙을 직접 처리하는 금지 패턴이다.
 */
export const EventBusHandler = {

  _handlers: new Map([
    [
      'bossPhaseChanged',
      (evt, _ctx) => {
        if (!evt.enemy) return;
        evt.enemy.behaviorId = evt.newBehaviorId;
        console.debug(
          `[BossPhase] ${evt.enemyId} phase ${evt.phaseIndex}: ${evt.announceText ?? ''}`,
        );
      },
    ],
  ]),

  /**
   * @param {object} context  Pipeline context
   * @param {object} context.world
   */
  update(context) {
    const { world } = context;
    if (!world?.events) return;

    const bossEvts = world.events.bossPhaseChanged;
    if (bossEvts?.length) {
      const handler = this._handlers.get('bossPhaseChanged');
      for (let i = 0; i < bossEvts.length; i++) {
        handler(bossEvts[i], context);
      }
    }
  },

  register(eventType, handler) {
    if (this._handlers.has(eventType)) {
      console.warn(`[EventBusHandler] 이미 등록된 이벤트 타입을 덮어씁니다: "${eventType}"`);
    }
    this._handlers.set(eventType, handler);
  },
};
