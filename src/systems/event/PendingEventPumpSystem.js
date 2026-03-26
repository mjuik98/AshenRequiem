/**
 * src/systems/event/PendingEventPumpSystem.js
 *
 * scene/runtime에서 큐잉한 generic event envelope를 프레임 이벤트 큐로 주입한다.
 */
export const PendingEventPumpSystem = {
  update({ world }) {
    const pendingEventQueue = world?.progression?.pendingEventQueue;
    const events = world?.queues?.events;
    if (!Array.isArray(pendingEventQueue) || !events) return;

    for (const pendingEvent of pendingEventQueue) {
      const eventType = pendingEvent?.type;
      if (!eventType || !Array.isArray(events[eventType])) continue;

      events[eventType].push({ ...(pendingEvent?.payload ?? {}) });
    }

    world.progression.pendingEventQueue = null;
  },
};
