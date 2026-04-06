import { spawnProjectile } from '../../domain/play/state/spawnRequest.js';
import { findClosestEnemy, getProjectileLifetimeMult } from './weaponBehaviorUtils.js';

export function groundZone({ weapon, player, enemies, spawnQueue }) {
  const target = findClosestEnemy(player, enemies, weapon.range ?? 260);
  if (!target) return false;

  const duration = (weapon.zoneDuration ?? 1.8) * getProjectileLifetimeMult(player);

  spawnQueue.push(spawnProjectile({
    x: target.x,
    y: target.y,
    config: {
      x: target.x,
      y: target.y,
      dirX: 0,
      dirY: 0,
      speed: 0,
      damage: weapon.damage,
      radius: weapon.radius ?? 40,
      color: weapon.projectileColor,
      pierce: weapon.pierce ?? 999,
      maxRange: 0,
      maxLifetime: duration,
      behaviorId: 'groundZone',
      projectileVisualId: weapon.projectileVisualId ?? null,
      impactEffectType: weapon.impactEffectType ?? null,
      impactEffectVisualId: weapon.impactEffectVisualId ?? weapon.impactEffectType ?? null,
      ownerId: player.id,
      tickInterval: weapon.zoneTickInterval ?? 0.35,
      tickTimer: 0,
      statusEffectId: weapon.statusEffectId ?? null,
      statusEffectChance: weapon.statusEffectChance ?? 1.0,
    },
  }));

  return true;
}
