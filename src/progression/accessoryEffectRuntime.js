export function applyAccessoryEffects(player, effects = []) {
  for (const effect of effects) {
    switch (effect.stat) {
      case 'moveSpeed':
        player.moveSpeed += effect.value;
        break;
      case 'maxHp':
        player.maxHp += effect.value;
        player.hp = Math.min(player.hp + effect.value, player.maxHp);
        break;
      case 'lifesteal':
        player.lifesteal = (player.lifesteal ?? 0) + effect.value;
        break;
      case 'magnetRadius':
        player.magnetRadius = (player.magnetRadius ?? 60) + effect.value;
        break;
      case 'invincibleDuration':
        player.invincibleDuration = (player.invincibleDuration ?? 0.5) + effect.value;
        break;
      case 'damageMult':
        (player.weapons ?? []).forEach((weapon) => {
          weapon.damage = Math.max(1, Math.round(weapon.damage * effect.value));
        });
        player.globalDamageMult = (player.globalDamageMult ?? 1) * effect.value;
        break;
      case 'cooldownMult':
        player.cooldownMult = Math.max(0.1, (player.cooldownMult ?? 1.0) + effect.value);
        break;
      case 'projectileSpeedMult':
        player.projectileSpeedMult = (player.projectileSpeedMult ?? 1.0) + effect.value;
        break;
      case 'projectileSizeMult':
        player.projectileSizeMult = (player.projectileSizeMult ?? 1.0) + effect.value;
        break;
      case 'xpMult':
        player.xpMult = (player.xpMult ?? 1.0) + effect.value;
        break;
      case 'projectileLifetimeMult':
        player.projectileLifetimeMult = (player.projectileLifetimeMult ?? 1.0) + effect.value;
        break;
      case 'curse':
        player.curse = (player.curse ?? 0) + effect.value;
        break;
      case 'bonusProjectileCount':
        player.bonusProjectileCount = (player.bonusProjectileCount ?? 0) + effect.value;
        break;
      case 'critChance':
        player.critChance = (player.critChance ?? 0.05) + effect.value;
        break;
      case 'critMultiplier':
        player.critMultiplier = (player.critMultiplier ?? 2.0) + effect.value;
        break;
      default:
        if (player[effect.stat] !== undefined) {
          player[effect.stat] += effect.value;
        }
        break;
    }
  }
}
