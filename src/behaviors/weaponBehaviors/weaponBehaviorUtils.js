/**
 * src/behaviors/weaponBehaviors/weaponBehaviorUtils.js
 *
 * REFACTOR (R-16): getLiveEnemies re-export (entityUtils.js)
 */
import { distanceSq, normalize, sub } from '../../math/Vector2.js';
import { AIMING, AIM_PATTERN } from '../../data/constants/aiming.js';
import { isDead, isLive, getLiveEnemies } from '../../utils/entityUtils.js';
import { spawnProjectile } from '../../state/spawnRequest.js';

export { getLiveEnemies };

const DEFAULT_AIM_SPREAD = AIMING.DEFAULT_SPREAD;
const DEFAULT_AIM_PATTERN = AIM_PATTERN.GUARANTEED_HIT;

/**
 * 플레이어의 투사체 지속시간 배율을 반환한다.
 *
 * @param {object} [player]
 * @returns {number}
 */
export function getProjectileLifetimeMult(player) {
  return Math.max(0.1, player?.projectileLifetimeMult ?? 1.0);
}

function resolveAimForward(player, target) {
  const toTarget = sub(target, player);
  if (Math.abs(toTarget.x) > 1e-6 || Math.abs(toTarget.y) > 1e-6) {
    return normalize(toTarget);
  }

  const facingX = player?.facingX ?? 1;
  const facingY = player?.facingY ?? 0;
  const facingLength = Math.hypot(facingX, facingY);
  if (facingLength > 1e-6) {
    return { x: facingX / facingLength, y: facingY / facingLength };
  }

  return { x: 1, y: 0 };
}

function rotateDirection(direction, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: direction.x * cos - direction.y * sin,
    y: direction.x * sin + direction.y * cos,
  };
}

function getWeaponAimSpread(weapon, fallback = DEFAULT_AIM_SPREAD) {
  return weapon?.aimSpread ?? weapon?.spread ?? fallback;
}

function getWeaponAimPattern(weapon, fallback = DEFAULT_AIM_PATTERN) {
  return weapon?.aimPattern ?? fallback;
}

/**
 * 타겟 중심을 기준으로 횡방향 조준점을 분산해, 짝수 발사 수여도
 * 모든 투사체가 타겟의 피격 반경 안을 지나가도록 방향 벡터를 만든다.
 *
 * aimSpread는 "타겟 깊이에서의 기본 간격"으로 해석하고,
 * aimPattern=guaranteed-hit 인 경우 실제 간격은
 * 타겟 반경과 투사체 반경 합을 넘지 않도록 압축한다.
 *
 * @param {object} weapon
 * @param {object} player
 * @param {object} target
 * @param {number} count
 * @param {number} fallbackSpread
 * @returns {{x:number, y:number}[]}
 */
export function buildTargetedDirections(weapon, player, target, count, fallbackSpread = DEFAULT_AIM_SPREAD) {
  const forward = resolveAimForward(player, target);
  const aimSpread = Math.max(0, getWeaponAimSpread(weapon, fallbackSpread));
  const aimPattern = getWeaponAimPattern(weapon, DEFAULT_AIM_PATTERN);

  if (count <= 1) return [forward];

  if (aimPattern === AIM_PATTERN.WIDE_SPREAD) {
    return Array.from({ length: count }, (_, index) => {
      const offset = (index - (count - 1) / 2) * aimSpread;
      return rotateDirection(forward, offset);
    });
  }

  const right = { x: -forward.y, y: forward.x };
  const projectileRadius = weapon.radius ?? 5;
  const targetRadius = target?.radius ?? projectileRadius;
  const targetDistance = Math.hypot(target.x - player.x, target.y - player.y);
  const baseDistance = targetDistance > 1e-6
    ? targetDistance
    : Math.max(1, targetRadius + projectileRadius);
  const baseAimPoint = targetDistance > 1e-6
    ? target
    : {
        x: player.x + forward.x * baseDistance,
        y: player.y + forward.y * baseDistance,
      };
  const desiredSpacing = Math.max(0, Math.tan(aimSpread) * baseDistance);
  const maxHitOffset = targetRadius + projectileRadius;
  const maxSlot = Math.max(1, (count - 1) / 2);
  const slotSpacing = count > 1
    ? Math.min(desiredSpacing, maxHitOffset / maxSlot)
    : 0;

  return Array.from({ length: count }, (_, index) => {
    const slotOffset = index - (count - 1) / 2;
    const aimPoint = {
      x: baseAimPoint.x + right.x * slotOffset * slotSpacing,
      y: baseAimPoint.y + right.y * slotOffset * slotSpacing,
    };
    return normalize(sub(aimPoint, player));
  });
}

// ─────────────────────────────────────────────────────────────────────
// 근접 적 탐색
// ─────────────────────────────────────────────────────────────────────

/**
 * 기준점(origin)으로부터 maxRange 이내에서 가장 가까운 살아있는 적 반환.
 *
 * @param {{x:number, y:number}} origin
 * @param {object[]}             enemies
 * @param {number}               maxRange
 * @returns {object|null}
 */
export function findClosestEnemy(origin, enemies, maxRange) {
  let closest   = null;
  let minDistSq = maxRange * maxRange;

  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (isDead(e)) continue;
    const dSq = distanceSq(origin, e);
    if (dSq < minDistSq) {
      minDistSq = dSq;
      closest   = e;
    }
  }
  return closest;
}

/**
 * 기준점(origin)으로부터 maxRange 이내에서 가장 가까운 후보 반환.
 * visited Set으로 이미 선택된 적을 제외할 수 있어 chainLightning hop에 적합.
 *
 * @param {{x:number, y:number}} origin
 * @param {object[]}             candidates
 * @param {number}               maxRange
 * @param {Set<string>}          [visited]
 * @returns {object|null}
 */
export function findNearestFrom(origin, candidates, maxRange, visited) {
  let nearest   = null;
  let minDistSq = maxRange * maxRange;

  for (let i = 0; i < candidates.length; i++) {
    const e = candidates[i];
    if (isDead(e)) continue;
    if (visited?.has(e.id)) continue;
    const dSq = distanceSq(origin, e);
    if (dSq < minDistSq) {
      minDistSq = dSq;
      nearest   = e;
    }
  }
  return nearest;
}

// ─────────────────────────────────────────────────────────────────────
// 확산 투사체 생성
// ─────────────────────────────────────────────────────────────────────

/**
 * target 방향으로 weapon.projectileCount 개의 확산 투사체를 spawnQueue에 추가한다.
 *
 * FIX(P2-7): 조준 확산을 데이터로 제어한다.
 *   - aimSpread: 신규 표준 필드
 *   - spread: 하위 호환 필드
 *   - aimPattern:
 *       guaranteed-hit (기본) — 짝수 발사도 타겟 피격 반경 안에 들어오도록 압축
 *       wide-spread        — 기존 팬 아웃 각도 분산 유지
 *
 * weaponData 사용 예:
 *   { id: 'magic_bolt', projectileCount: 2, aimPattern: 'guaranteed-hit', aimSpread: 0.1, ... }
 *   { id: 'astral_pike', projectileCount: 2, aimPattern: 'wide-spread', aimSpread: 0.06, ... }
 *
 * @param {object}   weapon
 * @param {object}   player
 * @param {object}   target      방향 기준 적 엔티티
 * @param {object[]} spawnQueue
 */
export function spawnDirectionalProjectiles(weapon, player, target, spawnQueue, extraConfig = {}) {
  const bonus  = player?.bonusProjectileCount ?? 0;
  const count  = (weapon.projectileCount ?? 1) + Math.floor(bonus);
  const lifetimeMult = getProjectileLifetimeMult(player);
  const aimPattern = getWeaponAimPattern(weapon, DEFAULT_AIM_PATTERN);
  const aimSpread = getWeaponAimSpread(weapon, DEFAULT_AIM_SPREAD);

  const speed = weapon.projectileSpeed ?? 350;
  const maxRange = (weapon.range ?? 0) * lifetimeMult;
  const maxLifetime = speed > 0 && maxRange > 0
    ? maxRange / speed
    : undefined;
  const directions = buildTargetedDirections(weapon, player, target, count);

  for (let i = 0; i < count; i++) {
    const direction = directions[i];

    spawnQueue.push(spawnProjectile({
      weapon,
      x: player.x,
      y: player.y,
      config: {
        dirX:   direction.x,
        dirY:   direction.y,
        speed,
        damage:             weapon.damage,
        radius:             weapon.radius ?? 5,
        color:              weapon.projectileColor,
        pierce:             weapon.pierce ?? 1,
        hitCount:           0,
        maxRange,
        maxLifetime,
        behaviorId:         weapon.behaviorId ?? 'targetProjectile',
        projectileVisualId: weapon.projectileVisualId ?? null,
        impactEffectType:   weapon.impactEffectType ?? null,
        aimPattern,
        aimSpread,
        ownerId:            player.id,
        statusEffectId:     weapon.statusEffectId     ?? null,
        statusEffectChance: weapon.statusEffectChance ?? 1.0,
        ...extraConfig,
      },
    }));
  }
}
