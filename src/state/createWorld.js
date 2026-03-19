/**
 * src/state/createWorld.js
 *
 * REFACTOR: World 상태 책임 분리
 *
 *   Before (문제):
 *     player, enemies, projectiles, effects, pickups,   // 엔티티
 *     events: { hits, deaths, ... },                     // 이벤트 버스
 *     spawnQueue,                                         // 스폰 요청
 *     camera, elapsedTime, killCount, playMode,           // 메타
 *     deltaTime,                                          // 프레임 정보 (PipelineContext가 가져야 할 것)
 *     — 모든 것이 flat object에 섞여 소유 경계가 불명확
 *
 *   After (개선):
 *     구조적 서브 섹션 도입:
 *       world.entities  — 엔티티 배열 (EntityManager가 관리)
 *       world.events    — frame-local 이벤트 큐 (EventRegistry가 소비)
 *       world.meta      — 게임 진행 메타데이터 (씬/UI가 읽음)
 *       world.spawnQueue — 엔티티 생성 요청 버퍼 (FlushSystem이 소비)
 *       world.camera    — 카메라 상태 (CameraSystem이 관리)
 *
 *   하위 호환 유지:
 *     시스템들이 world.enemies, world.player 등을 직접 접근하는 코드가 많으므로
 *     Object.defineProperty로 top-level getter를 유지한다.
 *     → 기존 시스템 코드 수정 없이 새 구조로 점진적 마이그레이션 가능
 *
 *   점진적 마이그레이션 전략:
 *     Phase 1 (현재): 새 구조 + top-level getter 하위 호환
 *     Phase 2 (향후): 시스템들을 world.entities.enemies 패턴으로 전환
 *     Phase 3 (완성): top-level getter 제거
 */
import { EVENT_TYPES } from '../data/constants/events.js';

/**
 * @typedef {Object} WorldEntities
 * @property {object|null} player
 * @property {object[]}    enemies
 * @property {object[]}    projectiles
 * @property {object[]}    effects
 * @property {object[]}    pickups
 */

/**
 * @typedef {Object} WorldMeta
 * @property {number}  elapsedTime  누적 게임 시간 (s)
 * @property {number}  killCount    처치 수
 * @property {string}  playMode     'playing' | 'levelup' | 'paused' | 'dead'
 */

/**
 * @typedef {Object} WorldState
 * @property {WorldEntities} entities   엔티티 컨테이너
 * @property {object}        events     frame-local 이벤트 큐
 * @property {WorldMeta}     meta       게임 진행 메타데이터
 * @property {object[]}      spawnQueue 엔티티 생성 요청 버퍼
 * @property {object}        camera     카메라 상태
 * @property {number}        deltaTime  프레임 경과 시간 (PipelineContext에서 주입)
 */

/** createWorld — 월드 상태 초기화 */
export function createWorld() {
  /** 구조적으로 분리된 서브 섹션 */
  const entities = {
    player:      null,
    enemies:     [],
    projectiles: [],
    effects:     [],
    pickups:     [],
  };

  const events = EVENT_TYPES.reduce((acc, t) => { acc[t] = []; return acc; }, {});

  const meta = {
    elapsedTime: 0,
    killCount:   0,
    playMode:    'playing',
  };

  const world = {
    // ── 새 구조적 서브 섹션 ─────────────────────────────────────────────────
    entities,
    events,
    meta,

    // ── 기존 필드 (직접 소유, 변경 없음) ──────────────────────────────────
    spawnQueue: [],
    camera: { x: 0, y: 0, targetX: 0, targetY: 0 },

    /**
     * deltaTime은 WorldTickSystem이 PipelineContext.dt에서 매 프레임 주입한다.
     * world 객체에 있지만 실질적 소유권은 PipelineContext에 있다.
     */
    deltaTime: 0,
  };

  // ── 하위 호환: top-level getter/setter ─────────────────────────────────────
  // 기존 시스템이 world.player, world.enemies 등을 직접 접근하는 코드를
  // 수정 없이 작동시키기 위한 프록시 계층.
  // Phase 2에서 시스템들을 world.entities.* 패턴으로 전환 후 이 블록 제거.
  const proxyFields = ['player', 'enemies', 'projectiles', 'effects', 'pickups'];
  for (const field of proxyFields) {
    Object.defineProperty(world, field, {
      get() { return entities[field]; },
      set(v) { entities[field] = v; },
      enumerable:   true,
      configurable: true,
    });
  }

  // meta 필드도 top-level getter 유지
  const metaFields = ['elapsedTime', 'killCount', 'playMode'];
  for (const field of metaFields) {
    Object.defineProperty(world, field, {
      get() { return meta[field]; },
      set(v) { meta[field] = v; },
      enumerable:   true,
      configurable: true,
    });
  }

  return world;
}
