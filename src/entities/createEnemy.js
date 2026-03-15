import { generateId } from '../utils/ids.js';
import { getEnemyDataById } from '../data/enemyData.js';

/**
 * createEnemy — 적 엔티티 생성
 *
 * PATCH:
 *   [refactor] chargeEffect 필드 추가.
 *     EliteBehaviorSystem windup 페이즈에서 hitFlashTimer 남용 대신
 *     전용 플래그로 돌진 예고 연출을 표현.
 *   [refactor] knockbackResist 필드 추가 (enemyData 에서 읽음, 기본 0).
 *     DamageSystem 에서 넉백량 조정에 사용.
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

    // PATCH: 돌진 예고 전용 플래그 (hitFlashTimer 남용 제거)
    chargeEffect: false,

    // 넉백 상태
    knockbackX: 0,
    knockbackY: 0,
    knockbackTimer: 0,

    // PATCH: 넉백 저항 (0 = 풀 넉백, 1 = 완전 무시)
    knockbackResist: data.knockbackResist ?? 0,

    // 상태이상
    statusEffects: [],
    stunned: false,

    // 엘리트/보스 여부
    isElite: data.isElite || false,
    isBoss:  data.isBoss  || false,

    // 행동 패턴
    behaviorId:    data.behaviorId    ?? 'chase',
    behaviorState: data.behaviorState ? data.behaviorState() : null,

    // 엘리트 투사체 설정 (circle_dash 등)
    projectileConfig: data.projectileConfig ?? null,

    // 사망 시 파생 스폰
    deathSpawn: data.deathSpawn ?? null,

    isAlive: true,
    pendingDestroy: false,
  };
}
