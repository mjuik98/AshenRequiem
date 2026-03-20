/**
 * src/state/createWorld.js
 *
 * REFACTOR: Object.defineProperty Proxy 패턴 제거
 *
 * Before (복잡성):
 *   entities 서브객체 + meta 서브객체 + Object.defineProperty proxy getter
 *   → 디버거에서 추적 어려움
 *   → GC 압박 (defineProperty 접근자마다 클로저 생성)
 *   → "Phase 1 현재" 주석이 고착되어 Phase 2가 방치됨
 *
 * After (단순화):
 *   flat 구조로 복원 — 기존 시스템 코드 변경 없이 동일하게 동작
 *   world.enemies, world.player 등이 직접 프로퍼티로 존재
 *   구조적 서브섹션은 주석으로만 구분 (런타임 오버헤드 없음)
 *
 * 하위 호환:
 *   world.enemies.push(), world.player = entity 등 기존 패턴 모두 동작
 *   시스템 코드 수정 불필요
 */

import { EVENT_TYPES } from '../data/constants/events.js';

/** createWorld — 월드 상태 초기화 */
export function createWorld() {
  // 이벤트 큐 — EVENT_TYPES 기반 자동 생성 (새 타입 추가 시 자동 반영)
  const events = {};
  for (const type of EVENT_TYPES) events[type] = [];

  return {
    // ── 엔티티 ────────────────────────────────────────────────────────
    player:      null,
    enemies:     [],
    projectiles: [],
    effects:     [],
    pickups:     [],

    // ── 이벤트 큐 (frame-local, EventRegistry가 priority 105에서 소비) ─
    events,

    // ── 스폰 요청 버퍼 (FlushSystem이 priority 110에서 처리) ───────────
    spawnQueue: [],

    // ── 카메라 상태 (CameraSystem이 관리) ─────────────────────────────
    camera: { x: 0, y: 0, targetX: 0, targetY: 0 },

    // ── 프레임 시간 (WorldTickSystem이 pipelineCtx.dt에서 주입) ────────
    deltaTime: 0,

    // ── 게임 진행 메타 ────────────────────────────────────────────────
    elapsedTime: 0,
    killCount:   0,
    playMode:    'playing',
  };
}
