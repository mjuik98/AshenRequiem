import { buildAccessoryCurrentDesc, buildAccessoryUpgradeDesc } from '../../../data/accessoryDataHelpers.js';
import { getNextWeaponProgression, getWeaponProgressionForLevel } from '../../../data/weaponProgressionData.js';
import {
  isAccessoryDiscovered,
  isEvolutionDiscovered,
  isWeaponDiscovered,
} from '../../../domain/meta/codex/codexDiscoveryDomain.js';

export function resolveChoiceIcon(choice, weaponById, accessoryById) {
  let icon = choice?.icon;

  if (!icon && choice?.type === 'weapon_evolution') {
    icon = weaponById.get(choice?.resultWeaponId)?.icon ?? weaponById.get(choice?.weaponId)?.icon;
  } else if (!icon && (choice?.type === 'weapon_new' || choice?.type === 'weapon_upgrade' || choice?.type === 'weapon')) {
    icon = weaponById.get(choice?.weaponId)?.icon;
  } else if (!icon && (choice?.type === 'accessory' || choice?.type === 'accessory_upgrade')) {
    icon = accessoryById.get(choice?.accessoryId)?.icon;
  }

  return icon;
}

export function resolveLevelLabel(choice, player) {
  if (choice?.type === 'weapon_upgrade') {
    const weapon = player?.weapons?.find((entry) => entry?.id === choice?.weaponId);
    const currentLevel = Number(weapon?.level ?? 0);
    if (currentLevel > 0) return `Lv ${currentLevel} → Lv ${currentLevel + 1}`;
  }

  if (choice?.type === 'accessory_upgrade') {
    const accessory = player?.accessories?.find((entry) => entry?.id === choice?.accessoryId);
    const currentLevel = Number(accessory?.level ?? 0);
    if (currentLevel > 0) return `Lv ${currentLevel} → Lv ${currentLevel + 1}`;
  }

  return null;
}

export function resolveDiscoveryLabel(choice, session) {
  if (choice?.type === 'weapon_new' && choice?.weaponId && !isWeaponDiscovered(session, choice.weaponId)) {
    return '도감 신규';
  }

  if (choice?.type === 'accessory' && choice?.accessoryId && !isAccessoryDiscovered(session, choice.accessoryId)) {
    return '도감 신규';
  }

  if (choice?.type === 'weapon_evolution' && choice?.resultWeaponId && !isEvolutionDiscovered(session, choice.resultWeaponId)) {
    return '도감 신규';
  }

  return null;
}

export function resolvePreviewText(choice, player, accessoryById) {
  if (choice?.type === 'weapon_upgrade') {
    const weapon = player?.weapons?.find((entry) => entry?.id === choice?.weaponId);
    return getNextWeaponProgression(weapon)?.description ?? null;
  }

  if (choice?.type === 'accessory_upgrade') {
    const accessoryDefinition = accessoryById.get(choice?.accessoryId);
    return accessoryDefinition ? buildAccessoryUpgradeDesc(accessoryDefinition) : null;
  }

  return null;
}

export function resolveCurrentText(choice, player, weaponById, accessoryById) {
  if (choice?.type === 'weapon_upgrade') {
    const weapon = player?.weapons?.find((entry) => entry?.id === choice?.weaponId);
    const currentLevel = Number(weapon?.level ?? 0);
    if (!weapon?.id || currentLevel <= 0) return null;
    if (currentLevel === 1) {
      return weaponById.get(weapon.id)?.description ?? choice?.description ?? null;
    }
    return getWeaponProgressionForLevel(weapon.id, currentLevel)?.description
      ?? weaponById.get(weapon.id)?.description
      ?? choice?.description
      ?? null;
  }

  if (choice?.type === 'accessory_upgrade') {
    const accessory = player?.accessories?.find((entry) => entry?.id === choice?.accessoryId);
    const accessoryDefinition = accessoryById.get(choice?.accessoryId);
    const currentLevel = Number(accessory?.level ?? 0);
    if (!accessoryDefinition || currentLevel <= 0) return null;
    return buildAccessoryCurrentDesc(accessoryDefinition, currentLevel).join(', ');
  }

  return null;
}
