import { transitionPlayMode, PlayMode } from '../state/PlayMode.js';
import { hasSynergyRelation } from './synergyRuntime.js';
import { replaceUpgradeChoiceAtIndex } from './upgradeChoiceRuntime.js';

function hasEvolutionRelation(choice, player, data) {
  const recipes = data?.weaponEvolutionData ?? [];

  if (choice?.type === 'accessory' || choice?.type === 'accessory_upgrade') {
    const accessoryId = choice.accessoryId;
    return recipes.some((recipe) =>
      recipe?.requires?.accessoryIds?.includes(accessoryId)
      && player?.weapons?.some((weapon) => weapon.id === recipe?.requires?.weaponId)
    );
  }

  if (choice?.type === 'weapon_new' || choice?.type === 'weapon_upgrade') {
    const weaponId = choice.weaponId;
    return recipes.some((recipe) =>
      recipe?.requires?.weaponId === weaponId
      && recipe?.requires?.accessoryIds?.some((accessoryId) =>
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

export function decorateLevelUpChoices(choices, player, data) {
  const weaponById = new Map((data?.weaponData ?? []).map((weapon) => [weapon.id, weapon]));
  const accessoryById = new Map((data?.accessoryData ?? []).map((accessory) => [accessory.id, accessory]));

  return (choices ?? []).map((choice) => {
    const relatedHints = [];
    if (hasEvolutionRelation(choice, player, data)) relatedHints.push('진화 연관');
    if (hasSynergyRelation(choice, player, data?.synergyData ?? [])) relatedHints.push('시너지 연관');

    const icon = resolveChoiceIcon(choice, weaponById, accessoryById);

    return {
      ...choice,
      ...(relatedHints.length > 0 ? { relatedHints } : {}),
      ...(icon ? { icon } : {}),
    };
  });
}

export function buildLevelUpOverlayState(world, data) {
  const choices = world?.pendingLevelUpChoices ?? [];
  if (choices.length === 0) return null;

  const isChest = world.pendingLevelUpType === 'chest';

  return {
    choices: decorateLevelUpChoices(choices, world.player, data),
    title: isChest ? '📦 상자 보상!' : '⬆ LEVEL UP',
    rerollsRemaining: world.runRerollsRemaining ?? 0,
    banishesRemaining: world.runBanishesRemaining ?? 0,
    banishMode: world.levelUpActionMode === 'banish',
  };
}

export function resumeFromLevelUp(world, transition = transitionPlayMode) {
  if (!world) return false;
  world.levelUpActionMode = 'select';
  transition(world, PlayMode.PLAYING);
  return true;
}

export function selectLevelUpChoice(world, selectedUpgrade, { transition = transitionPlayMode } = {}) {
  if (!world) return false;
  world.levelUpActionMode = 'select';
  world.pendingUpgrade = selectedUpgrade;
  transition(world, PlayMode.PLAYING);
  return true;
}

export function rerollLevelUpChoice(world, index, data) {
  if (!world || (world.runRerollsRemaining ?? 0) <= 0) return false;

  const currentChoices = world.pendingLevelUpChoices ?? [];
  const nextChoices = replaceUpgradeChoiceAtIndex(
    world.player,
    currentChoices,
    index,
    { banishedUpgradeIds: world.banishedUpgradeIds ?? [], rng: world.rng },
    data,
  );

  if (!nextChoices[index] || nextChoices[index]?.id === currentChoices[index]?.id) {
    return false;
  }

  world.runRerollsRemaining = Math.max(0, (world.runRerollsRemaining ?? 0) - 1);
  world.pendingLevelUpChoices = nextChoices.filter(Boolean);
  return true;
}

export function toggleLevelUpBanishMode(world) {
  if (!world) return false;

  const canEnter = (world.runBanishesRemaining ?? 0) > 0;
  if (world.levelUpActionMode === 'banish') {
    world.levelUpActionMode = 'select';
  } else if (canEnter) {
    world.levelUpActionMode = 'banish';
  }

  return world.levelUpActionMode;
}

export function banishLevelUpChoice(
  world,
  index,
  data,
  { transitionPlayMode: transition = transitionPlayMode } = {},
) {
  if (!world || (world.runBanishesRemaining ?? 0) <= 0) return false;

  const currentChoices = world.pendingLevelUpChoices ?? [];
  const targetChoice = currentChoices[index];
  if (!targetChoice) return false;

  const nextBanishedIds = [...new Set([...(world.banishedUpgradeIds ?? []), targetChoice.id])];
  const replacedChoices = replaceUpgradeChoiceAtIndex(
    world.player,
    currentChoices,
    index,
    { banishedUpgradeIds: nextBanishedIds, rng: world.rng },
    data,
  );
  const nextChoices = [...replacedChoices];

  if (!nextChoices[index] || nextChoices[index]?.id === targetChoice.id) {
    nextChoices.splice(index, 1);
  }

  world.runBanishesRemaining = Math.max(0, (world.runBanishesRemaining ?? 0) - 1);
  world.banishedUpgradeIds = nextBanishedIds;
  world.levelUpActionMode = 'select';
  world.pendingLevelUpChoices = nextChoices.filter((choice) => choice && !nextBanishedIds.includes(choice.id));

  if ((world.pendingLevelUpChoices?.length ?? 0) === 0) {
    transition(world, PlayMode.PLAYING);
    return 'playing';
  }

  return 'banished';
}
