/**
 * EventRegistry — 프레임 이벤트 동적 등록 & 후처리 시스템
 *
 * WHY (P0-2):
 *   기존 EventBusHandler는 bossPhaseChanged 하나만 하드코딩됨.
 *   상태이상(statusApplied), 보스 연출(bossAnnounce), 콤보(comboHit) 등
 *   이벤트 종류가 늘면 핸들러가 if-else로 비대해지고,
 *   clearFrameEvents()와 createWorld()를 동시에 수정해야 한다.
 *
 *   이 모듈은 세 가지를 한 곳에서 관리한다:
 *     1. world.events 필드를 동적으로 등록
 *     2. clearFrameEvents() 대상 자동 포함
 *     3. 핸들러 등록 및 프레임 후처리 실행
 *
 * 사용법:
 *
 *   // Game 초기화 시
 *   EventRegistry.register('bossPhaseChanged', (evt, ctx) => {
 *     if (!evt.enemy) return;
 *     evt.enemy.behaviorId = evt.newBehaviorId;
 *   });
 *
 *   EventRegistry.register('statusApplied', (evt, ctx) => {
 *     evt.target.statusEffects.push(evt.effect);
 *   });
 *
 *   // createWorld()에서
 *   const world = createWorld();
 *   EventRegistry.initWorldEvents(world);   // 등록된 이벤트 배열 자동 생성
 *
 *   // clearFrameEvents()에서 (또는 Pipeline 시작 시)
 *   EventRegistry.clearAll(world.events);
 *
 *   // Pipeline 시스템으로 등록
 *   pipeline.register(EventRegistry.asSystem(), { priority: 105 });
 *
 * 계약:
 *   - 입력: world.events (프레임 이벤트 배열들)
 *   - 읽기: 등록된 핸들러 목록
 *   - 쓰기: world 내 엔티티 상태 (핸들러 내부에서만)
 *   - 출력: 없음 (사이드이펙트만)
 */

/** @type {Map<string, (evt: object, ctx: object) => void>} */
const _handlers = new Map();

/** @type {Set<string>} */
const _eventTypes = new Set();

export const EventRegistry = {

  /**
   * 새 이벤트 타입과 핸들러를 등록한다.
   * 같은 타입을 두 번 등록하면 덮어쓴다 (경고 포함).
   *
   * @param {string}   eventType  world.events 의 키 이름 (e.g. 'bossPhaseChanged')
   * @param {Function} handler    (evt, pipelineContext) => void
   */
  register(eventType, handler) {
    if (typeof handler !== 'function') {
      console.error(`[EventRegistry] 핸들러가 함수가 아닙니다: "${eventType}"`);
      return;
    }
    if (_handlers.has(eventType)) {
      console.warn(`[EventRegistry] 이벤트 타입 덮어쓰기: "${eventType}"`);
    }
    _handlers.set(eventType, handler);
    _eventTypes.add(eventType);
  },

  /**
   * world.events 에 등록된 이벤트 타입별 빈 배열을 추가한다.
   * createWorld() 직후에 호출한다.
   *
   * @param {object} world  createWorld() 결과
   */
  initWorldEvents(world) {
    if (!world.events) world.events = {};
    for (const type of _eventTypes) {
      if (!Array.isArray(world.events[type])) {
        world.events[type] = [];
      }
    }
  },

  /**
   * 모든 등록된 이벤트 배열을 비운다.
   * 매 프레임 시작 시 clearFrameEvents() 대신 (또는 함께) 호출한다.
   *
   * @param {object} events  world.events
   */
  clearAll(events) {
    if (!events) return;
    for (const type of _eventTypes) {
      if (Array.isArray(events[type])) {
        events[type].length = 0;
      }
    }
  },

  /**
   * Pipeline 시스템 인터페이스를 반환한다.
   * pipeline.register(EventRegistry.asSystem(), { priority: 105 }) 형태로 사용.
   *
   * @returns {{ update: (ctx: object) => void }}
   */
  asSystem() {
    return {
      update(ctx) {
        const events = ctx.world?.events;
        if (!events) return;

        for (const [type, handler] of _handlers) {
          const list = events[type];
          if (!list?.length) continue;
          for (let i = 0; i < list.length; i++) {
            handler(list[i], ctx);
          }
        }
      },
    };
  },

  /**
   * 등록된 이벤트 타입 목록을 반환한다. (디버그용)
   * @returns {string[]}
   */
  inspect() {
    return [..._eventTypes];
  },

  /**
   * 모든 등록을 초기화한다. (테스트용)
   */
  _reset() {
    _handlers.clear();
    _eventTypes.clear();
  },
};

// ── 기본 핸들러 등록 ─────────────────────────────────────────────
// 기존 EventBusHandler의 bossPhaseChanged 로직을 그대로 이전

EventRegistry.register('bossPhaseChanged', (evt, _ctx) => {
  if (!evt.enemy) return;
  evt.enemy.behaviorId = evt.newBehaviorId;
  console.debug(
    `[BossPhase] ${evt.enemyId} phase ${evt.phaseIndex}: ${evt.announceText ?? ''}`,
  );
});

// 상태이상 적용 핸들러 (StatusEffectSystem과 연동)
EventRegistry.register('statusApplied', (evt, _ctx) => {
  if (!evt.target || !evt.effect) return;
  if (!Array.isArray(evt.target.statusEffects)) {
    evt.target.statusEffects = [];
  }
  // 같은 타입이 이미 있으면 duration 갱신 (스택 대신 갱신)
  const existing = evt.target.statusEffects.find(e => e.type === evt.effect.type);
  if (existing) {
    existing.duration = Math.max(existing.duration, evt.effect.duration);
    existing.intensity = evt.effect.intensity ?? existing.intensity;
  } else {
    evt.target.statusEffects.push({ ...evt.effect });
  }
});
