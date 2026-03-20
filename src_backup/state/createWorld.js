/**
 * src/state/createWorld.js
 *
 * CHANGE(P1): synergyState 필드 추가
 */

import { EVENT_TYPES }       from '../data/constants/events.js';
import { createSynergyState } from './createSynergyState.js';

/** createWorld — 월드 상태 초기화 */
export function createWorld() {
  // 이벤트 큐 — EVENT_TYPES 기반 자동 생성
  const events = {};
  for (const type of EVENT_TYPES) events[type] = [];

  return {
    // ── 엔티티 ────────────────────────────────────────────────────────
    player:      null,
    enemies:     [],
    projectiles: [],
    effects:     [],
    pickups:     [],

    // ── 이벤트 큐 (frame-local) ───────────────────────────────────────
    events,

    // ── 스폰 요청 버퍼 ────────────────────────────────────────────────
    spawnQueue: [],

    // ── 카메라 상태 ───────────────────────────────────────────────────
    camera: { x: 0, y: 0, targetX: 0, targetY: 0 },

    // ── 프레임 시간 ───────────────────────────────────────────────────
    deltaTime: 0,

    // ── 게임 진행 메타 ────────────────────────────────────────────────
    elapsedTime: 0,
    killCount:   0,
    playMode:    'playing',

    // ── 업그레이드 대기열 ─────────────────────────────────────────────
    pendingUpgrade: null,
    pendingLevelUpChoices: null,

    // ── 시너지 추적 상태 (P1) ─────────────────────────────────────────
    synergyState: createSynergyState(),
  };
}
