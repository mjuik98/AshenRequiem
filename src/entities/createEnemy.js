import { generateId } from '../utils/ids.js';
import { getEnemyDataById } from '../data/enemyData.js';

/**
 * createEnemy — 적 엔티티 생성
 * @param {string} enemyId — enemyData의 id
 * @param {number} x
 * @param {number} y
 */
export function createEnemy(enemyId, x, y) {
  const data = getEnemyDataById(enemyId);
  if (!data) {
    console.warn(`Unknown enemy id: ${enemyId}`);
    return null;
  }

  return {
    id: generateId(),
    type: 'enemy',
    enemyDataId: data.id,
    name: data.name,
    x,
    y,
    hp: data.hp,
    maxHp: data.hp,
    moveSpeed: data.moveSpeed,
    damage: data.damage,
    xpValue: data.xpValue,
    radius: data.radius,
    color: data.color,

    // 피격 플래시
    hitFlashTimer: 0,

    // 넉백 상태
    knockbackX: 0,
    knockbackY: 0,
    knockbackTimer: 0,

    // 상태이상
    statusEffects: [],
    stunned: false,

    // 엘리트/보스 여부
    isElite: data.isElite || false,
    isBoss:  data.isBoss  || false,

    // 행동 패턴 — behaviorState는 data 팩토리 함수로 복사해 런타임 상태 격리
    behaviorId:    data.behaviorId    || 'chase',
    behaviorState: data.behaviorState ? data.behaviorState() : null,

    // 사망 시 파생 스폰 (슬라임 분열 등)
    deathSpawn: data.deathSpawn || null,

    isAlive: true,
    pendingDestroy: false,
  };
}
