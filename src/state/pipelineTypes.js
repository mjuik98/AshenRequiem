/**
 * src/state/pipelineTypes.js
 *
 * [개선 P2] 시스템 계약 구조 JSDoc 타입 정의
 *
 * Before:
 *   System.update()가 받는 { world, input, data, services } 구조체에
 *   JSDoc이 없어, AI 에이전트나 신규 기여자가 PlayContext.buildPipeline()을
 *   직접 열어 구조를 파악해야 함.
 *
 * After:
 *   PipelineContext, Services, WorldState 타입을 이 파일에서 중앙 정의.
 *   각 System 파일 상단에 @param {PipelineContext} ctx 어노테이션만 추가하면 됨.
 *
 * 사용 방법:
 *   각 System 파일 상단에 아래 import를 추가:
 *
 *     // @ts-check
 *     // import type { PipelineContext } from '../../state/pipelineTypes.js';
 *
 *   또는 JSDoc 파라미터로:
 *
 *     /⁠**
 *      * @param {PipelineContext} ctx
 *      *⁠/
 *     update(ctx) { ... }
 */

// ─────────────────────────────────────────────────────────────
// Services
// ─────────────────────────────────────────────────────────────

/**
 * @typedef {Object} Services
 * @property {import('../managers/ObjectPool.js').ObjectPool} projectilePool
 * @property {import('../managers/ObjectPool.js').ObjectPool} effectPool
 * @property {import('../managers/ObjectPool.js').ObjectPool} enemyPool
 * @property {import('../managers/ObjectPool.js').ObjectPool} pickupPool
 * @property {object|null}              soundSystem   SoundSystem 인스턴스 (비활성화 시 null)
 * @property {HTMLCanvasElement}        canvas
 */

// ─────────────────────────────────────────────────────────────
// World Events
// ─────────────────────────────────────────────────────────────

/**
 * @typedef {Object} HitEvent
 * @property {string}  attackerId
 * @property {string}  targetId
 * @property {object}  target       실제 엔티티 참조
 * @property {number}  damage
 * @property {string}  [projectileId]
 * @property {object}  [projectile]
 */

/**
 * @typedef {Object} DeathEvent
 * @property {string} entityId
 * @property {object} entity
 * @property {string} [killedBy]  attackerId
 */

/**
 * @typedef {Object} WorldEvents
 * @property {HitEvent[]}   hits
 * @property {DeathEvent[]} deaths
 * @property {object[]}     pickupCollected
 * @property {object[]}     levelUpRequested
 * @property {object[]}     statusApplied
 * @property {object[]}     bossPhaseChanged
 * @property {object[]}     spawnRequested
 */

// ─────────────────────────────────────────────────────────────
// World
// ─────────────────────────────────────────────────────────────

/**
 * 프레임 간 런타임 게임 상태.
 * System은 이 객체를 읽고 쓰지만, Scene은 직접 game rule을 계산하지 않는다.
 *
 * @typedef {Object} WorldState
 * @property {object}    player           플레이어 엔티티
 * @property {object[]}  enemies          살아있는 적 배열
 * @property {object[]}  projectiles      투사체 배열
 * @property {object[]}  pickups          픽업 배열
 * @property {object[]}  effects          이펙트(데미지텍스트 등) 배열
 * @property {object[]}  spawnQueue       다음 프레임에 스폰될 엔티티 요청 목록
 * @property {WorldEvents} events         프레임 내 단발성 이벤트 (EventRegistry가 프레임 끝 초기화)
 * @property {object}    camera           { x, y, zoom } 카메라 상태
 * @property {number}    deltaTime        현재 프레임 경과 시간 (s)
 * @property {number}    elapsedTime      게임 시작 후 총 경과 시간 (s)
 * @property {boolean}   paused
 */

// ─────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────

/**
 * 정적 게임 데이터 모음. 런타임에 수정되지 않는다.
 *
 * @typedef {Object} GameData
 * @property {object[]} waveData
 * @property {object[]} upgradeData
 * @property {object[]} weaponData
 * @property {object[]} enemyData
 * @property {object[]} bossData
 * @property {object[]} synergyData
 * @property {object[]} statusEffectData
 */

// ─────────────────────────────────────────────────────────────
// Input
// ─────────────────────────────────────────────────────────────

/**
 * 현재 프레임의 입력 상태.
 *
 * @typedef {Object} InputState
 * @property {boolean} up
 * @property {boolean} down
 * @property {boolean} left
 * @property {boolean} right
 * @property {{ x: number, y: number }} mousePosition   화면 좌표 (px)
 */

// ─────────────────────────────────────────────────────────────
// Pipeline Context (각 System.update()에 전달)
// ─────────────────────────────────────────────────────────────

/**
 * 파이프라인 컨텍스트 — 각 System.update(ctx) 의 매개변수 타입.
 *
 * AGENTS.md §5 참조:
 *   System 안으로 전체 PlayContext 객체를 보내지 않고
 *   필요한 상태 필드만 분해해서 쓰는 것이 권장된다.
 *
 * 예시:
 *   update({ world, data, services }) { ... }
 *   update({ world: { player, enemies, deltaTime } }) { ... }
 *
 * @typedef {Object} PipelineContext
 * @property {WorldState}  world
 * @property {InputState}  input
 * @property {GameData}    data
 * @property {Services}    services
 */

export {};  // JSDoc 전용 모듈 — 런타임 export 없음
