import { generateId }       from '../utils/ids.js';
import { getEnemyDataById } from '../data/enemyData.js';

/**
 * createEnemy — 적 엔티티 생성
 *
 * FIX: 기존 코드의 데드코드 제거
 *   기존: const data = getEnemyDataById(enemyId) || { id: 'zombie', name: 'Dummy', ... }
 *         → || fallback으로 data가 항상 truthy이므로 바로 아래 if (!data) 분기는
 *           절대 실행되지 않는 dead branch였음.
 *   수정: fallback 제거, 조회 실패 시 즉시 null 반환으로 명확화
 */
/**
 * 새 적 엔티티를 생성한다.
 *
 * @param {string} enemyId
 * @param {number} x
 * @param {number} y
 * @returns {object|null}  알 수 없는 enemyId면 null 반환
 */
export function createEnemy(enemyId = 'zombie', x = 0, y = 0) {
  const data = getEnemyDataById(enemyId);

  // [Q-④] FIX: fallback 제거 → 명확한 null 반환
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
    isAlive:         true,
    pendingDestroy:  false,
  };
}

/**
 * resetEnemy — ObjectPool 반환 후 재초기화
 *
 * CHANGE(P2-④): enemy ObjectPool 지원을 위해 추가
 *   - createFn: () => createEnemy('zombie', 0, 0)  (더미 초기값)
 *   - resetFn:  (enemy, config) => resetEnemy(enemy, config)
 *
 * @param {object} enemy  - 풀에서 꺼낸 기존 적 객체
 * @param {{ enemyId: string, x: number, y: number }} config
 * @returns {object|null} 초기화된 enemy, 알 수 없는 id면 null
 */
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
  enemy.isAlive          = true;
  enemy.pendingDestroy   = false;

  return enemy;
}
