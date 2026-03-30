import {
  buildAccessoryCurrentDesc,
  buildAccessoryLevelTimeline,
} from '../../data/accessoryDataHelpers.js';
import { isCodexAccessoryUnlocked } from './codexRecords.js';

const ACCESSORY_RARITY_LABEL = {
  common: '일반',
  rare: '희귀',
};

const EFFECT_CATEGORY_LABEL = {
  all: '전체',
  offense: '전투',
  sustain: '생존',
  utility: '유틸',
};

const ACCESSORY_STATUS_LABEL = {
  all: '전체',
  discovered: '발견',
  locked: '미발견',
};

const OFFENSE_STATS = new Set([
  'damageMult',
  'cooldownMult',
  'projectileSpeedMult',
  'projectileSizeMult',
  'projectileLifetimeMult',
  'critChance',
  'critMultiplier',
  'bonusProjectileCount',
]);

const SUSTAIN_STATS = new Set([
  'maxHp',
  'lifesteal',
  'invincibleDuration',
]);

function getAccessoryEffectText(accessory) {
  const lines = buildAccessoryCurrentDesc(accessory, 1);
  return lines[0] ?? accessory?.description ?? '';
}

function getAccessoryEffectCategory(accessory) {
  const effects = accessory?.effects ?? [];
  if (effects.some((effect) => OFFENSE_STATS.has(effect?.stat))) return 'offense';
  if (effects.some((effect) => SUSTAIN_STATS.has(effect?.stat))) return 'sustain';
  return 'utility';
}

function isCatalystAccessory(accessoryId, weaponEvolutionData = []) {
  return weaponEvolutionData.some((recipe) => (recipe?.requires?.accessoryIds ?? []).includes(accessoryId));
}

function resolveWeaponById(weaponData = [], weaponId) {
  return weaponData.find((weapon) => weapon?.id === weaponId) ?? null;
}

function buildLinkedWeapons(accessory, weaponEvolutionData = [], weaponData = []) {
  return weaponEvolutionData
    .filter((recipe) => (recipe?.requires?.accessoryIds ?? []).includes(accessory?.id))
    .map((recipe) => {
      const baseWeapon = resolveWeaponById(weaponData, recipe?.requires?.weaponId);
      const resultWeapon = resolveWeaponById(weaponData, recipe?.resultWeaponId);
      return {
        recipeId: recipe?.id ?? `${accessory?.id}:${recipe?.resultWeaponId ?? 'weapon'}`,
        baseWeaponId: recipe?.requires?.weaponId ?? '',
        baseWeaponName: baseWeapon?.name ?? recipe?.requires?.weaponId ?? '무기',
        baseWeaponIcon: baseWeapon?.icon ?? '⚔',
        resultWeaponId: recipe?.resultWeaponId ?? '',
        resultWeaponName: resultWeapon?.name ?? recipe?.resultWeaponId ?? '진화 무기',
        resultWeaponIcon: resultWeapon?.icon ?? '✶',
      };
    });
}

function createDiscoveryHint(unlocked, isCatalyst) {
  if (unlocked) {
    return isCatalyst
      ? '진화 재료 장신구로 등록되어 있으며, 이후 진화 조건 비교에 계속 표시됩니다.'
      : '런 중 한 번이라도 획득하면 도감에 유지됩니다.';
  }
  return isCatalyst
    ? '진화 재료 장신구입니다. 런 중 획득하면 도감과 진화식에 함께 기록됩니다.'
    : '런 중 획득하면 도감에 기록됩니다.';
}

export function buildCodexAccessoryCardModel({
  accessory,
  session = null,
  weaponEvolutionData = [],
  selectedAccessoryId = null,
}) {
  const unlocked = isCodexAccessoryUnlocked(accessory, session);
  const effectCategory = getAccessoryEffectCategory(accessory);
  const isCatalyst = isCatalystAccessory(accessory?.id, weaponEvolutionData);
  return {
    id: accessory.id,
    name: accessory.name,
    unlocked,
    isSelected: selectedAccessoryId === accessory.id,
    icon: accessory.icon ?? '◈',
    rarity: accessory.rarity ?? 'common',
    rarityLabel: ACCESSORY_RARITY_LABEL[accessory.rarity] ?? accessory.rarity ?? '일반',
    maxLevel: accessory.maxLevel ?? 5,
    effectText: getAccessoryEffectText(accessory),
    effectCategory,
    effectCategoryLabel: EFFECT_CATEGORY_LABEL[effectCategory] ?? effectCategory,
    isCatalyst,
    discoveryHint: createDiscoveryHint(unlocked, isCatalyst),
  };
}

export function buildCodexAccessoryGridModel({
  accessoryData = [],
  weaponEvolutionData = [],
  session = null,
  search = '',
  rarityFilter = 'all',
  effectFilter = 'all',
  statusFilter = 'all',
  selectedAccessoryId = null,
}) {
  const normalizedSearch = String(search ?? '').trim().toLowerCase();
  const entries = accessoryData
    .map((accessory) => buildCodexAccessoryCardModel({
      accessory,
      session,
      weaponEvolutionData,
      selectedAccessoryId,
    }))
    .filter((entry) => {
      const matchesSearch = !normalizedSearch
        || entry.name.toLowerCase().includes(normalizedSearch)
        || entry.effectText.toLowerCase().includes(normalizedSearch);
      const matchesRarity = rarityFilter === 'all'
        || (rarityFilter === 'catalyst' ? entry.isCatalyst : entry.rarity === rarityFilter);
      const matchesEffect = effectFilter === 'all' || entry.effectCategory === effectFilter;
      const matchesStatus = statusFilter === 'all'
        || (statusFilter === 'discovered' && entry.unlocked)
        || (statusFilter === 'locked' && !entry.unlocked);
      return matchesSearch && matchesRarity && matchesEffect && matchesStatus;
    });

  return {
    entries,
    discoveredEntries: entries.filter((entry) => entry.unlocked),
    lockedEntries: entries.filter((entry) => !entry.unlocked),
    search,
    rarityFilter,
    effectFilter,
    statusFilter,
    summary: {
      visibleCount: entries.length,
      discoveredCount: entries.filter((entry) => entry.unlocked).length,
      lockedCount: entries.filter((entry) => !entry.unlocked).length,
      statusLabel: ACCESSORY_STATUS_LABEL[statusFilter] ?? ACCESSORY_STATUS_LABEL.all,
    },
  };
}

export function buildCodexAccessoryDetailModel({
  accessoryData = [],
  weaponEvolutionData = [],
  weaponData = [],
  session = null,
  selectedAccessoryId = null,
}) {
  const accessory = accessoryData.find((entry) => entry?.id === selectedAccessoryId) ?? accessoryData[0] ?? null;
  if (!accessory) return null;

  const card = buildCodexAccessoryCardModel({
    accessory,
    session,
    weaponEvolutionData,
    selectedAccessoryId: accessory.id,
  });

  return {
    ...card,
    displayName: card.unlocked ? accessory.name : '???',
    levelGroups: card.unlocked ? buildAccessoryLevelTimeline(accessory) : [],
    linkedWeapons: buildLinkedWeapons(accessory, weaponEvolutionData, weaponData),
    discoveryHint: createDiscoveryHint(card.unlocked, card.isCatalyst),
    description: card.unlocked
      ? accessory.description ?? ''
      : (card.isCatalyst
        ? '아직 발견하지 못한 진화 재료 장신구입니다.'
        : '아직 발견하지 못한 장신구입니다.'),
  };
}
