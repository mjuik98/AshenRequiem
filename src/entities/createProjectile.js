import { generateId } from '../utils/ids.js';

/**
 * createProjectile — 투사체 엔티티 생성
 *
 * PATCH:
 *   [bug]  lifetime || 0 → lifetime ?? 0  (|| 는 0을 falsy로 처리)
 *          maxLifetime || 0.3 → maxLifetime ?? 0.3
 *   [refactor] resetProjectile 함수 export — PlayScene 내 _resetProjectile 대체.
 *              ObjectPool 리셋 책임을 entity 모듈에 귀속.
 *   [perf] hitTargets: new Set()  (기존 유지 확인)
 */
export function createProjectile(config) {
  return {
    id: generateId(),
    type: 'projectile',
    x: config.x ?? 0,
    y: config.y ?? 0,
    dirX: config.dirX ?? 0,
    dirY: config.dirY ?? 0,
    speed: config.speed ?? 300,
    damage: config.damage ?? 1,
    radius: config.radius ?? 5,
    color: config.color ?? '#ffee58',
    pierce: config.pierce ?? 1,
    hitCount: 0,
    /** 이미 타격한 적 id 집합 (관통 시 중복 타격 방지) */
    hitTargets: new Set(),
    maxRange: config.maxRange ?? 400,
    distanceTraveled: 0,
    /** behaviorId: 'targetProjectile' | 'areaBurst' | 'orbit' */
    behaviorId: config.behaviorId ?? 'targetProjectile',
    /** areaBurst / orbit 공용 수명 — PATCH: || → ?? */
    lifetime: config.lifetime ?? 0,
    maxLifetime: config.maxLifetime ?? 0.3,
    ownerId: config.ownerId ?? null,

    statusEffectId: config.statusEffectId ?? null,
    statusEffectChance: config.statusEffectChance ?? 1.0,

    // orbit 전용 필드
    orbitAngle:  config.orbitAngle  ?? 0,
    orbitRadius: config.orbitRadius ?? 80,
    orbitSpeed:  config.orbitSpeed  ?? Math.PI,

    isAlive: true,
    pendingDestroy: false,
  };
}

/**
 * resetProjectile — ObjectPool 리셋 함수 (export)
 *
 * PATCH(refactor): PlayScene._resetProjectile 에서 이곳으로 이동.
 *   createProjectile 과 동일 필드 목록을 유지해야 한다.
 */
export function resetProjectile(obj, cfg) {
  obj.id   = generateId();
  obj.type = 'projectile';
  obj.x    = cfg.x ?? 0;
  obj.y    = cfg.y ?? 0;
  obj.dirX  = cfg.dirX  ?? 0;
  obj.dirY  = cfg.dirY  ?? 0;
  obj.speed  = cfg.speed  ?? 300;
  obj.damage = cfg.damage ?? 1;
  obj.radius = cfg.radius ?? 5;
  obj.color  = cfg.color  ?? '#ffee58';
  obj.pierce   = cfg.pierce   ?? 1;
  obj.hitCount = 0;
  obj.hitTargets.clear();
  obj.maxRange         = cfg.maxRange  ?? 400;
  obj.distanceTraveled = 0;
  obj.behaviorId       = cfg.behaviorId  ?? 'targetProjectile';
  obj.lifetime         = cfg.lifetime    ?? 0;
  obj.maxLifetime      = cfg.maxLifetime ?? 0.3;
  obj.ownerId          = cfg.ownerId     ?? null;
  obj.statusEffectId     = cfg.statusEffectId     ?? null;
  obj.statusEffectChance = cfg.statusEffectChance ?? 1.0;
  obj.orbitAngle  = cfg.orbitAngle  ?? 0;
  obj.orbitRadius = cfg.orbitRadius ?? 80;
  obj.orbitSpeed  = cfg.orbitSpeed  ?? Math.PI;
  obj.isAlive        = true;
  obj.pendingDestroy = false;
}
