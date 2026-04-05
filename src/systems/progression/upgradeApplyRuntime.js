import {
  getAccessoryDef,
  getNextProgression,
  getWeaponDef,
} from '../../domain/play/progression/upgradeChoicePool.js';
export { applyAccessoryEffects } from '../../domain/play/progression/accessoryEffectRuntime.js';
import { applyAccessoryEffects } from '../../domain/play/progression/accessoryEffectRuntime.js';

export function applyUpgradeRuntime(player, upgrade, data = {}) {
  if (upgrade.type === 'weapon_new') {
    const definition = getWeaponDef(upgrade.weaponId, data);
    if (!definition) return;

    const newWeapon = { ...definition, currentCooldown: 0, level: 1 };
    if (player.globalDamageMult && player.globalDamageMult !== 1) {
      newWeapon.damage = Math.max(1, Math.round(newWeapon.damage * player.globalDamageMult));
    }
    player.weapons.push(newWeapon);
    return;
  }

  if (upgrade.type === 'weapon_evolution') {
    const evolvedDef = getWeaponDef(upgrade.resultWeaponId, data);
    if (!evolvedDef) return;

    const weaponIndex = player.weapons.findIndex((weapon) => weapon.id === upgrade.weaponId);
    if (weaponIndex === -1) return;

    const evolvedWeapon = {
      ...evolvedDef,
      currentCooldown: 0,
      level: 1,
    };
    if (player.globalDamageMult && player.globalDamageMult !== 1) {
      evolvedWeapon.damage = Math.max(1, Math.round((evolvedWeapon.damage ?? 1) * player.globalDamageMult));
    }

    player.weapons.splice(weaponIndex, 1, evolvedWeapon);
    player.evolvedWeapons = player.evolvedWeapons ?? new Set();
    player.evolvedWeapons.add(upgrade.recipeId ?? upgrade.id);
    return;
  }

  if (upgrade.type === 'weapon_upgrade') {
    const ownedWeapon = player.weapons.find((weapon) => weapon.id === upgrade.weaponId);
    if (!ownedWeapon) return;
    const nextProgression = getNextProgression(ownedWeapon, data);
    if (!nextProgression) return;

    ownedWeapon.level = nextProgression.level;

    const damageDelta = nextProgression.damageDelta ?? 0;
    if (damageDelta !== 0) {
      ownedWeapon.damage = (ownedWeapon.damage || 1) + damageDelta;
    }

    const cooldownMult = nextProgression.cooldownMult ?? 1;
    if (cooldownMult !== 1) {
      ownedWeapon.cooldown = Math.max(0.1, (ownedWeapon.cooldown || 1) * cooldownMult);
    }

    const orbitRadiusDelta = nextProgression.orbitRadiusDelta ?? 0;
    if (orbitRadiusDelta > 0 && ownedWeapon.orbitRadius !== undefined) {
      ownedWeapon.orbitRadius += orbitRadiusDelta;
    }

    const orbitCountDelta = nextProgression.orbitCountDelta ?? 0;
    if (orbitCountDelta > 0 && ownedWeapon.orbitCount !== undefined) {
      ownedWeapon.orbitCount += orbitCountDelta;
    }

    const pierceDelta = nextProgression.pierceDelta ?? 0;
    if (pierceDelta > 0 && ownedWeapon.pierce !== undefined
        && ownedWeapon.behaviorId !== 'orbit' && ownedWeapon.behaviorId !== 'areaBurst') {
      ownedWeapon.pierce += pierceDelta;
    }

    const projectileCountDelta = nextProgression.projectileCountDelta ?? 0;
    if (projectileCountDelta > 0) {
      ownedWeapon.projectileCount = (ownedWeapon.projectileCount ?? 1) + projectileCountDelta;
    }

    const radiusDelta = nextProgression.radiusDelta ?? 0;
    if (radiusDelta > 0) {
      if (ownedWeapon.radius !== undefined) ownedWeapon.radius += radiusDelta;
      if (ownedWeapon.range !== undefined) ownedWeapon.range += radiusDelta;
    }

    const chainCountDelta = nextProgression.chainCountDelta ?? 0;
    if (chainCountDelta > 0 && ownedWeapon.chainCount !== undefined) {
      ownedWeapon.chainCount += chainCountDelta;
    }

    const beamLengthDelta = nextProgression.beamLengthDelta ?? 0;
    if (beamLengthDelta > 0 && ownedWeapon.beamLength !== undefined) {
      ownedWeapon.beamLength += beamLengthDelta;
    }

    const bounceCountDelta = nextProgression.bounceCountDelta ?? 0;
    if (bounceCountDelta > 0 && ownedWeapon.bounceCount !== undefined) {
      ownedWeapon.bounceCount += bounceCountDelta;
      if (ownedWeapon.pierce !== undefined) {
        ownedWeapon.pierce = Math.max(ownedWeapon.pierce, ownedWeapon.bounceCount + 1);
      }
    }
    return;
  }

  if (upgrade.type === 'accessory') {
    const definition = getAccessoryDef(upgrade.accessoryId, data);
    if (!definition || (player.accessories?.length ?? 0) >= (player.maxAccessorySlots ?? 3)) return;

    player.accessories = player.accessories ?? [];
    const newAccessory = { ...definition, level: 1 };
    player.accessories.push(newAccessory);
    applyAccessoryEffects(player, definition.effects ?? []);
    return;
  }

  if (upgrade.type === 'accessory_upgrade') {
    const ownedAccessory = player.accessories?.find((accessory) => accessory.id === upgrade.accessoryId);
    if (!ownedAccessory) return;
    const definition = getAccessoryDef(upgrade.accessoryId, data);
    const maxLevel = definition?.maxLevel ?? 5;
    if ((ownedAccessory.level ?? 1) >= maxLevel) return;

    ownedAccessory.level = (ownedAccessory.level ?? 1) + 1;
    const levelUpEffects = (definition?.effects ?? []).map((effect) => {
      if (effect.stat === 'damageMult') {
        return { stat: effect.stat, value: 1 + (effect.valuePerLevel ?? 0) };
      }
      return { stat: effect.stat, value: effect.valuePerLevel ?? 0 };
    }).filter((effect) => {
      if (effect.stat === 'damageMult') {
        return effect.value !== 1;
      }
      return effect.value !== 0;
    });
    applyAccessoryEffects(player, levelUpEffects);
    return;
  }

  if (upgrade.type === 'stat') {
    const effect = upgrade.effect;
    if (!effect) return;

    if (effect.stat === 'hp') {
      player.hp = Math.min(player.maxHp, player.hp + effect.value);
    } else if (effect.stat === 'maxHp') {
      player.maxHp += effect.value;
      player.hp += effect.value;
    } else if (player[effect.stat] !== undefined) {
      player[effect.stat] += effect.value;
    } else {
      player[effect.stat] = (player[effect.stat] ?? 0) + effect.value;
    }
  }
}
