/**
 * src/entities/createEnemy.js
 *
 * FIX(BUG-PHASE-FLAGS): resetEnemy 시 _phaseFlags 초기화 누락 버그 수정
 *
 *   재현 시나리오:
 *     1. 보스 스폰 → BossPhaseSystem이 enemy._phaseFlags = [false, false, false] 초기화
 *     2. 보스 페이즈 전환 3회 발동 → _phaseFlags = [true, true, true]
 *     3. 보스 사망 → ObjectPool.release() 로 반환
 *     4. 같은 타입 보스 재스폰 → ObjectPool.acquire() → resetEnemy() 호출
 *     5. resetEnemy()가 _phaseFlags를 null로 초기화하지 않음
 *        → _phaseFlags = [true, true, true] (이전 보스 상태 그대로)
 *     6. BossPhaseSystem: `if (!enemy._phaseFlags)` → [true,true,true]는 truthy
 *        → 초기화 건너뜀 → 새 보스의 모든 페이즈가 "이미 발동"으로 오판
 *        → 페이즈 전환이 영구 불능 (침묵 버그)
 *
 *   수정: resetEnemy() 및 createEnemy() 반환 객체에 `_phaseFlags: null` 명시
 */

import { generateId }       from '../utils/ids.js';
import { getEnemyDataById } from '../data/enemyData.js';

export function createEnemy(enemyId = 'zombie', x = 0, y = 0) {
  const data = getEnemyDataById(enemyId);

  if (!data) {
    console.warn(`[createEnemy] Unknown enemy id: "${enemyId}"`);
    return null;
  }

  return {
    id:              generateId(),
    type:            'enemy',
    enemyDataId:     data.id,
    name:            data.name,
    x, y,
    hp:              data.hp,
    maxHp:           data.hp,
    moveSpeed:       data.moveSpeed,
    damage:          data.damage,
    xpValue:         data.xpValue,
    radius:          data.radius,
    color:           data.color,
    hitFlashTimer:   0,
    chargeEffect:    false,
    knockbackX:      0, knockbackY: 0, knockbackTimer: 0,
    knockbackResist: data.knockbackResist ?? 0,
    statusEffects:   [],
    stunned:         false,
    isElite:         data.isElite  || false,
    isBoss:          data.isBoss   || false,
    behaviorId:      data.behaviorId     ?? 'chase',
    behaviorState:   data.behaviorState  ? data.behaviorState() : null,
    projectileConfig: data.projectileConfig ?? null,
    deathSpawn:      data.deathSpawn ?? null,
    _phaseFlags:     null,   // FIX: BossPhaseSystem이 lazy-init, null이어야 초기화 진행
    isAlive:         true,
    pendingDestroy:  false,
  };
}

export function resetEnemy(enemy, config) {
  const { enemyId, x, y } = config;
  const data = getEnemyDataById(enemyId);
  if (!data) {
    console.warn(`[resetEnemy] Unknown enemy id: "${enemyId}"`);
    return null;
  }

  enemy.id               = generateId();
  enemy.type             = 'enemy';
  enemy.enemyDataId      = data.id;
  enemy.name             = data.name;
  enemy.x                = x;
  enemy.y                = y;
  enemy.hp               = data.hp;
  enemy.maxHp            = data.hp;
  enemy.moveSpeed        = data.moveSpeed;
  enemy.damage           = data.damage;
  enemy.xpValue          = data.xpValue;
  enemy.radius           = data.radius;
  enemy.color            = data.color;
  enemy.hitFlashTimer    = 0;
  enemy.chargeEffect     = false;
  enemy.knockbackX       = 0;
  enemy.knockbackY       = 0;
  enemy.knockbackTimer   = 0;
  enemy.knockbackResist  = data.knockbackResist ?? 0;
  enemy.statusEffects    = [];
  enemy.stunned          = false;
  enemy.isElite          = data.isElite  || false;
  enemy.isBoss           = data.isBoss   || false;
  enemy.behaviorId       = data.behaviorId     ?? 'chase';
  enemy.behaviorState    = data.behaviorState  ? data.behaviorState() : null;
  enemy.projectileConfig = data.projectileConfig ?? null;
  enemy.deathSpawn       = data.deathSpawn ?? null;
  // FIX(BUG-PHASE-FLAGS): 풀 재사용 시 반드시 null 리셋
  // Array([true,true,true])가 남아 있으면 BossPhaseSystem이 초기화를 건너뜀
  enemy._phaseFlags      = null;
  enemy.isAlive          = true;
  enemy.pendingDestroy   = false;

  return enemy;
}
