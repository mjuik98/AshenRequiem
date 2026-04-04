/**
 * src/core/PipelineBuilder.js — 파이프라인 조립 전담 빌더
 *
 * CHANGE(P0): currency event adapter 등록 추가
 * CHANGE(P1): session을 4번째 파라미터로 분리 수신 (R-14 준수)
 * CHANGE(P3): injected event registration orchestrator로 핸들러 등록 일원화
 */

import { Pipeline }  from './Pipeline.js';
import { SYSTEM_REGISTRY } from '../systems/index.js';
import {
  PLAY_PIPELINE_FACTORY_SYSTEMS,
  PLAY_PIPELINE_INSTANCE_SYSTEMS,
} from './playPipelineManifest.js';

export class PipelineBuilder {
  /**
   * @param {object}                                  services   (session 제외)
   * @param {import('../systems/event/EventRegistry.js').EventRegistry} eventRegistry
   * @param {import('../state/createSessionState.js').SessionState|null} session
   * @param {object|null}                             [profiler]
   * @param {Function|null}                           [registerEventHandlersImpl]
   */
  constructor(services, eventRegistry, session = null, profiler = null, registerEventHandlersImpl = null) {
    this._services      = services;
    this._eventRegistry = eventRegistry;
    this._session       = session;  // services가 아닌 독립 상태로 보유 (R-14)
    this._profiler      = profiler;
    this._registerEventHandlersImpl = typeof registerEventHandlersImpl === 'function'
      ? registerEventHandlersImpl
      : null;
    this._pipeline      = null;

    this._spawnSystem         = null;
    this._cullingSystem       = null;
    this._collisionSystem     = null;
    this._enemyMovementSystem = null;
    this._synergySystem       = null;
  }

  /**
   * Pipeline을 생성하고 모든 시스템과 이벤트 핸들러를 등록한다.
   */
  build(world, input, data = {}) {
    for (const spec of PLAY_PIPELINE_FACTORY_SYSTEMS) {
      this[spec.slot] = spec.create();
    }

    const pipeline = new Pipeline();

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
      systems: {
        spawnSystem:   this._spawnSystem,
        cullingSystem: this._cullingSystem,
        synergySystem: this._synergySystem,
      },
    };
  }

  setSystemEnabled(system, enabled) {
    this._pipeline?.setEnabled(system, enabled);
  }

  /** @private */
  _registerSystems(pipeline) {
    for (const spec of PLAY_PIPELINE_FACTORY_SYSTEMS) {
      pipeline.register(this[spec.slot], { priority: spec.priority });
    }
    for (const spec of PLAY_PIPELINE_INSTANCE_SYSTEMS) {
      pipeline.register(spec.create({
        eventRegistry: this._eventRegistry,
        services: this._services,
        session: this._session,
      }), { priority: spec.priority });
    }

    for (const { system, priority } of SYSTEM_REGISTRY) {
      pipeline.register(system, { priority });
    }
  }

  /** @private */
  _registerEventHandlers() {
    this._registerEventHandlersImpl?.(this._services, this._eventRegistry, this._session);
  }
}
