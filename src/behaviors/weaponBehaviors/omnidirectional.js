/**
 * src/behaviors/weaponBehaviors/omnidirectional.js
 *
 * 전방향 발사 — 플레이어 주위 360도로 균등하게 투사체를 발사한다.
 * 대상(target)이 필요 없으므로 적이 없어도 항상 발사된다.
 * arcane_nova 진화 무기가 이 behavior를 사용한다.
 *
 * weapon.projectileCount 로 발사 수를 제어한다.
 * player.bonusProjectileCount 도 합산된다.
 */

/**
 * @param {{ weapon: object, player: object, enemies: object[], spawnQueue: object[] }} ctx
 * @returns {true}
 */
export function omnidirectional({ weapon, player, spawnQueue }) {
  const count = (weapon.projectileCount ?? 8) + (player?.bonusProjectileCount ?? 0);

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    spawnQueue.push({
      type: 'projectile',
      config: {
        x:    player.x,
        y:    player.y,
        dirX: Math.cos(angle),
        dirY: Math.sin(angle),
        speed:              weapon.projectileSpeed ?? 340,
        damage:             weapon.damage,
        radius:             weapon.radius ?? 7,
        color:              weapon.projectileColor,
        pierce:             weapon.pierce ?? 2,
        maxRange:           weapon.range ?? 460,
        behaviorId:         'targetProjectile',
        ownerId:            player.id,
        statusEffectId:     weapon.statusEffectId     ?? null,
        statusEffectChance: weapon.statusEffectChance ?? 1.0,
      },
    });
  }

  return true;
}
