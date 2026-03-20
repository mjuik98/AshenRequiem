/**
 * src/core/PipelineBuilder.js — 파이프라인 조립 전담 빌더
 *
 * REFACTOR: 팩토리 시스템 직접 생성 + EventRegistry 인스턴스 수신
 *
 * Before:
 *   - spawnSystem, cullingSystem을 PlayContext에서 받음
 *   - CollisionSystem, EnemyMovementSystem이 SYSTEM_REGISTRY에서 모듈 레벨 객체로 등록
 *   - EventRegistry.asSystem이 모듈 레벨 싱글턴 사용
 *   - bossPhaseHandler, soundEventHandler에 registry 미전달 → 누수
 *
 * After:
 *   - spawnSystem, cullingSystem도 PipelineBuilder가 직접 생성
 *   - CollisionSystem → createCollisionSystem() 팩토리로 생성 후 등록
 *   - EnemyMovementSystem → createEnemyMovementSystem() 팩토리로 생성 후 등록
 *   - EventRegistry 인스턴스를 받아 asSystem() 등록
 *   - bossPhaseHandler, soundEventHandler에 registry 인스턴스 전달
 *   - build()가 { pipeline, pipelineCtx, systems } 반환
 *     systems.spawnSystem은 PlayScene이 getDebugInfo()에 접근할 수 있도록 노출
 */

import { Pipeline }  from './Pipeline.js';
import { SYSTEM_REGISTRY } from '../systems/index.js';
import { createCollisionSystem }     from '../systems/combat/CollisionSystem.js';
import { createEnemyMovementSystem } from '../systems/movement/EnemyMovementSystem.js';
import { createSpawnSystem }         from '../systems/spawn/SpawnSystem.js';
import { createCullingSystem }       from '../systems/render/CullingSystem.js';

import { registerBossPhaseHandler }   from '../systems/event/bossPhaseHandler.js';
import { registerSoundEventHandlers } from '../systems/sound/soundEventHandler.js';

export class PipelineBuilder {
  /**
   * @param {object}                                  services
   * @param {import('../systems/event/EventRegistry.js').EventRegistry} eventRegistry
   * @param {object|null}                             [profiler]
   */
  constructor(services, eventRegistry, profiler = null) {
    this._services      = services;
    this._eventRegistry = eventRegistry;
    this._profiler      = profiler;
    this._pipeline      = null;

    // 팩토리 시스템 — build() 시 생성됨
    this._spawnSystem         = null;
    this._cullingSystem       = null;
    this._collisionSystem     = null;
    this._enemyMovementSystem = null;
  }

  /**
   * Pipeline을 생성하고 모든 시스템과 이벤트 핸들러를 등록한다.
   *
   * @param {object} world
   * @param {object} input
   * @param {object} [data]
   * @returns {{
   *   pipeline: Pipeline,
   *   pipelineCtx: object,
   *   systems: { spawnSystem: object, cullingSystem: object }
   * }}
   */
  build(world, input, data = {}) {
    // 팩토리 시스템 인스턴스 생성
    this._spawnSystem         = createSpawnSystem();
    this._cullingSystem       = createCullingSystem();
    this._collisionSystem     = createCollisionSystem();
    this._enemyMovementSystem = createEnemyMovementSystem();

    const pipeline = new Pipeline();

    // CHANGE(P2-B): dt, dpr 명시적 초기화
    const pipelineCtx = {
      world,
      input,
      data,
      services: {
        ...this._services,
        cullingSystem: this._cullingSystem,
      },
      dt:  0,
      dpr: 1,
    };

    this._registerSystems(pipeline);
    this._registerEventHandlers();

    if (this._profiler) {
      pipeline.setProfiler(this._profiler);
    }

    this._pipeline = pipeline;

    return {
      pipeline,
      pipelineCtx,
      // PlayScene이 getDebugInfo()에 접근할 수 있도록 systems 노출
      systems: {
        spawnSystem:   this._spawnSystem,
        cullingSystem: this._cullingSystem,
      },
    };
  }

  setSystemEnabled(system, enabled) {
    this._pipeline?.setEnabled(system, enabled);
  }

  /** @private */
  _registerSystems(pipeline) {
    // ── 인스턴스 기반 시스템 (팩토리 생성) ──────────────────────────────
    // SpawnSystem — 인스턴스 상태 보유 (스폰 누적, 보스 타이밍)
    pipeline.register(this._spawnSystem,         { priority: 10  });

    // EnemyMovementSystem — SpatialGrid 상태 캡슐화
    pipeline.register(this._enemyMovementSystem, { priority: 30  });

    // CollisionSystem — SpatialGrid 상태 캡슐화
    pipeline.register(this._collisionSystem,     { priority: 60  });

    // EventRegistry System — 인스턴스의 processAll 실행
    pipeline.register(this._eventRegistry.asSystem(), { priority: 105 });

    // CullingSystem — 가시 엔티티 버퍼 보유
    pipeline.register(this._cullingSystem,       { priority: 125 });

    // ── 싱글턴 시스템 (SYSTEM_REGISTRY) ────────────────────────────────
    // CHANGE(P2-A): SYSTEM_REGISTRY 루프로 등록 — 새 시스템은 systems/index.js만 수정
    for (const { system, priority } of SYSTEM_REGISTRY) {
      pipeline.register(system, { priority });
    }
  }

  /** @private */
  _registerEventHandlers() {
    // EventRegistry 인스턴스에 등록 → dispose() 시 자동 정리 (메모리 누수 방지)
    registerBossPhaseHandler(this._services, this._eventRegistry);
    registerSoundEventHandlers(this._services.soundSystem, this._eventRegistry);
  }
}
