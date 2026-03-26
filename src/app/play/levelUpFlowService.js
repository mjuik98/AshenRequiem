import { transitionPlayMode, PlayMode } from '../../state/PlayMode.js';
import { buildAccessoryCurrentDesc, buildAccessoryUpgradeDesc } from '../../data/accessoryDataHelpers.js';
import { getNextWeaponProgression, getWeaponProgressionForLevel } from '../../data/weaponProgressionData.js';
import {
  isAccessoryDiscovered,
  isEvolutionDiscovered,
  isWeaponDiscovered,
} from '../../domain/meta/codex/codexDiscoveryDomain.js';
import { hasSynergyRelation } from '../../progression/synergyRuntime.js';
import { replaceUpgradeChoiceAtIndex } from '../../progression/upgradeChoiceRuntime.js';

function hasEvolutionRelation(choice, player, data) {
  const recipes = data?.weaponEvolutionData ?? [];

  if (choice?.type === 'accessory' || choice?.type === 'accessory_upgrade') {
    const accessoryId = choice.accessoryId;
    return recipes.some((recipe) =>
      recipe?.requires?.accessoryIds?.includes(accessoryId)
      && player?.weapons?.some((weapon) => weapon.id === recipe?.requires?.weaponId)
      && recipe?.requires?.accessoryIds?.every((requiredAccessoryId) =>
        requiredAccessoryId === accessoryId
        || player?.accessories?.some((accessory) => accessory.id === requiredAccessoryId)
      )
    );
  }

  if (choice?.type === 'weapon_new' || choice?.type === 'weapon_upgrade') {
    const weaponId = choice.weaponId;
    return recipes.some((recipe) =>
      recipe?.requires?.weaponId === weaponId
      && recipe?.requires?.accessoryIds?.length > 0
      && recipe?.requires?.accessoryIds?.every((accessoryId) =>
        player?.accessories?.some((accessory) => accessory.id === accessoryId)
      )
    );
  }

  return false;
}

function resolveChoiceIcon(choice, weaponById, accessoryById) {
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

function resolveLevelLabel(choice, player) {
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

function resolveDiscoveryLabel(choice, session) {
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

function resolvePreviewText(choice, player, accessoryById) {
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

function resolveCurrentText(choice, player, weaponById, accessoryById) {
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

export function decorateLevelUpChoices(choices, player, data) {
  const weaponById = new Map((data?.weaponData ?? []).map((weapon) => [weapon.id, weapon]));
  const accessoryById = new Map((data?.accessoryData ?? []).map((accessory) => [accessory.id, accessory]));
  const session = data?.session ?? null;

  return (choices ?? []).map((choice) => {
    const relatedHints = [];
    if (hasEvolutionRelation(choice, player, data)) relatedHints.push('진화 연관');
    if (hasSynergyRelation(choice, player, data?.synergyData ?? [])) relatedHints.push('시너지 연관');

    const icon = resolveChoiceIcon(choice, weaponById, accessoryById);
    const levelLabel = resolveLevelLabel(choice, player);
    const currentText = resolveCurrentText(choice, player, weaponById, accessoryById);
    const discoveryLabel = resolveDiscoveryLabel(choice, session);
    const previewText = resolvePreviewText(choice, player, accessoryById);

    return {
      ...choice,
      ...(relatedHints.length > 0 ? { relatedHints } : {}),
      ...(icon ? { icon } : {}),
      ...(levelLabel ? { levelLabel } : {}),
      ...(currentText ? { currentLabel: '현재 효과', currentText } : {}),
      ...(previewText ? { previewLabel: '다음 Lv 효과', previewText } : {}),
      ...(discoveryLabel ? { discoveryLabel } : {}),
    };
  });
}

export function buildLevelUpOverlayState(world, data) {
  const choices = world?.progression?.pendingLevelUpChoices ?? [];
  if (choices.length === 0) return null;

  const isChest = world.progression.pendingLevelUpType === 'chest';

  return {
    choices: decorateLevelUpChoices(choices, world.entities.player, data),
    title: isChest ? '📦 상자 보상!' : '⬆ LEVEL UP',
    rerollsRemaining: world.progression.runRerollsRemaining ?? 0,
    banishesRemaining: world.progression.runBanishesRemaining ?? 0,
    banishMode: world.progression.levelUpActionMode === 'banish',
  };
}

export function resumeFromLevelUp(world, transition = transitionPlayMode) {
  if (!world) return false;
  world.progression.levelUpActionMode = 'select';
  transition(world, PlayMode.PLAYING);
  return true;
}

export function selectLevelUpChoice(world, selectedUpgrade, { transition = transitionPlayMode } = {}) {
  if (!world) return false;
  world.progression.levelUpActionMode = 'select';
  world.progression.pendingUpgrade = selectedUpgrade;
  transition(world, PlayMode.PLAYING);
  return true;
}

export function rerollLevelUpChoice(world, index, data) {
  if (!world || (world.progression.runRerollsRemaining ?? 0) <= 0) return false;

  const currentChoices = world.progression.pendingLevelUpChoices ?? [];
  const nextChoices = replaceUpgradeChoiceAtIndex(
    world.entities.player,
    currentChoices,
    index,
    { banishedUpgradeIds: world.progression.banishedUpgradeIds ?? [], rng: world.runtime.rng },
    data,
  );

  if (!nextChoices[index] || nextChoices[index]?.id === currentChoices[index]?.id) {
    return false;
  }

  world.progression.runRerollsRemaining = Math.max(0, (world.progression.runRerollsRemaining ?? 0) - 1);
  world.progression.pendingLevelUpChoices = nextChoices.filter(Boolean);
  return true;
}

export function toggleLevelUpBanishMode(world) {
  if (!world) return false;

  const canEnter = (world.progression.runBanishesRemaining ?? 0) > 0;
  if (world.progression.levelUpActionMode === 'banish') {
    world.progression.levelUpActionMode = 'select';
  } else if (canEnter) {
    world.progression.levelUpActionMode = 'banish';
  }

  return world.progression.levelUpActionMode;
}

export function banishLevelUpChoice(
  world,
  index,
  data,
  { transitionPlayMode: transition = transitionPlayMode } = {},
) {
  if (!world || (world.progression.runBanishesRemaining ?? 0) <= 0) return false;

  const currentChoices = world.progression.pendingLevelUpChoices ?? [];
  const targetChoice = currentChoices[index];
  if (!targetChoice) return false;

  const nextBanishedIds = [...new Set([...(world.progression.banishedUpgradeIds ?? []), targetChoice.id])];
  const replacedChoices = replaceUpgradeChoiceAtIndex(
    world.entities.player,
    currentChoices,
    index,
    { banishedUpgradeIds: nextBanishedIds, rng: world.runtime.rng },
    data,
  );
  const nextChoices = [...replacedChoices];

  if (!nextChoices[index] || nextChoices[index]?.id === targetChoice.id) {
    nextChoices.splice(index, 1);
  }

  world.progression.runBanishesRemaining = Math.max(0, (world.progression.runBanishesRemaining ?? 0) - 1);
  world.progression.banishedUpgradeIds = nextBanishedIds;
  world.progression.levelUpActionMode = 'select';
  world.progression.pendingLevelUpChoices = nextChoices.filter((choice) => choice && !nextBanishedIds.includes(choice.id));

  if ((world.progression.pendingLevelUpChoices?.length ?? 0) === 0) {
    transition(world, PlayMode.PLAYING);
    return 'playing';
  }

  return 'banished';
}
