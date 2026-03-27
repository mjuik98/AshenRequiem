import {
  getAscensionByLevel,
  getAscensionChoices,
  normalizeAscensionLevel,
} from '../../../data/ascensionData.js';
import {
  getStageById,
  getStageChoices,
  normalizeStageId,
} from '../../../data/stageData.js';
import {
  getArchetypeById,
  getArchetypeChoices,
  normalizeArchetypeId,
} from '../../../data/archetypeData.js';
import {
  getRiskRelicById,
  getRiskRelicChoices,
  normalizeRiskRelicId,
} from '../../../data/riskRelicData.js';

const DEFAULT_START_WEAPON_ID = 'magic_bolt';
const DEFAULT_SEED_MODE = 'none';

export function normalizeSeedMode(seedMode = DEFAULT_SEED_MODE) {
  return ['none', 'custom', 'daily'].includes(seedMode) ? seedMode : DEFAULT_SEED_MODE;
}

function getWeaponCatalog(gameData = {}) {
  if (Array.isArray(gameData?.weaponData) && gameData.weaponData.length > 0) {
    return gameData.weaponData;
  }

  return [];
}

function getAccessoryCatalog(gameData = {}) {
  if (Array.isArray(gameData?.accessoryData) && gameData.accessoryData.length > 0) {
    return gameData.accessoryData;
  }

  return [];
}

function getStageCatalog(gameData = {}) {
  if (Array.isArray(gameData?.stageData) && gameData.stageData.length > 0) {
    return gameData.stageData;
  }

  return getStageChoices();
}

function getArchetypeCatalog(gameData = {}) {
  if (Array.isArray(gameData?.archetypeData) && gameData.archetypeData.length > 0) {
    return gameData.archetypeData;
  }

  return getArchetypeChoices();
}

function getRiskRelicCatalog(gameData = {}) {
  if (Array.isArray(gameData?.riskRelicData) && gameData.riskRelicData.length > 0) {
    return gameData.riskRelicData;
  }

  return getRiskRelicChoices();
}

function getUnlockTargetSet(targetType, gameData = {}) {
  const unlockEntries = Array.isArray(gameData?.unlockData) ? gameData.unlockData : [];
  return new Set(
    unlockEntries
      .filter((entry) => entry?.targetType === targetType && typeof entry?.targetId === 'string')
      .map((entry) => entry.targetId),
  );
}

function mergeUnlockedIds(explicitIds = [], defaults = []) {
  const merged = new Set(defaults);
  for (const id of explicitIds ?? []) {
    if (typeof id === 'string' && id.length > 0) {
      merged.add(id);
    }
  }
  return [...merged];
}

function cloneStartWeapon(weapon) {
  return weapon ? [{ ...weapon, currentCooldown: 0, level: 1 }] : [];
}

function cloneStartAccessory(accessory) {
  return accessory ? [{ ...accessory, level: 1 }] : [];
}

function getUnlockedWeaponIds(gameData = {}, session = null) {
  const weaponCatalog = getWeaponCatalog(gameData);
  const gatedWeaponIds = getUnlockTargetSet('weapon', gameData);
  const defaultUnlockedWeaponIds = weaponCatalog
    .filter((weapon) => weapon && weapon.isEvolved !== true && !gatedWeaponIds.has(weapon.id))
    .map((weapon) => weapon.id);

  return mergeUnlockedIds(session?.meta?.unlockedWeapons, defaultUnlockedWeaponIds);
}

function getUnlockedAccessoryIds(gameData = {}, session = null) {
  const accessoryCatalog = getAccessoryCatalog(gameData);
  const gatedAccessoryIds = getUnlockTargetSet('accessory', gameData);
  const defaultUnlockedAccessoryIds = accessoryCatalog
    .filter((accessory) => accessory && !gatedAccessoryIds.has(accessory.id))
    .map((accessory) => accessory.id);

  return mergeUnlockedIds(session?.meta?.unlockedAccessories, defaultUnlockedAccessoryIds);
}

function getAvailableStartWeapons(weaponCatalog, unlockedWeapons) {
  return weaponCatalog.filter((weapon) => (
    weapon
    && weapon.isEvolved !== true
    && unlockedWeapons.includes(weapon.id)
  ));
}

function getAvailableStartAccessories(accessoryCatalog, unlockedAccessories) {
  return accessoryCatalog.filter((accessory) => (
    accessory
    && unlockedAccessories.includes(accessory.id)
  ));
}

function getFallbackStartWeaponId(availableStartWeapons) {
  return availableStartWeapons.find((weapon) => weapon?.id === DEFAULT_START_WEAPON_ID)?.id
    ?? availableStartWeapons[0]?.id
    ?? null;
}

function normalizeRequestedWeaponId(availableStartWeapons, requestedWeaponId) {
  if (!availableStartWeapons.length) return null;
  return availableStartWeapons.some((weapon) => weapon?.id === requestedWeaponId)
    ? requestedWeaponId
    : getFallbackStartWeaponId(availableStartWeapons);
}

export function resolveSelectedAscensionLevel(session = null, requestedAscensionLevel = null) {
  return normalizeAscensionLevel(
    requestedAscensionLevel ?? session?.meta?.selectedAscensionLevel ?? 0,
  );
}

export function resolveSelectedStartAccessoryId(gameData = {}, session = null, requestedAccessoryId = null) {
  const { unlockedAccessories } = resolveUnlockedLoadoutIds(gameData, session);
  const accessoryCatalog = getAccessoryCatalog(gameData);
  const availableStartAccessories = getAvailableStartAccessories(accessoryCatalog, unlockedAccessories);
  const nextRequestedAccessoryId = requestedAccessoryId ?? session?.meta?.selectedStartAccessoryId ?? null;

  if (!nextRequestedAccessoryId) return null;
  return availableStartAccessories.some((accessory) => accessory?.id === nextRequestedAccessoryId)
    ? nextRequestedAccessoryId
    : null;
}

export function resolveSelectedStageId(gameData = {}, session = null, requestedStageId = null) {
  const stageCatalog = getStageCatalog(gameData);
  const normalizedId = normalizeStageId(requestedStageId ?? session?.meta?.selectedStageId ?? null);
  return stageCatalog.some((stage) => stage?.id === normalizedId)
    ? normalizedId
    : stageCatalog[0]?.id ?? normalizeStageId(null);
}

export function resolveSelectedArchetypeId(gameData = {}, session = null, requestedArchetypeId = null) {
  const archetypeCatalog = getArchetypeCatalog(gameData);
  const normalizedId = normalizeArchetypeId(
    requestedArchetypeId ?? session?.meta?.selectedArchetypeId ?? null,
  );
  return archetypeCatalog.some((entry) => entry?.id === normalizedId)
    ? normalizedId
    : archetypeCatalog[0]?.id ?? normalizeArchetypeId(null);
}

export function resolveSelectedRiskRelicId(gameData = {}, session = null, requestedRiskRelicId = null) {
  const riskRelicCatalog = getRiskRelicCatalog(gameData);
  const normalizedId = normalizeRiskRelicId(
    requestedRiskRelicId ?? session?.meta?.selectedRiskRelicId ?? null,
  );

  if (!normalizedId) return null;

  return riskRelicCatalog.some((entry) => entry?.id === normalizedId)
    ? normalizedId
    : null;
}

export function resolveSelectedSeedConfig(session = null, requested = null, now = new Date()) {
  const nextSeedMode = normalizeSeedMode(requested?.seedMode ?? session?.meta?.selectedSeedMode ?? DEFAULT_SEED_MODE);
  const seedText = typeof requested?.seedText === 'string'
    ? requested.seedText.trim()
    : typeof session?.meta?.selectedSeedText === 'string'
      ? session.meta.selectedSeedText.trim()
      : '';
  if (nextSeedMode === 'daily') {
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const seedLabel = `daily-${year}-${month}-${day}`;
    return {
      selectedSeedMode: 'daily',
      selectedSeedText: '',
      seedLabel,
    };
  }

  if (nextSeedMode === 'custom' && seedText.length > 0) {
    return {
      selectedSeedMode: 'custom',
      selectedSeedText: seedText,
      seedLabel: seedText,
    };
  }

  return {
    selectedSeedMode: 'none',
    selectedSeedText: '',
    seedLabel: '',
  };
}

export function resolveSelectedStartWeaponId(gameData = {}, session = null, requestedWeaponId = null) {
  const { unlockedWeapons } = resolveUnlockedLoadoutIds(gameData, session);
  const weaponCatalog = getWeaponCatalog(gameData);
  const availableStartWeapons = getAvailableStartWeapons(weaponCatalog, unlockedWeapons);
  const nextRequestedWeaponId = requestedWeaponId ?? session?.meta?.selectedStartWeaponId ?? DEFAULT_START_WEAPON_ID;
  return normalizeRequestedWeaponId(availableStartWeapons, nextRequestedWeaponId);
}

export function resolveUnlockedLoadoutIds(gameData = {}, session = null) {
  const unlockedWeapons = getUnlockedWeaponIds(gameData, session);
  const unlockedAccessories = getUnlockedAccessoryIds(gameData, session);

  return {
    unlockedWeapons,
    unlockedAccessories,
  };
}

export function resolveStartWeaponSelection(gameData = {}, session = null) {
  const { unlockedWeapons, unlockedAccessories } = resolveUnlockedLoadoutIds(gameData, session);
  const weaponCatalog = getWeaponCatalog(gameData);
  const accessoryCatalog = getAccessoryCatalog(gameData);
  const stageCatalog = getStageCatalog(gameData);
  const archetypeCatalog = getArchetypeCatalog(gameData);
  const riskRelicCatalog = getRiskRelicCatalog(gameData);
  const availableStartWeapons = getAvailableStartWeapons(weaponCatalog, unlockedWeapons);
  const availableStartAccessories = getAvailableStartAccessories(accessoryCatalog, unlockedAccessories);
  const selectedStartWeaponId = resolveSelectedStartWeaponId(gameData, session);
  const selectedStartAccessoryId = resolveSelectedStartAccessoryId(gameData, session);
  const selectedAscensionLevel = resolveSelectedAscensionLevel(session);
  const selectedArchetypeId = resolveSelectedArchetypeId(gameData, session);
  const selectedRiskRelicId = resolveSelectedRiskRelicId(gameData, session);
  const selectedStageId = resolveSelectedStageId(gameData, session);
  const seedConfig = resolveSelectedSeedConfig(session);

  return {
    unlockedWeapons,
    unlockedAccessories,
    availableStartWeapons,
    availableStartAccessories,
    canStart: availableStartWeapons.length > 0,
    selectedStartWeaponId,
    selectedStartAccessoryId,
    ascensionChoices: getAscensionChoices(),
    selectedAscensionLevel,
    selectedAscension: getAscensionByLevel(selectedAscensionLevel),
    archetypes: archetypeCatalog,
    selectedArchetypeId,
    selectedArchetype: archetypeCatalog.find((entry) => entry?.id === selectedArchetypeId)
      ?? getArchetypeById(selectedArchetypeId),
    riskRelics: riskRelicCatalog,
    selectedRiskRelicId,
    selectedRiskRelic: riskRelicCatalog.find((entry) => entry?.id === selectedRiskRelicId)
      ?? getRiskRelicById(selectedRiskRelicId),
    stages: stageCatalog,
    selectedStageId,
    selectedStage: getStageById(selectedStageId),
    selectedSeedMode: seedConfig.selectedSeedMode,
    selectedSeedText: seedConfig.selectedSeedText,
    selectedSeedLabel: seedConfig.seedLabel,
    seedPreviewText: seedConfig.seedLabel
      ? `Seed ${seedConfig.seedLabel}`
      : '랜덤 시드로 새로운 런을 생성합니다.',
  };
}

export function buildPlayerStartWeapons(gameData = {}, session = null) {
  const selection = resolveStartWeaponSelection(gameData, session);
  const startWeapon = selection.availableStartWeapons.find((weapon) => weapon?.id === selection.selectedStartWeaponId);
  return cloneStartWeapon(startWeapon);
}

export function buildPlayerStartAccessories(gameData = {}, session = null) {
  const selection = resolveStartWeaponSelection(gameData, session);
  const startAccessory = selection.availableStartAccessories.find((accessory) => accessory?.id === selection.selectedStartAccessoryId);
  return cloneStartAccessory(startAccessory);
}
