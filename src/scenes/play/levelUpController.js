import { transitionPlayMode, PlayMode } from '../../state/PlayMode.js';
import { UpgradeSystem } from '../../systems/progression/UpgradeSystem.js';

function buildOwnedRequirementTokens(player) {
  const tokens = new Set();

  for (const weapon of player?.weapons ?? []) {
    if (weapon?.id) tokens.add(weapon.id);
  }

  for (const accessory of player?.accessories ?? []) {
    if (!accessory?.id) continue;
    tokens.add(accessory.id);
    tokens.add(`acc_${accessory.id}`);
  }

  for (const upgradeId of player?.acquiredUpgrades ?? []) {
    if (upgradeId) tokens.add(upgradeId);
  }

  return tokens;
}

function buildChoiceRequirementTokens(choice) {
  const tokens = new Set();
  if (!choice) return tokens;

  if (choice.id) tokens.add(choice.id);

  if (choice.type === 'weapon_new' || choice.type === 'weapon_upgrade' || choice.type === 'weapon_evolution') {
    if (choice.weaponId) tokens.add(choice.weaponId);
    if (choice.resultWeaponId) tokens.add(choice.resultWeaponId);
  }

  if (choice.type === 'accessory' || choice.type === 'accessory_upgrade') {
    if (choice.accessoryId) {
      tokens.add(choice.accessoryId);
      tokens.add(`acc_${choice.accessoryId}`);
    }
  }

  return tokens;
}

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

function hasSynergyRelation(choice, player, data) {
  const candidateTokens = buildChoiceRequirementTokens(choice);
  if (candidateTokens.size === 0) return false;

  const ownedTokens = buildOwnedRequirementTokens(player);
  const synergies = data?.synergyData ?? [];

  return synergies.some((synergy) => {
    const requirements = synergy?.requires ?? [];
    const matchesChoice = requirements.some((requirement) => candidateTokens.has(requirement));
    if (!matchesChoice) return false;

    return requirements.some((requirement) => !candidateTokens.has(requirement) && ownedTokens.has(requirement));
  });
}

function decorateChoicesWithRelations(choices, player, data) {
  const weaponById = new Map((data?.weaponData ?? []).map((weapon) => [weapon.id, weapon]));
  const accessoryById = new Map((data?.accessoryData ?? []).map((accessory) => [accessory.id, accessory]));

  return (choices ?? []).map((choice) => {
    const relatedHints = [];
    if (hasEvolutionRelation(choice, player, data)) relatedHints.push('진화 연관');
    if (hasSynergyRelation(choice, player, data)) relatedHints.push('시너지 연관');

    let icon = choice?.icon;
    if (!icon && choice?.type === 'weapon_evolution') {
      icon = weaponById.get(choice?.resultWeaponId)?.icon ?? weaponById.get(choice?.weaponId)?.icon;
    } else if (!icon && (choice?.type === 'weapon_new' || choice?.type === 'weapon_upgrade' || choice?.type === 'weapon')) {
      icon = weaponById.get(choice?.weaponId)?.icon;
    } else if (!icon && (choice?.type === 'accessory' || choice?.type === 'accessory_upgrade')) {
      icon = accessoryById.get(choice?.accessoryId)?.icon;
    }

    return {
      ...choice,
      ...(relatedHints.length > 0 ? { relatedHints } : {}),
      ...(icon ? { icon } : {}),
    };
  });
}

export function createLevelUpController({
  getWorld,
  getData = () => null,
  isBlocked = () => false,
  showLevelUp,
}) {
  function getCurrentWorld() {
    const world = getWorld?.();
    return world ?? null;
  }

  function getCurrentData() {
    return getData?.() ?? null;
  }

  function show() {
    const world = getCurrentWorld();
    if (!world) return;

    const choices = world.pendingLevelUpChoices || [];
    if (choices.length === 0) {
      world.levelUpActionMode = 'select';
      transitionPlayMode(world, PlayMode.PLAYING);
      return;
    }

    const isChest = world.pendingLevelUpType === 'chest';
    const title = isChest ? '📦 상자 보상!' : '⬆ LEVEL UP';
    const decoratedChoices = decorateChoicesWithRelations(choices, world.player, getCurrentData());

    showLevelUp?.({
      choices: decoratedChoices,
      title,
      rerollsRemaining: world.runRerollsRemaining ?? 0,
      banishesRemaining: world.runBanishesRemaining ?? 0,
      banishMode: world.levelUpActionMode === 'banish',
      onSelect: (selectedUpgrade, index) => select(selectedUpgrade, index),
      onReroll: (index) => reroll(index),
      onToggleBanishMode: () => toggleBanishMode(),
    });
  }

  function select(selectedUpgrade, index) {
    const world = getCurrentWorld();
    if (!world || isBlocked()) return;
    if (world.levelUpActionMode === 'banish') {
      banish(index);
      return;
    }
    world.levelUpActionMode = 'select';
    world.pendingUpgrade = selectedUpgrade;
    transitionPlayMode(world, PlayMode.PLAYING);
  }

  function reroll(index) {
    const world = getCurrentWorld();
    if (!world || isBlocked()) return;
    if ((world.runRerollsRemaining ?? 0) <= 0) return;

    const currentChoices = world.pendingLevelUpChoices || [];
    const nextChoices = UpgradeSystem.replaceChoiceAtIndex(
      world.player,
      currentChoices,
      index,
      { banishedUpgradeIds: world.banishedUpgradeIds ?? [], rng: world.rng },
      getCurrentData(),
    );
    if (!nextChoices[index] || nextChoices[index]?.id === currentChoices[index]?.id) {
      show();
      return;
    }

    world.runRerollsRemaining = Math.max(0, (world.runRerollsRemaining ?? 0) - 1);
    world.pendingLevelUpChoices = nextChoices.filter(Boolean);
    show();
  }

  function toggleBanishMode() {
    const world = getCurrentWorld();
    if (!world || isBlocked()) return;

    const canEnter = (world.runBanishesRemaining ?? 0) > 0;
    if (world.levelUpActionMode === 'banish') {
      world.levelUpActionMode = 'select';
    } else if (canEnter) {
      world.levelUpActionMode = 'banish';
    }
    show();
  }

  function banish(index) {
    const world = getCurrentWorld();
    if (!world || isBlocked()) return;
    if ((world.runBanishesRemaining ?? 0) <= 0) return;

    const currentChoices = world.pendingLevelUpChoices || [];
    const targetChoice = currentChoices[index];
    if (!targetChoice) return;

    const nextBanishedIds = [...new Set([...(world.banishedUpgradeIds ?? []), targetChoice.id])];
    const replacedChoices = UpgradeSystem.replaceChoiceAtIndex(
      world.player,
      currentChoices,
      index,
      { banishedUpgradeIds: nextBanishedIds, rng: world.rng },
      getCurrentData(),
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
      transitionPlayMode(world, PlayMode.PLAYING);
      return;
    }

    show();
  }

  return {
    show,
    select,
    reroll,
    toggleBanishMode,
  };
}
