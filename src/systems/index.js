/**
 * src/systems/index.js — 시스템 레지스트리 (배럴 파일)
 *
 * CHANGE: 팩토리 기반 시스템을 SYSTEM_REGISTRY에서 제거
 *   제거 대상 (PipelineBuilder가 인스턴스로 직접 등록):
 *     - EnemyMovementSystem (priority 30) → createEnemyMovementSystem()
 *     - CollisionSystem     (priority 60) → createCollisionSystem()
 *     - EventRegistry.asSystem (priority 105) → registry.asSystem()
 *
 * 이유:
 *   위 세 시스템은 프레임간 상태(SpatialGrid, 핸들러 맵)를 가지므로
 *   AGENTS.md §2 "module-level static state 금지" 원칙에 따라 팩토리 패턴 적용.
 *   PipelineBuilder.build()에서 인스턴스를 생성 후 pipeline.register()로 등록.
 *
 * 새 시스템 추가 방법:
 *   1. src/systems/{category}/MySystem.js 생성
 *   2. import 추가
 *   3. SYSTEM_REGISTRY에 추가 (상태 없는 싱글턴만)
 *   4. 상태가 있으면 팩토리 함수 → PipelineBuilder에서 직접 등록
 */
import { WorldTickSystem }      from './core/WorldTickSystem.js';
import { PlayerMovementSystem } from './movement/PlayerMovementSystem.js';
import { EliteBehaviorSystem }  from './combat/EliteBehaviorSystem.js';
import { WeaponSystem }         from './combat/WeaponSystem.js';
import { ProjectileSystem }     from './combat/ProjectileSystem.js';
import { StatusEffectSystem }   from './combat/StatusEffectSystem.js';
import { DamageSystem }         from './combat/DamageSystem.js';
import { BossPhaseSystem }      from './combat/BossPhaseSystem.js';
import { DeathSystem }          from './combat/DeathSystem.js';
import { ExperienceSystem }     from './progression/ExperienceSystem.js';
import { LevelSystem }          from './progression/LevelSystem.js';
import { UpgradeApplySystem }   from './progression/UpgradeApplySystem.js';
import { WeaponEvolutionSystem } from './progression/WeaponEvolutionSystem.js';
import { EffectTickSystem }     from './spawn/EffectTickSystem.js';
import { FlushSystem }          from './spawn/FlushSystem.js';
import { CameraSystem }         from './camera/CameraSystem.js';
import { RenderSystem }         from './render/RenderSystem.js';

/**
 * 파이프라인 시스템 등록 목록 — 상태 없는 싱글턴 시스템만 포함.
 * priority 오름차순으로 실행됨.
 *
 * ※ 팩토리 시스템은 PipelineBuilder에서 별도 등록:
 *    priority 30  : createEnemyMovementSystem()
 *    priority 60  : createCollisionSystem()
 *    priority 105 : eventRegistry.asSystem()
 *
 * @type {Array<{ system: object, priority: number }>}
 */
export const SYSTEM_REGISTRY = [
  // priority 0: world 메타 동기화
  { system: WorldTickSystem,        priority: 0   },

  // priority 20: 플레이어 이동 (상태 없음 → 싱글턴 유지)
  { system: PlayerMovementSystem,   priority: 20  },

  // priority 30: EnemyMovementSystem → PipelineBuilder에서 팩토리 등록

  // priority 35: 엘리트 chargeEffect 정리 (상태 없음)
  { system: EliteBehaviorSystem,    priority: 35  },

  // priority 40~75: 전투 (상태 없음)
  { system: WeaponSystem,           priority: 40  },
  { system: ProjectileSystem,       priority: 50  },

  // priority 60: CollisionSystem → PipelineBuilder에서 팩토리 등록

  { system: StatusEffectSystem,     priority: 65  },
  { system: DamageSystem,           priority: 70  },
  { system: BossPhaseSystem,        priority: 75  },

  // priority 80~100: 처리/성장
  { system: DeathSystem,            priority: 80  },
  { system: ExperienceSystem,       priority: 90  },
  // synergySystem (95) → PipelineBuilder에서 팩토리 등록
  { system: WeaponEvolutionSystem,  priority: 96  },
  { system: LevelSystem,            priority: 100 },
  { system: UpgradeApplySystem,     priority: 101 },

  // priority 105: EventRegistry → PipelineBuilder에서 인스턴스 asSystem() 등록

  // priority 108~130: 정리/렌더
  { system: EffectTickSystem,       priority: 108 },
  { system: FlushSystem,            priority: 110 },
  { system: CameraSystem,           priority: 120 },
  { system: RenderSystem,           priority: 130 },
];

// ── 개별 re-export (테스트 코드 등 직접 import 지원) ─────────────────────
export {
  WorldTickSystem,
  PlayerMovementSystem,
  EliteBehaviorSystem,
  WeaponSystem,
  ProjectileSystem,
  StatusEffectSystem,
  DamageSystem,
  BossPhaseSystem,
  DeathSystem,
  ExperienceSystem,
  LevelSystem,
  UpgradeApplySystem,
  WeaponEvolutionSystem,
  EffectTickSystem,
  FlushSystem,
  CameraSystem,
  RenderSystem,
};

// 팩토리 시스템 re-export (직접 접근이 필요한 경우)
export { createCollisionSystem }      from './combat/CollisionSystem.js';
export { createEnemyMovementSystem }  from './movement/EnemyMovementSystem.js';
export { createSynergySystem }       from './progression/SynergySystem.js';
export { EventRegistry }              from './event/EventRegistry.js';
