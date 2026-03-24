/**
 * src/entities/createEnemy.js
 *
 * CHANGE(P2-D): 개발 모드 계약 검증 추가
 *   createEnemy() 호출 후 assertEnemyContract()로 엔티티 계약 검증.
 *   프로덕션 빌드에서는 tree-shake되어 제거됨.
 *
 * CHANGE: 보스 페이즈 상태는 underscore 슬롯 대신 bossPhaseState 전용 슬롯에 저장한다.
 */
import { generateId }            from '../utils/ids.js';
import { getEnemyDataById }      from '../data/enemyData.js';
import { assertEnemyContract }   from './validateEntity.js';

function applyCurseSnapshot(enemy, curseSnapshot) {
  if (!curseSnapshot || enemy.isProp) return;

  const hpMult = curseSnapshot.enemyHpMult ?? 1;
  const xpMult = curseSnapshot.enemyXpMult ?? 1;

  enemy.maxHp = Math.max(1, Math.round(enemy.maxHp * hpMult));
  enemy.hp = enemy.maxHp;
  if ((enemy.xpValue ?? 0) > 0) {
    enemy.xpValue = Math.max(1, Math.round(enemy.xpValue * xpMult));
  }
}

export function createEnemy(enemyId = 'zombie', x = 0, y = 0, runtimeConfig = {}) {
  const data = getEnemyDataById(enemyId);

  if (!data) {
    console.warn(`[createEnemy] Unknown enemy id: "${enemyId}"`);
    return null;
  }

  const enemy = {
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
    isProp:          data.isProp || false,
    propDropTableId: data.propDropTableId ?? null,
    propShape:       data.propShape ?? null,
    bossPhaseState:  null,
    isAlive:         true,
    pendingDestroy:  false,
  };

  applyCurseSnapshot(enemy, runtimeConfig.curseSnapshot);

  // CHANGE(P2-D): 개발 모드에서 엔티티 계약 검증 (프로덕션에서 tree-shake)
  assertEnemyContract(enemy);

  return enemy;
}

export function resetEnemy(enemy, config) {
  const { enemyId, x, y, curseSnapshot } = config;
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
  enemy.isProp           = data.isProp || false;
  enemy.propDropTableId  = data.propDropTableId ?? null;
  enemy.propShape        = data.propShape ?? null;
  enemy.bossPhaseState   = null;
  enemy.isAlive          = true;
  enemy.pendingDestroy   = false;
  applyCurseSnapshot(enemy, curseSnapshot);

  return enemy;
}
