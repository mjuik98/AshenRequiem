import { spawnProjectile } from '../../state/spawnRequest.js';
import { findClosestEnemy, getProjectileLifetimeMult } from './weaponBehaviorUtils.js';

export function laserBeam({ weapon, player, enemies, spawnQueue }) {
  const target = findClosestEnemy(player, enemies, weapon.range ?? 320);
  if (!target) return false;

  const dx = target.x - player.x;
  const dy = target.y - player.y;
  const len = Math.hypot(dx, dy) || 1;
  const dirX = dx / len;
  const dirY = dy / len;
  const beamLength = weapon.beamLength ?? 240;
  const beamSegments = Math.max(1, weapon.beamSegments ?? 4);
  const segmentGap = beamLength / beamSegments;
  const lifetime = (weapon.beamLifetime ?? 0.12) * getProjectileLifetimeMult(player);

  for (let i = 0; i < beamSegments; i++) {
    const distance = segmentGap * (i + 0.5);
    spawnQueue.push(spawnProjectile({
      x: player.x + dirX * distance,
      y: player.y + dirY * distance,
      config: {
        x: player.x + dirX * distance,
        y: player.y + dirY * distance,
        dirX,
        dirY,
        speed: 0,
        damage: weapon.damage,
        radius: weapon.radius ?? 12,
        color: weapon.projectileColor,
        pierce: weapon.pierce ?? 999,
        maxRange: 0,
        maxLifetime: lifetime,
        behaviorId: 'laserBeam',
        ownerId: player.id,
        beamAngle: Math.atan2(dirY, dirX),
        beamLength: segmentGap,
        statusEffectId: weapon.statusEffectId ?? null,
        statusEffectChance: weapon.statusEffectChance ?? 1.0,
      },
    }));
  }

  return true;
}
