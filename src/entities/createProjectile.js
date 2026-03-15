import { generateId } from '../utils/ids.js';

/**
 * createProjectile — 투사체 엔티티 생성
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
    /** 이미 타격한 적 id 목록 (관통 시 중복 타격 방지) */
    hitTargets: [],
    maxRange: config.maxRange || 400,
    distanceTraveled: 0,
    /** behaviorId (areaBurst 등 특수 투사체 구분) */
    behaviorId: config.behaviorId || 'targetProjectile',
    /** areaBurst용 수명 */
    lifetime: config.lifetime || 0,
    maxLifetime: config.maxLifetime || 0.3,
    ownerId: config.ownerId || null,

    statusEffectId: config.statusEffectId || null,
    statusEffectChance: config.statusEffectChance ?? 1.0,

    isAlive: true,
    pendingDestroy: false,
  };
}
