import { transitionPlayMode, PlayMode } from '../../state/PlayMode.js';
import { UpgradeSystem } from '../../systems/progression/UpgradeSystem.js';

export function createLevelUpController({
  getWorld,
  isBlocked = () => false,
  showLevelUp,
}) {
  function getCurrentWorld() {
    const world = getWorld?.();
    return world ?? null;
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

    showLevelUp?.({
      choices,
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
      { banishedUpgradeIds: world.banishedUpgradeIds ?? [] },
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
      { banishedUpgradeIds: nextBanishedIds },
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
