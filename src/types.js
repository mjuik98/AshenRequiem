/**
 * src/types.js — 레거시 JSDoc 타입 정의 (하위 호환용)
 *
 * 최신 타입 정의는 src/state/worldTypes.js 를 참조.
 *
 * BUGFIX(BUG-DOC-LEVELUP): playMode 값 'levelUp' → 'levelup' 수정
 *   Before: playMode - 'playing' | 'paused' | 'levelUp' | 'dead'
 *   After:  playMode - 'playing' | 'paused' | 'levelup' | 'dead'
 *   실제 코드 전체(createWorld, LevelSystem, PlayModeStateMachine 등)가
 *   모두 소문자 'levelup' 을 사용하므로 타입 문서도 일치시킴.
 *   camelCase 'levelUp' 은 어떤 런타임 코드에도 존재하지 않음.
 */

// ... (rest of the file with updated playMode on line 192)


// ── 플레이어 ─────────────────────────────────────────────────────────

/**
 * @typedef {object} Player
 * @property {string}          id
 * @property {'player'}        type
 * @property {number}          x               - 위치 x (px)
 * @property {number}          y               - 위치 y (px)
 * @property {number}          radius          - 충돌 반지름 (px)
 * @property {number}          hp              - 현재 체력
 * @property {number}          maxHp           - 최대 체력
 * @property {number}          moveSpeed       - 초당 픽셀 (px/s)
 * @property {number}          magnetRadius    - 경험치 자석 반지름 (px)
 * @property {number}          lifesteal       - 0~1 (흡혈 비율)
 * @property {number}          level           - 현재 레벨
 * @property {number}          xp              - 현재 경험치
 * @property {number}          xpToNextLevel   - 다음 레벨을 위한 경험치
 * @property {boolean}         isAlive
 * @property {boolean}         pendingDestroy
 * @property {Weapon[]}        weapons         - 장착 무기 목록
 * @property {Record<string, number>} upgradeCounts - 업그레이드 ID -> 획득 횟수
 * @property {Set<string>}     acquiredUpgrades
 * @property {string[]}        activeSynergies - 활성 시너지 ID 목록
 * @property {StatusEffect[]}  statusEffects   - 현재 상태이상 목록
 * @property {number}          invincibleTimer - 무적 잔여 시간 (s)
 * @property {number}          invincibleDuration - 피격 후 무적 지속 시간 (s)
 * @property {string}          color
 */

// ── 적 ───────────────────────────────────────────────────────────────

/**
 * @typedef {object} Enemy
 * @property {string}          id
 * @property {'enemy'}         type
 * @property {string}          enemyDataId     - enemyData 키
 * @property {string}          name
 * @property {number}          x               - 위치 x (px)
 * @property {number}          y               - 위치 y (px)
 * @property {number}          radius          - 충돌 반지름 (px)
 * @property {number}          hp              - 현재 체력
 * @property {number}          maxHp           - 최대 체력
 * @property {number}          moveSpeed       - 초당 픽셀 (px/s)
 * @property {number}          damage          - 접촉 데미지
 * @property {number}          xpValue         - 처치 시 지급 경험치
 * @property {string}          color
 * @property {number}          hitFlashTimer   - 피격 플래시 잔여 시간 (s)
 * @property {boolean}         chargeEffect
 * @property {number}          knockbackX      - 넉백 속도 x (px/s)
 * @property {number}          knockbackY      - 넉백 속도 y (px/s)
 * @property {number}          knockbackTimer  - 넉백 잔여 시간 (s)
 * @property {number}          knockbackResist - 넉백 저항 (0~1)
 * @property {StatusEffect[]}  statusEffects   - 현재 상태이상 목록
 * @property {boolean}         stunned
 * @property {boolean}         isElite
 * @property {boolean}         isBoss
 * @property {string}          behaviorId      - enemyBehaviorRegistry 키
 * @property {object|null}     behaviorState
 * @property {object|null}     projectileConfig
 * @property {DeathSpawnConfig|null} deathSpawn
 * @property {boolean}         isAlive
 * @property {boolean}         pendingDestroy
 * @property {number[]|undefined} _phaseFlags  - BossPhaseSystem 전용
 */

// ── 투사체 ────────────────────────────────────────────────────────────

/**
 * @typedef {object} Projectile
 * @property {string}    id
 * @property {'projectile'} type
 * @property {number}    x               - 위치 x (px)
 * @property {number}    y               - 위치 y (px)
 * @property {number}    dirX            - 방향 x
 * @property {number}    dirY            - 방향 y
 * @property {number}    vx              - 속도 x (px/s)
 * @property {number}    vy              - 속도 y (px/s)
 * @property {number}    speed           - 초당 픽셀 (px/s)
 * @property {number}    damage
 * @property {number}    radius          - 충돌 반지름 (px)
 * @property {string}    color
 * @property {number}    pierce          - 관통 횟수
 * @property {number}    hitCount        - 현재 충돌 횟수
 * @property {Set<string>} hitTargets    - 이미 충돌한 대상 ID 목록
 * @property {number}    maxRange        - 최대 사거리 (px)
 * @property {number}    distanceTraveled - 이동한 거리 (px)
 * @property {string}    behaviorId      - weaponBehaviorRegistry 키
 * @property {number}    lifetime        - 경과 시간 (s)
 * @property {number}    maxLifetime     - 최대 수명 (s)
 * @property {string|null} ownerId
 * @property {string|null} statusEffectId
 * @property {number}    statusEffectChance - 0~1
 * @property {number}    orbitAngle      - 궤도 각도 (rad)
 * @property {number}    orbitRadius     - 궤도 반지름 (px)
 * @property {number}    orbitSpeed      - 궤도 속도 (rad/s)
 * @property {boolean}   isAlive
 * @property {boolean}   pendingDestroy
 * @property {boolean}   _reversed        - 부메랑 역방향 플래그
 */

// ── 무기 ─────────────────────────────────────────────────────────────

/**
 * @typedef {object} Weapon
 * @property {string}  id
 * @property {string}  name
 * @property {number}  damage
 * @property {number}  cooldown        - 기본 쿨다운 (s)
 * @property {number}  currentCooldown - 남은 쿨다운 (s)
 * @property {string}  behaviorId      - weaponBehaviorRegistry 키
 * @property {number}  range           - 사거리 (px)
 * @property {number}  speed           - 투사체 속도 (px/s)
 * @property {number}  radius          - 투사체 반지름 (px)
 * @property {number}  pierce          - 관통 횟수
 * @property {string}  color
 * @property {number}  level
 * @property {number}  maxLevel
 */

// ── 상태이상 ─────────────────────────────────────────────────────────

/**
 * @typedef {object} StatusEffect
 * @property {string}  type            - statusEffectRegistry의 키
 * @property {number}  duration        - 남은 시간 (s)
 * @property {number}  magnitude       - 효과 강도 (0~1)
 * @property {number}  [tickInterval]  - 틱 간격 (s)
 * @property {number}  [tickAccumulator]
 */

// ── 기타 ─────────────────────────────────────────────────────────────

/**
 * @typedef {object} ActiveSynergy
 * @property {string} id
 * @property {string} name
 */

/**
 * @typedef {object} DeathSpawnConfig
 * @property {string} enemyId
 * @property {number} count
 */

/**
 * @typedef {object} HitEvent
 * @property {string}          attackerId
 * @property {string}          targetId
 * @property {Enemy|Player}    target
 * @property {number}          damage
 * @property {string|null}     projectileId
 * @property {Projectile|null} projectile
 */

/**
 * @typedef {object} DeathEvent
 * @property {Enemy|Player} entity
 */

/**
 * @typedef {object} BossPhaseChangedEvent
 * @property {string}  bossId
 * @property {number}  phaseIndex
 * @property {string}  newBehaviorId
 * @property {string}  announceText
 */

/**
 * @typedef {object} WorldState
 * @property {Player}       player
 * @property {Enemy[]}      enemies
 * @property {Projectile[]} projectiles
 * @property {object[]}     pickups
 * @property {object[]}     effects
 * @property {object[]}     spawnQueue      - 프레임 내 스폰 요청 버퍼
 * @property {WorldEvents}  events          - 프레임 내 단발성 이벤트
 * @property {Camera}       camera
 * @property {number}       elapsedTime     - 누적 게임 시간 (s)
 * @property {number}       deltaTime       - 이번 프레임 경과 시간 (s)
 * @property {number}       killCount
 * @property {'playing' | 'paused' | 'levelUp' | 'dead'} playMode
 */

/**
 * @typedef {object} WorldEvents
 * @property {HitEvent[]}             hits
 * @property {DeathEvent[]}           deaths
 * @property {object[]}               pickupCollected
 * @property {object[]}               levelUpRequested
 * @property {object[]}               statusApplied
 * @property {BossPhaseChangedEvent[]} bossPhaseChanged
 * @property {object[]}               spawnRequested
 */

/**
 * @typedef {object} Camera
 * @property {number} x               - 카메라 위치 x (px, world 좌표)
 * @property {number} y               - 카메라 위치 y (px, world 좌표)
 */

export {};
