import { buildAccessoryCurrentDesc, buildAccessoryUpgradeDesc } from '../../data/accessoryDataHelpers.js';
import { getNextWeaponProgression, getWeaponProgressionForLevel } from '../../data/weaponProgressionData.js';
import {
  isAccessoryDiscovered,
  isEvolutionDiscovered,
  isWeaponDiscovered,
} from '../../domain/meta/codex/codexDiscoveryDomain.js';
import { hasSynergyRelation } from '../../progression/synergyRuntime.js';

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

function normalizeSummaryText(text) {
  const value = String(text ?? '').trim();
  if (!value) return null;

  return value
    .replace(/\s+/g, ' ')
    .replace(/입니다\.$/, '')
    .replace(/합니다\.$/, '')
    .replace(/니다\.$/, '')
    .replace(/\.$/, '');
}

function buildWeaponAcquireSummary(definition, fallbackName) {
  if (!definition) return fallbackName ? `${fallbackName} 획득` : null;

  switch (definition.behaviorId) {
    case 'boomerang':
      return '회전 부메랑 획득';
    case 'laserBeam':
      return '관통 레이저 획득';
    case 'groundZone':
      return definition.id === 'venom_bog' ? '독성 늪 획득' : '지속 화염 지대 획득';
    case 'ricochetProjectile':
      return '도약 탄환 획득';
    case 'chainLightning':
      return '연쇄 번개 획득';
    case 'orbit':
      return '회전 구체 획득';
    case 'areaBurst':
      return definition.orbitsPlayer ? '근접 광역 오라 획득' : '광역 폭발 획득';
    case 'targetProjectile':
      return (definition.pierce ?? 0) > 1 ? '직선 관통 투사체 획득' : '추적 투사체 획득';
    default:
      return normalizeSummaryText(definition.description) ?? `${definition.name ?? fallbackName ?? '무기'} 획득`;
  }
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

function resolveSummaryText(choice, {
  previewText,
  currentText,
  weaponById,
  accessoryById,
} = {}) {
  if (previewText) return normalizeSummaryText(previewText);

  if (choice?.type === 'weapon_new') {
    return buildWeaponAcquireSummary(weaponById?.get(choice?.weaponId), choice?.name);
  }

  if (choice?.type === 'weapon_evolution') {
    const resultWeapon = weaponById?.get(choice?.resultWeaponId);
    return resultWeapon?.name ? `${resultWeapon.name} 무기로 진화` : normalizeSummaryText(choice?.description) ?? choice?.name ?? null;
  }

  if (choice?.type === 'accessory') {
    return normalizeSummaryText(accessoryById?.get(choice?.accessoryId)?.description)
      ?? normalizeSummaryText(choice?.description)
      ?? choice?.name
      ?? null;
  }

  if (choice?.type === 'stat') {
    return normalizeSummaryText(choice?.description) ?? choice?.name ?? null;
  }

  return normalizeSummaryText(choice?.description)
    ?? normalizeSummaryText(currentText)
    ?? choice?.name
    ?? null;
}

function resolvePriorityHint(relatedHints) {
  if (relatedHints.includes('진화 연관')) {
    return { priorityHint: '진화 빌드 연결', priorityHintType: 'evolution' };
  }

  if (relatedHints.includes('시너지 연관')) {
    return { priorityHint: '시너지 빌드 연결', priorityHintType: 'synergy' };
  }

  return {};
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
    const summaryText = resolveSummaryText(choice, {
      previewText,
      currentText,
      weaponById,
      accessoryById,
    });
    const priorityHintState = resolvePriorityHint(relatedHints);

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
    choices: decorateLevelUpChoices(choices, world.entities.player, data),
    title: isChest ? '📦 상자 보상!' : '⬆ LEVEL UP',
    rerollsRemaining: world.progression.runRerollsRemaining ?? 0,
    banishesRemaining: world.progression.runBanishesRemaining ?? 0,
    banishMode: world.progression.levelUpActionMode === 'banish',
  };
}
