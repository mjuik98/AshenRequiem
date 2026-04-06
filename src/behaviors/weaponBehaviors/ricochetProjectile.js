import { findClosestEnemy, getProjectileLifetimeMult, spawnDirectionalProjectiles } from './weaponBehaviorUtils.js';
import { buildRicochetBehaviorState } from '../../entities/projectileBehaviorState.js';

export function ricochetProjectile({ weapon, player, enemies, spawnQueue }) {
  const target = findClosestEnemy(player, enemies, weapon.range ?? 360);
  if (!target) return false;

  const bounceCount = Math.max(0, weapon.bounceCount ?? 2);
  const lifetimeMult = getProjectileLifetimeMult(player);
  const speed = weapon.projectileSpeed ?? 320;
  const maxRange = (weapon.range ?? 360) * lifetimeMult;
  const maxLifetime = speed > 0 && maxRange > 0
    ? maxRange / speed
    : undefined;

  spawnDirectionalProjectiles({
    ...weapon,
    pierce: Math.max(weapon.pierce ?? 1, bounceCount + 1),
  }, player, target, spawnQueue, {
    behaviorId: 'ricochetProjectile',
    bounceRemaining: bounceCount,
    maxLifetime,
    behaviorState: buildRicochetBehaviorState(),
  });

  return true;
}
