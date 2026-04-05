import { hasSynergyRelation } from '../../../domain/play/progression/synergyRuntime.js';

export function hasEvolutionRelation(choice, player, data) {
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

export function collectChoiceRelatedHints(choice, player, data) {
  const relatedHints = [];
  if (hasEvolutionRelation(choice, player, data)) relatedHints.push('진화 연관');
  if (hasSynergyRelation(choice, player, data?.synergyData ?? [])) relatedHints.push('시너지 연관');
  return relatedHints;
}
