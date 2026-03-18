/**
 * src/state/worldTypes.js — world 객체 JSDoc 타입 명세 (완성판)
 *
 * P3-① 개선: 모든 필드에 단위 명시 완성
 *
 * 단위 규약(AGENTS.md §6.7):
 *   - 속도: px/s
 *   - 쿨다운/시간: s (초)
 *   - 거리/크기: px
 *   - 배율: 무단위 배수 (1.0 = 기본값)
 *   - 각도: rad (라디안)
 */

// ─── Entity 타입 ─────────────────────────────────────────────────────────

/**
 * @typedef {Object} PlayerEntity
 * @property {string}   id
 * @property {'player'} type
 * @property {number}   x                   위치 x (px)
 * @property {number}   y                   위치 y (px)
 * @property {number}   hp                  현재 체력
 * @property {number}   maxHp               최대 체력
 * @property {number}   radius              충돌 반지름 (px)
 * @property {number}   speed               이동 속도 (px/s)
 * @property {boolean}  isAlive
 * @property {boolean}  pendingDestroy
 * @property {number}   invincibleTimer     무적 잔여 시간 (s)
 * @property {number}   invincibleDuration  피격 후 무적 지속 시간 (s)
 * @property {number}   xp                  현재 경험치
 * @property {number}   level               현재 레벨
 * @property {number}   xpToNextLevel       다음 레벨까지 필요 xp
 * @property {number}   lifesteal           흡혈 비율 (0~1, 0 = 없음)
 * @property {number}   magnetRadius        경험치 자석 반지름 (px)
 * @property {WeaponState[]} weapons        장착 무기 목록
 * @property {Record<string, number>} upgradeCounts  업그레이드 ID → 획득 횟수
 * @property {string[]} activeSynergies     활성 시너지 ID 목록
 * @property {StatusEffect[]} statusEffects 현재 상태이상 목록
 * @property {number}   [_synergyDamageBonus]  시너지 데미지 배율 (내부, px/s 아님)
 * @property {number}   [_synergySeedBonus]    시너지 속도 배율 (내부)
 * @property {number}   [_synergyHpBonus]      시너지 체력 보너스 (내부)
 */

/**
 * @typedef {Object} WeaponState
 * @property {string}  id
 * @property {number}  level           무기 레벨 (1~maxLevel)
 * @property {number}  currentCooldown 현재 쿨다운 잔여 (s)
 * @property {number}  cooldown        기본 쿨다운 (s)
 * @property {number}  damage          기본 데미지
 * @property {number}  radius          투사체 반지름 (px)
 * @property {number}  pierce          관통 횟수 (0 = 관통 없음)
 * @property {string}  [behaviorId]    weaponBehaviorRegistry 키
 */

/**
 * @typedef {Object} EnemyEntity
 * @property {string}   id
 * @property {'enemy'}  type
 * @property {string}   enemyId         enemyData 키
 * @property {number}   x               위치 x (px)
 * @property {number}   y               위치 y (px)
 * @property {number}   hp              현재 체력
 * @property {number}   maxHp           최대 체력
 * @property {number}   radius          충돌 반지름 (px)
 * @property {number}   damage          접촉 데미지
 * @property {number}   speed           이동 속도 (px/s)
 * @property {number}   xpValue         처치 시 지급 경험치
 * @property {boolean}  isAlive
 * @property {boolean}  pendingDestroy
 * @property {number}   knockbackTimer  넉백 잔여 시간 (s)
 * @property {number}   knockbackX      넉백 속도 x 성분 (px/s)
 * @property {number}   knockbackY      넉백 속도 y 성분 (px/s)
 * @property {number}   hitFlashTimer   피격 플래시 잔여 시간 (s)
 * @property {boolean}  [stunned]
 * @property {string}   [behaviorId]    enemyBehaviorRegistry 키
 * @property {StatusEffect[]} [statusEffects] 상태이상 목록
 */

/**
 * @typedef {Object} ProjectileEntity
 * @property {string}  id
 * @property {string}  ownerId         발사자 ID
 * @property {number}  x               위치 x (px)
 * @property {number}  y               위치 y (px)
 * @property {number}  vx              속도 x 성분 (px/s)
 * @property {number}  vy              속도 y 성분 (px/s)
 * @property {number}  radius          충돌 반지름 (px)
 * @property {number}  damage          충돌 데미지
 * @property {number}  pierce          남은 관통 횟수
 * @property {number}  [angle]         방향 각도 (rad) — boomerang 등
 * @property {number}  [lifetime]      최대 수명 (s)
 * @property {number}  [age]           현재 경과 시간 (s)
 * @property {boolean} isAlive
 * @property {boolean} pendingDestroy
 * @property {string}  [behaviorId]    weaponBehaviorRegistry / drawBehaviorRegistry 키
 * @property {string}  [color]         CSS 색상 문자열
 */

/**
 * @typedef {Object} PickupEntity
 * @property {string}  id
 * @property {number}  x               위치 x (px)
 * @property {number}  y               위치 y (px)
 * @property {number}  radius          충돌 반지름 (px)
 * @property {number}  xpValue         획득 경험치
 * @property {boolean} isAlive
 * @property {boolean} pendingDestroy
 * @property {boolean} magnetized      자석 흡인 활성 여부
 */

/**
 * @typedef {Object} EffectEntity
 * @property {string}  id
 * @property {string}  effectType      drawEffectRegistry 키
 * @property {number}  x               위치 x (px)
 * @property {number}  y               위치 y (px)
 * @property {boolean} isAlive
 * @property {number}  lifetime        현재 잔여 수명 (s)
 * @property {number}  maxLifetime     최대 수명 (s)
 * @property {string}  [color]
 * @property {string}  [text]          damageText용
 */

/**
 * @typedef {Object} StatusEffect
 * @property {string}  type        'burn' | 'freeze' | 'stun' | 'slow' | ...
 * @property {number}  duration    남은 지속 시간 (s)
 * @property {number}  [magnitude] 효과 강도 (0~1, 예: slow 0.5 = 50% 감속)
 * @property {number}  [tickDmg]   틱 데미지 (s당)
 * @property {number}  [tickTimer] 다음 틱까지 남은 시간 (s)
 */

// ─── World ───────────────────────────────────────────────────────────────

/**
 * @typedef {Object} Camera
 * @property {number} x  카메라 위치 x (px, world 좌표)
 * @property {number} y  카메라 위치 y (px, world 좌표)
 */

/**
 * @typedef {Object} WorldEvents
 * @property {import('./pipelineTypes.js').HitEvent[]}    hits
 * @property {import('./pipelineTypes.js').DeathEvent[]}  deaths
 * @property {object[]}  pickupCollected
 * @property {object[]}  levelUpRequested
 * @property {object[]}  statusApplied
 * @property {object[]}  bossPhaseChanged
 * @property {object[]}  spawnRequested
 */

/**
 * 프레임 간 런타임 게임 상태.
 * System은 이 객체를 읽고 쓰지만, Scene은 직접 game rule을 계산하지 않는다.
 *
 * @typedef {Object} WorldState
 * @property {PlayerEntity}      player
 * @property {EnemyEntity[]}     enemies
 * @property {ProjectileEntity[]} projectiles
 * @property {PickupEntity[]}    pickups
 * @property {EffectEntity[]}    effects
 * @property {object[]}          spawnQueue      프레임 내 스폰 요청 버퍼
 * @property {WorldEvents}       events          프레임 내 단발성 이벤트
 * @property {Camera}            camera
 * @property {number}            elapsedTime     게임 경과 시간 (s)
 * @property {number}            deltaTime       이번 프레임 경과 시간 (s)
 * @property {number}            killCount       누적 킬 수
 * @property {'playing'|'paused'|'levelup'|'dead'} playMode
 */

export {};
