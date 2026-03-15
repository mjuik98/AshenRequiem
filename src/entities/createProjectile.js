import { generateId } from '../utils/ids.js';

/**
 * createProjectile — 투사체 엔티티 생성
 *
 * FIX(perf): hitTargets: [] → hitTargets: new Set()
 *   CollisionSystem 에서 .includes() 대신 .has() 사용.
 *   Pierce 무기일수록 hitTargets 가 커지므로 O(1) 조회가 중요.
 *
 * @param {object} config
 */
export function createProjectile(config) {
  return {
    id: generateId(),
    type: 'projectile',
    x: config.x || 0,
    y: config.y || 0,
    dirX: config.dirX || 0,
    dirY: config.dirY || 0,
    speed: config.speed || 300,
    damage: config.damage || 1,
    radius: config.radius || 5,
    color: config.color || '#ffee58',
    pierce: config.pierce || 1,
    hitCount: 0,
    /** 이미 타격한 적 id 집합 (관통 시 중복 타격 방지) — FIX: Set */
    hitTargets: new Set(),
    maxRange: config.maxRange || 400,
    distanceTraveled: 0,
    /** behaviorId: 'targetProjectile' | 'areaBurst' | 'orbit' */
    behaviorId: config.behaviorId || 'targetProjectile',
    /** areaBurst / orbit 공용 수명 */
    lifetime: config.lifetime || 0,
    maxLifetime: config.maxLifetime || 0.3,
    ownerId: config.ownerId || null,

    statusEffectId: config.statusEffectId || null,
    statusEffectChance: config.statusEffectChance ?? 1.0,

    // orbit 전용 필드
    orbitAngle:  config.orbitAngle  ?? 0,
    orbitRadius: config.orbitRadius ?? 80,
    orbitSpeed:  config.orbitSpeed  ?? Math.PI,

    isAlive: true,
    pendingDestroy: false,
  };
}
