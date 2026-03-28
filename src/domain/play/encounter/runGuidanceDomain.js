import { buildUnlockGuideEntries } from '../../meta/progression/unlockGuidanceDomain.js';
import { getStageById } from '../../../data/stageData.js';

function buildFallbackObjective() {
  return {
    id: 'survive_longer',
    title: '생존 시간을 늘리기',
    progressText: '현재 런에서 더 오래 버티기',
    rewardText: '다음 해금 후보 탐색',
    icon: '✦',
  };
}

function buildRecommendedBuild({ session = null, stage = null, gameData = {} } = {}) {
  const baseWeaponId = session?.meta?.selectedStartWeaponId ?? null;
  if (!baseWeaponId) return null;

  const recipes = gameData?.weaponEvolutionData ?? [];
  const recipe = recipes.find((entry) => entry?.requires?.weaponId === baseWeaponId);
  if (!recipe) return null;

  const weaponById = new Map((gameData?.weaponData ?? []).map((weapon) => [weapon?.id, weapon]));
  const accessoryById = new Map((gameData?.accessoryData ?? []).map((accessory) => [accessory?.id, accessory]));
  const baseWeaponName = weaponById.get(baseWeaponId)?.name ?? baseWeaponId;
  const resultWeaponName = weaponById.get(recipe.resultWeaponId)?.name ?? recipe.resultWeaponId;
  const accessoryNames = (recipe.requires?.accessoryIds ?? []).map((accessoryId) => (
    accessoryById.get(accessoryId)?.name ?? accessoryId
  ));
  const stageContext = stage?.stageDirective?.title ?? stage?.name ?? '현재 스테이지';
  const accessoryText = accessoryNames.length > 0
    ? `핵심 장신구 ${accessoryNames.join(', ')}`
    : '핵심 장신구 없이 완성 가능';

  return {
    id: recipe.id ?? `recommended_${baseWeaponId}`,
    title: `${resultWeaponName} Route`,
    detail: `${stageContext}에서 ${baseWeaponName}를 ${resultWeaponName}로 완성하세요. ${accessoryText}.`,
    baseWeaponId,
    baseWeaponName,
    targetEvolutionId: recipe.resultWeaponId,
    targetEvolutionName: resultWeaponName,
    targetAccessoryIds: [...(recipe.requires?.accessoryIds ?? [])],
    targetAccessoryNames: accessoryNames,
  };
}

export function buildRunGuidanceSnapshot({ session = null, gameData = {} } = {}) {
  const selectedStageId = session?.meta?.selectedStageId ?? null;
  const stageCatalog = Array.isArray(gameData?.stageData) && gameData.stageData.length > 0
    ? gameData.stageData
    : null;
  const stage = stageCatalog?.find((entry) => entry?.id === selectedStageId)
    ?? getStageById(selectedStageId);
  const entries = buildUnlockGuideEntries(session, gameData.unlockData, 1);
  const primaryObjective = entries[0]
    ? {
        id: entries[0].id,
        title: entries[0].title,
        progressText: entries[0].progressText,
        rewardText: entries[0].rewardText,
        icon: entries[0].icon,
      }
    : buildFallbackObjective();

  const stageDirective = stage?.stageDirective
    ? {
        title: stage.stageDirective.title ?? stage.name ?? 'Stage Directive',
        detail: stage.stageDirective.detail ?? stage.description ?? '',
      }
    : null;

  const recommendedBuild = buildRecommendedBuild({ session, stage, gameData });

  return { primaryObjective, stageDirective, recommendedBuild };
}
