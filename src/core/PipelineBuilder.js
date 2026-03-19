/**
 * src/core/PipelineBuilder.js — 파이프라인 조립 전담 빌더
 *
 * CHANGE(P2-A): 고팬아웃 해소 — SYSTEM_REGISTRY를 systems/index.js에서 import
 *   Before: 18개 시스템을 이 파일에서 각각 직접 import
 *           → 새 시스템 추가 시 이 파일 수정 필요
 *   After:  SYSTEM_REGISTRY만 import — 새 시스템은 systems/index.js 수정으로 해결
 *           → PipelineBuilder는 시스템 목록 관리에서 분리됨
 *
 * CHANGE(P2-B): pipelineCtx에 dt / dpr 명시적 초기화
 *   Before: ctx = { world, input, data, services } — dt/dpr 미포함
 *           PlayScene이 매 프레임 ctx.dt = dt 로 동적 프로퍼티 추가
 *           → 타입 추론 불가, undefined 가능성
 *   After:  build() 시 ctx = { world, input, data, services, dt: 0, dpr: 1 }
 *           → 명시적 필드로 초기화, WorldTickSystem이 dt를 안전하게 읽을 수 있음
 *           → PlayScene은 여전히 실행 전 ctx.dt = actualDt로 덮어씀 (기존 코드 유지)
 */
import { Pipeline }  from './Pipeline.js';
import { SYSTEM_REGISTRY } from '../systems/index.js';

import { registerBossPhaseHandler }   from '../systems/event/bossPhaseHandler.js';
import { registerSoundEventHandlers } from '../systems/sound/soundEventHandler.js';

export class PipelineBuilder {
  /**
   * @param {object}      services
   * @param {object}      spawnSystem     createSpawnSystem() 반환값
   * @param {object}      cullingSystem   createCullingSystem() 반환값
   * @param {object|null} [profiler]      PipelineProfiler 인스턴스
   */
  constructor(services, spawnSystem, cullingSystem, profiler = null) {
    this._services      = services;
    this._spawnSystem   = spawnSystem;
    this._cullingSystem = cullingSystem;
    this._profiler      = profiler;
    this._pipeline      = null;
  }

  /**
   * Pipeline을 생성하고 모든 시스템과 이벤트 핸들러를 등록한다.
   *
   * @param {object} world
   * @param {object} input
   * @param {object} [data]
   * @returns {{ pipeline: Pipeline, ctx: object }}
   */
  build(world, input, data = {}) {
    const pipeline = new Pipeline();

    // CHANGE(P2-B): dt, dpr을 명시적 필드로 초기화
    // PlayScene._runGamePipeline(dt)이 매 프레임 ctx.dt와 ctx.dpr을 덮어씀
    const ctx = {
      world,
      input,
      data,
      services: this._services,
      dt:  0,   // 명시적 초기화 — WorldTickSystem이 `dt ?? 0` 없이 안전하게 읽을 수 있음
      dpr: 1,   // 명시적 초기화
    };

    this._registerSystems(pipeline);
    this._registerEventHandlers();

    if (this._profiler) {
      pipeline.setProfiler(this._profiler);
    }

    this._pipeline = pipeline;
    return { pipeline, ctx };
  }

  setSystemEnabled(system, enabled) {
    this._pipeline?.setEnabled(system, enabled);
  }

  /** @private */
  _registerSystems(pipeline) {
    // 인스턴스 기반 상태 보유 시스템
    pipeline.register(this._spawnSystem,   { priority: 10 });
    pipeline.register(this._cullingSystem, { priority: 125 }); // R-10 신규

    // CHANGE(P2-A): 개별 import 제거 → SYSTEM_REGISTRY 루프로 대체
    // 새 시스템은 src/systems/index.js의 SYSTEM_REGISTRY에만 추가하면 됨
    for (const { system, priority } of SYSTEM_REGISTRY) {
      pipeline.register(system, { priority });
    }
  }

  /** @private */
  _registerEventHandlers() {
    registerBossPhaseHandler(this._services);
    registerSoundEventHandlers(this._services.soundSystem);
  }
}
