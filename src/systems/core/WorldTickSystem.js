import { EVENT_TYPES } from '../../data/constants/events.js';
import { GameConfig }  from '../../core/GameConfig.js';

/**
 * src/systems/core/WorldTickSystem.js — 프레임 시작 시 world 메타 동기화
 * 파이프라인 priority 0 (최우선 실행).
 */
export const WorldTickSystem = {
  update({ world, dt }) {
    // ── 1. 이벤트 큐 초기화 (프레임 시작) ────────────────────────────────
    // EventRegistry.asSystem(105)이 소비 후 클리어하지만, 
    // 프레임 시작 시 다시 한 번 초기화하여 안정성을 보장한다. (R-21)
    const { events, camera } = world;
    for (let i = 0; i < EVENT_TYPES.length; i++) {
      events[EVENT_TYPES[i]].length = 0;
    }

    // ── 2. 프레임 시간 갱신 ───────────────────────────────────────────────
    world.deltaTime    = dt ?? 0;
    world.elapsedTime += world.deltaTime;

    // ── 3. camera 메타 — SSOT ───────────────────────────────────────────
    camera.width  = GameConfig.canvasWidth;
    camera.height = GameConfig.canvasHeight;
  },
};
