/**
 * src/core/PipelineBuilder.js — 파이프라인 조립 전담 빌더
 *
 * CHANGE(P0): currencyHandler 등록 추가
 * CHANGE(P1): session을 4번째 파라미터로 분리 수신 (R-14 준수)
 * CHANGE(P3): eventHandlerRegistry를 통한 핸들러 등록 일원화
 */

import { Pipeline }  from './Pipeline.js';
import { SYSTEM_REGISTRY } from '../systems/index.js';
import { createCollisionSystem }     from '../systems/combat/CollisionSystem.js';
import { createEnemyMovementSystem } from '../systems/movement/EnemyMovementSystem.js';
import { createSpawnSystem }         from '../systems/spawn/SpawnSystem.js';
import { createCullingSystem }       from '../systems/render/CullingSystem.js';
import { createSynergySystem }       from '../systems/progression/SynergySystem.js';

import { registerChestRewardHandler } from '../systems/event/chestRewardHandler.js';
import { registerBossPhaseHandler }   from '../systems/event/bossPhaseHandler.js';
import { registerSoundEventHandlers } from '../systems/sound/soundEventHandler.js';
import { registerCurrencyHandler }    from '../systems/event/currencyHandler.js';
import { registerBossAnnouncementHandler } from '../systems/event/bossAnnouncementHandler.js';
import { registerWeaponEvolutionHandler }  from '../systems/event/weaponEvolutionHandler.js';
import { getEventHandlers }           from '../systems/event/eventHandlerRegistry.js';
import { registerCodexHandlers }      from '../systems/event/codexHandler.js';

export class PipelineBuilder {
  /**
   * @param {object}                                  services   (session 제외)
   * @param {import('../systems/event/EventRegistry.js').EventRegistry} eventRegistry
   * @param {import('../state/createSessionState.js').SessionState|null} session
   * @param {object|null}                             [profiler]
   */
  constructor(services, eventRegistry, session = null, profiler = null) {
    this._services      = services;
    this._eventRegistry = eventRegistry;
    this._session       = session;  // services가 아닌 독립 상태로 보유 (R-14)
    this._profiler      = profiler;
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
    this._spawnSystem         = createSpawnSystem();
    this._cullingSystem       = createCullingSystem();
    this._collisionSystem     = createCollisionSystem();
    this._enemyMovementSystem = createEnemyMovementSystem();
    this._synergySystem       = createSynergySystem();

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
    pipeline.register(this._spawnSystem,         { priority: 10  });
    pipeline.register(this._enemyMovementSystem, { priority: 30  });
    pipeline.register(this._synergySystem,       { priority: 95  });
    pipeline.register(this._collisionSystem,     { priority: 60  });
    pipeline.register(this._eventRegistry.asSystem(), { priority: 105 });
    pipeline.register(this._cullingSystem,       { priority: 125 });

    for (const { system, priority } of SYSTEM_REGISTRY) {
      pipeline.register(system, { priority });
    }
  }

  /** @private */
  _registerEventHandlers() {
    registerChestRewardHandler(this._eventRegistry);
    // 기본 핸들러 (명시적 등록)
    registerBossPhaseHandler(this._services, this._eventRegistry);
    registerSoundEventHandlers(this._services.soundSystem, this._eventRegistry);
    registerCurrencyHandler(this._session, this._eventRegistry);
    registerBossAnnouncementHandler(this._services, this._eventRegistry);
    registerWeaponEvolutionHandler(this._services, this._eventRegistry);
    registerCodexHandlers(this._session, this._eventRegistry);

    // P3: 레지스트리 기반 추가 핸들러 일괄 실행
    for (const register of getEventHandlers()) {
      register(this._services, this._eventRegistry, this._session);
    }
  }
}
