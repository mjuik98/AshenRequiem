import { getPermanentUpgradeById } from './permanentUpgradeCatalog.js';

export function applyPermanentUpgrades(player, perm) {
  if (!player || !perm) return player;

  for (const [id, level] of Object.entries(perm)) {
    if (!level || level <= 0) continue;
    const def = getPermanentUpgradeById(id);
    if (!def) continue;

    const { stat, valuePerLevel } = def.effect;
    const total = valuePerLevel * level;

    switch (stat) {
      case 'damageMult':
        player.globalDamageMult = (player.globalDamageMult ?? 1) + total;
        break;

      case 'maxHp':
        player.maxHp += total;
        player.hp += total;
        break;

      case 'critChance':
        player.critChance = (player.critChance ?? 0.05) + total;
        break;

      case 'critMultiplier':
        player.critMultiplier = (player.critMultiplier ?? 2.0) + total;
        break;

      case 'cooldownMult':
        player.cooldownMult = Math.max(0.1, (player.cooldownMult ?? 1.0) + total);
        break;

      case 'projectileSpeedMult':
        player.projectileSpeedMult = (player.projectileSpeedMult ?? 1.0) + total;
        break;

      case 'projectileSizeMult':
        player.projectileSizeMult = (player.projectileSizeMult ?? 1.0) + total;
        break;

      case 'xpMult':
        player.xpMult = (player.xpMult ?? 1.0) + total;
        break;

      case 'currencyMult':
        player.currencyMult = (player.currencyMult ?? 1.0) + total;
        break;

      case 'projectileLifetimeMult':
        player.projectileLifetimeMult = (player.projectileLifetimeMult ?? 1.0) + total;
        break;

      case 'curse':
        player.curse = (player.curse ?? 0) + total;
        break;

      case 'maxWeaponSlots':
        player.maxWeaponSlots = (player.maxWeaponSlots ?? 3) + total;
        break;

      case 'maxAccessorySlots':
        player.maxAccessorySlots = (player.maxAccessorySlots ?? 3) + total;
        break;

      case 'bonusProjectileCount':
        player.bonusProjectileCount = (player.bonusProjectileCount ?? 0) + total;
        break;

      case 'rerollCharge':
      case 'banishCharge':
        break;

      default:
        player[stat] = (player[stat] ?? 0) + total;
        break;
    }
  }

  if ((player.globalDamageMult ?? 1) !== 1) {
    player.weapons?.forEach((weapon) => {
      weapon.damage = Math.max(1, Math.round(weapon.damage * player.globalDamageMult));
    });
  }

  player.hp = player.maxHp;
  return player;
}
