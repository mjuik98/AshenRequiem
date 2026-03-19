/**
 * src/systems/index.js — 시스템 레지스트리 (배럴 파일)
 *
 * CHANGE(P2-A): PipelineBuilder의 고팬아웃(High Fan-out) 해소
 *   Before: PipelineBuilder.js가 18개 시스템을 각각 개별 import
 *           → 새 시스템 추가 시 PipelineBuilder.js 직접 수정 필요
 *           → PipelineBuilder가 모든 시스템에 대한 의존성을 직접 보유
 *   After:  PipelineBuilder는 이 파일의 SYSTEM_REGISTRY만 import
 *           → 새 시스템 추가 = 이 파일에 import 1줄 + SYSTEM_REGISTRY 1줄
 *           → PipelineBuilder는 수정 없이 자동으로 새 시스템 포함
 *
 * 새 시스템 추가 방법:
 *   1. src/systems/{category}/MySystem.js 생성
 *   2. 아래 import 추가: import { MySystem } from './{category}/MySystem.js';
 *   3. SYSTEM_REGISTRY에 추가: { system: MySystem, priority: N }
 *   4. PipelineBuilder.js 수정 불필요
 *
 * 인스턴스 기반 시스템(SpawnSystem)은 PlayContext에서 생성된 후
 * PipelineBuilder.build()에서 별도로 등록된다.
 */
import { WorldTickSystem }      from './core/WorldTickSystem.js';
import { PlayerMovementSystem } from './movement/PlayerMovementSystem.js';
import { EnemyMovementSystem }  from './movement/EnemyMovementSystem.js';
import { EliteBehaviorSystem }  from './combat/EliteBehaviorSystem.js';
import { WeaponSystem }         from './combat/WeaponSystem.js';
import { ProjectileSystem }     from './combat/ProjectileSystem.js';
import { CollisionSystem }      from './combat/CollisionSystem.js';
import { StatusEffectSystem }   from './combat/StatusEffectSystem.js';
import { DamageSystem }         from './combat/DamageSystem.js';
import { BossPhaseSystem }      from './combat/BossPhaseSystem.js';
import { DeathSystem }          from './combat/DeathSystem.js';
import { ExperienceSystem }     from './progression/ExperienceSystem.js';
import { LevelSystem }          from './progression/LevelSystem.js';
import { EventRegistry }        from './event/EventRegistry.js';
import { EffectTickSystem }     from './spawn/EffectTickSystem.js';
import { FlushSystem }          from './spawn/FlushSystem.js';
import { CameraSystem }         from './camera/CameraSystem.js';
import { RenderSystem }         from './render/RenderSystem.js';

/**
 * 파이프라인 시스템 등록 목록 (priority 오름차순으로 실행됨).
 *
 * 이벤트 소비 가능 범위: priority 0 ~ 104
 *   EventRegistry.asSystem(priority 105)이 이벤트를 소비/클리어하므로
 *   priority 108+ 시스템(EffectTickSystem, FlushSystem, RenderSystem)은
 *   이벤트를 읽어서는 안 된다.
 *
 * @type {Array<{ system: object, priority: number }>}
 */
export const SYSTEM_REGISTRY = [
  // priority 0:   world 메타 동기화 (deltaTime, elapsedTime, camera 크기)
  { system: WorldTickSystem,        priority: 0   },

  // priority 10:  SpawnSystem — 인스턴스 기반, PipelineBuilder에서 별도 등록

  // priority 20~35: 이동
  { system: PlayerMovementSystem,   priority: 20  },
  { system: EnemyMovementSystem,    priority: 30  },
  { system: EliteBehaviorSystem,    priority: 35  },

  // priority 40~75: 전투
  { system: WeaponSystem,           priority: 40  },
  { system: ProjectileSystem,       priority: 50  },
  { system: CollisionSystem,        priority: 60  },
  { system: StatusEffectSystem,     priority: 65  },
  { system: DamageSystem,           priority: 70  },
  { system: BossPhaseSystem,        priority: 75  },

  // priority 80~100: 처리/성장
  { system: DeathSystem,            priority: 80  },
  { system: ExperienceSystem,       priority: 90  },
  { system: LevelSystem,            priority: 100 },

  // priority 105: 이벤트 소비/클리어 (이 이후 시스템은 이벤트 접근 불가)
  { system: EventRegistry.asSystem, priority: 105 },

  // priority 108~130: 정리/렌더 (이벤트 접근 불가 구간)
  { system: EffectTickSystem,       priority: 108 },
  { system: FlushSystem,            priority: 110 },
  { system: CameraSystem,           priority: 120 },
  { system: RenderSystem,           priority: 130 },
];

// ── 개별 re-export (테스트 코드 등 직접 import 지원) ─────────────────────
export {
  WorldTickSystem,
  PlayerMovementSystem,
  EnemyMovementSystem,
  EliteBehaviorSystem,
  WeaponSystem,
  ProjectileSystem,
  CollisionSystem,
  StatusEffectSystem,
  DamageSystem,
  BossPhaseSystem,
  DeathSystem,
  ExperienceSystem,
  LevelSystem,
  EventRegistry,
  EffectTickSystem,
  FlushSystem,
  CameraSystem,
  RenderSystem,
};
