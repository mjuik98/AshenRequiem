import { collectChoiceRelatedHints } from './levelUpChoice/choiceRelations.js';
import {
  resolveCurrentText,
  resolveChoiceIcon,
  resolveDiscoveryLabel,
  resolveLevelLabel,
  resolvePreviewText,
} from './levelUpChoice/choiceMetadata.js';
import { resolvePriorityHint, isRecommendedBuildChoice } from './levelUpChoice/choicePriorityHints.js';
import { resolveSummaryText } from './levelUpChoice/choiceSummary.js';

export function decorateLevelUpChoices(choices, player, data) {
  const weaponById = new Map((data?.weaponData ?? []).map((weapon) => [weapon.id, weapon]));
  const accessoryById = new Map((data?.accessoryData ?? []).map((accessory) => [accessory.id, accessory]));
  const session = data?.session ?? null;
  const recommendedBuild = data?.guidance?.recommendedBuild ?? null;

  return (choices ?? []).map((choice) => {
    const relatedHints = collectChoiceRelatedHints(choice, player, data);
    const icon = resolveChoiceIcon(choice, weaponById, accessoryById);
    const levelLabel = resolveLevelLabel(choice, player);
    const currentText = resolveCurrentText(choice, player, weaponById, accessoryById);
    const discoveryLabel = resolveDiscoveryLabel(choice, session);
    const previewText = resolvePreviewText(choice, player, accessoryById);
    const summaryText = resolveSummaryText(choice, {
      previewText,
      currentText,
      weaponById,
      accessoryById,
    });
    const priorityHintState = resolvePriorityHint(relatedHints, {
      isRecommended: isRecommendedBuildChoice(choice, recommendedBuild),
    });

    return {
      ...choice,
      ...(relatedHints.length > 0 ? { relatedHints } : {}),
      ...(icon ? { icon } : {}),
      ...(levelLabel ? { levelLabel } : {}),
      ...(summaryText ? { summaryText } : {}),
      ...priorityHintState,
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
    choices: decorateLevelUpChoices(choices, world.entities.player, {
      ...(data ?? {}),
      guidance: world?.run?.guidance ?? null,
    }),
    title: isChest ? '📦 상자 보상!' : '⬆ LEVEL UP',
    rerollsRemaining: world.progression.runRerollsRemaining ?? 0,
    banishesRemaining: world.progression.runBanishesRemaining ?? 0,
    banishMode: world.progression.levelUpActionMode === 'banish',
  };
}
