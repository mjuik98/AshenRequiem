export function isRecommendedBuildChoice(choice, recommendedBuild) {
  if (!choice || !recommendedBuild) return false;

  if (
    (choice.type === 'weapon_new' || choice.type === 'weapon_upgrade' || choice.type === 'weapon')
    && choice.weaponId === recommendedBuild.baseWeaponId
  ) {
    return true;
  }

  if (
    choice.type === 'weapon_evolution'
    && choice.resultWeaponId === recommendedBuild.targetEvolutionId
  ) {
    return true;
  }

  if (
    (choice.type === 'accessory' || choice.type === 'accessory_upgrade')
    && recommendedBuild.targetAccessoryIds?.includes(choice.accessoryId)
  ) {
    return true;
  }

  return false;
}

export function resolvePriorityHint(relatedHints, { isRecommended = false } = {}) {
  if (isRecommended) {
    return { priorityHint: '추천 빌드 경로', priorityHintType: 'recommended' };
  }

  if (relatedHints.includes('진화 연관')) {
    return { priorityHint: '진화 빌드 연결', priorityHintType: 'evolution' };
  }

  if (relatedHints.includes('시너지 연관')) {
    return { priorityHint: '시너지 빌드 연결', priorityHintType: 'synergy' };
  }

  return {};
}
