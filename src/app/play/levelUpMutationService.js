import { transitionPlayMode, PlayMode } from '../../state/PlayMode.js';
import { replaceUpgradeChoiceAtIndex } from '../../domain/play/progression/upgradeChoiceRuntime.js';

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
