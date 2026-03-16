import { generateId }      from '../utils/ids.js';
import { getEnemyDataById } from '../data/enemyData.js';

/** createEnemy — 적 엔티티 생성 */
export function createEnemy(enemyId, x, y) {
  const data = getEnemyDataById(enemyId);
  if (!data) { console.warn(`Unknown enemy id: ${enemyId}`); return null; }
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
    behaviorId:      data.behaviorId    ?? 'chase',
    behaviorState:   data.behaviorState ? data.behaviorState() : null,
    projectileConfig: data.projectileConfig ?? null,
    deathSpawn:      data.deathSpawn ?? null,
    isAlive:         true,
    pendingDestroy:  false,
  };
}
