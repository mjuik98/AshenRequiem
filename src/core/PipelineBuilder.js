/**
 * src/core/PipelineBuilder.js — 파이프라인 조립 전담 빌더
 */

import { Pipeline } from './Pipeline.js';

import { WorldTickSystem }      from '../systems/core/WorldTickSystem.js';
import { PlayerMovementSystem } from '../systems/movement/PlayerMovementSystem.js';
import { EnemyMovementSystem }  from '../systems/movement/EnemyMovementSystem.js';
import { EliteBehaviorSystem }  from '../systems/combat/EliteBehaviorSystem.js';
import { WeaponSystem }         from '../systems/combat/WeaponSystem.js';
import { ProjectileSystem }     from '../systems/combat/ProjectileSystem.js';
import { CollisionSystem }      from '../systems/combat/CollisionSystem.js';
import { StatusEffectSystem }   from '../systems/combat/StatusEffectSystem.js';
import { DamageSystem }         from '../systems/combat/DamageSystem.js';
import { BossPhaseSystem }      from '../systems/combat/BossPhaseSystem.js';
import { DeathSystem }          from '../systems/combat/DeathSystem.js';
import { ExperienceSystem }     from '../systems/progression/ExperienceSystem.js';
import { LevelSystem }          from '../systems/progression/LevelSystem.js';
import { FlushSystem }          from '../systems/spawn/FlushSystem.js';
import { EffectTickSystem }     from '../systems/spawn/EffectTickSystem.js';
import { CameraSystem }         from '../systems/camera/CameraSystem.js';
import { RenderSystem }         from '../systems/render/RenderSystem.js';
import { EventRegistry }        from '../systems/event/EventRegistry.js';

import { registerBossPhaseHandler } from '../systems/event/bossPhaseHandler.js';
import { registerSoundEventHandlers } from '../systems/sound/soundEventHandler.js';

/**
 * 파이프라인 시스템 등록 목록.
 */
const SYSTEM_REGISTRY = [
  { system: WorldTickSystem,        priority: 0   },
  // SpawnSystem은 인스턴스로 주입됨 (priority 10)
  { system: PlayerMovementSystem,   priority: 20  },
  { system: EnemyMovementSystem,    priority: 30  },
  { system: EliteBehaviorSystem,    priority: 35  },
  { system: WeaponSystem,           priority: 40  },
  { system: ProjectileSystem,       priority: 50  },
  { system: CollisionSystem,        priority: 60  },
  { system: StatusEffectSystem,     priority: 65  },
  { system: DamageSystem,           priority: 70  },
  { system: BossPhaseSystem,        priority: 75  },
  { system: DeathSystem,            priority: 80  },
  { system: ExperienceSystem,       priority: 90  },
  { system: LevelSystem,            priority: 100 },
  { system: EventRegistry.asSystem, priority: 105 },
  { system: EffectTickSystem,       priority: 108 },
  { system: FlushSystem,            priority: 110 },
  { system: CameraSystem,           priority: 120 },
  { system: RenderSystem,           priority: 130 },
];

export class PipelineBuilder {
  /**
   * @param {object} services
   * @param {object} spawnSystem
   * @param {object} [profiler]
   */
  constructor(services, spawnSystem, profiler = null) {
    this._services    = services;
    this._spawnSystem = spawnSystem;
    this._profiler    = profiler;
    this._pipeline    = null;
  }

  /**
   * Pipeline을 생성하고 모든 시스템과 이벤트 핸들러를 등록한다.
   * @param {object} world
   * @param {object} input
   * @param {object} [data]
   * @returns {{ pipeline: Pipeline, ctx: object }}
   */
  build(world, input, data = {}) {
    const pipeline = new Pipeline();
    const ctx      = { world, input, data, services: this._services };

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

  _registerSystems(pipeline) {
    // 인스턴스 기반 시스템
    pipeline.register(this._spawnSystem, { priority: 10 });

    // 레지스트리 기반 싱글톤 시스템
    for (const entry of SYSTEM_REGISTRY) {
      pipeline.register(entry.system, { priority: entry.priority });
    }
  }

  _registerEventHandlers() {
    registerBossPhaseHandler(this._services);
    registerSoundEventHandlers(this._services.soundSystem);
  }
}
