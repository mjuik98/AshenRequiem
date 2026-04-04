import {
  buildStartLoadoutAdvancedSummary,
  buildStartLoadoutSeedLabel,
  buildStartLoadoutSeedPreviewText,
} from './startLoadoutPresentation.js';
import {
  DEFAULT_SEED_MODE,
  DEFAULT_START_WEAPON_ID,
  getAccessoryCatalog,
  getArchetypeById,
  getArchetypeCatalog,
  getAscensionByLevel,
  getAscensionChoices,
  getAvailableStartAccessories,
  getAvailableStartWeapons,
  getFallbackStartWeaponId,
  getRiskRelicById,
  getRiskRelicCatalog,
  getStageById,
  getStageCatalog,
  getWeaponCatalog,
  normalizeArchetypeId,
  normalizeAscensionLevel,
  normalizeRiskRelicId,
  normalizeStageId,
} from './startLoadoutCatalog.js';
import { resolveUnlockedLoadoutIds } from './startLoadoutUnlocks.js';

export function normalizeSeedMode(seedMode = DEFAULT_SEED_MODE) {
  return ['none', 'custom', 'daily'].includes(seedMode) ? seedMode : DEFAULT_SEED_MODE;
}

function normalizeRequestedWeaponId(availableStartWeapons, requestedWeaponId) {
  if (!availableStartWeapons.length) return null;
  return availableStartWeapons.some((weapon) => weapon?.id === requestedWeaponId)
    ? requestedWeaponId
    : getFallbackStartWeaponId(availableStartWeapons);
}

export function resolveSelectedAscensionLevel(gameData = {}, session = null, requestedAscensionLevel = null) {
  return normalizeAscensionLevel(
    gameData,
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
  const normalizedId = normalizeStageId(gameData, requestedStageId ?? session?.meta?.selectedStageId ?? null);
  return stageCatalog.some((stage) => stage?.id === normalizedId)
    ? normalizedId
    : stageCatalog[0]?.id ?? normalizeStageId(gameData, null);
}

export function resolveSelectedArchetypeId(gameData = {}, session = null, requestedArchetypeId = null) {
  const archetypeCatalog = getArchetypeCatalog(gameData);
  const normalizedId = normalizeArchetypeId(
    gameData,
    requestedArchetypeId ?? session?.meta?.selectedArchetypeId ?? null,
  );
  return archetypeCatalog.some((entry) => entry?.id === normalizedId)
    ? normalizedId
    : archetypeCatalog[0]?.id ?? normalizeArchetypeId(gameData, null);
}

export function resolveSelectedRiskRelicId(gameData = {}, session = null, requestedRiskRelicId = null) {
  const riskRelicCatalog = getRiskRelicCatalog(gameData);
  const normalizedId = normalizeRiskRelicId(
    gameData,
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
    const seedLabel = buildStartLoadoutSeedLabel({
      seedMode: 'daily',
      now,
    });
    return {
      selectedSeedMode: 'daily',
      selectedSeedText: '',
      seedLabel,
    };
  }

  if (nextSeedMode === 'custom' && seedText.length > 0) {
    const seedLabel = buildStartLoadoutSeedLabel({
      seedMode: 'custom',
      seedText,
    });
    return {
      selectedSeedMode: 'custom',
      selectedSeedText: seedText,
      seedLabel,
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
  const selectedAscensionLevel = resolveSelectedAscensionLevel(gameData, session);
  const selectedArchetypeId = resolveSelectedArchetypeId(gameData, session);
  const selectedRiskRelicId = resolveSelectedRiskRelicId(gameData, session);
  const selectedStageId = resolveSelectedStageId(gameData, session);
  const seedConfig = resolveSelectedSeedConfig(session);
  const ascensionChoices = getAscensionChoices(gameData);

  return {
    unlockedWeapons,
    unlockedAccessories,
    availableStartWeapons,
    availableStartAccessories,
    canStart: availableStartWeapons.length > 0,
    selectedStartWeaponId,
    selectedStartAccessoryId,
    ascensionChoices,
    selectedAscensionLevel,
    selectedAscension: getAscensionByLevel(gameData, selectedAscensionLevel),
    archetypes: archetypeCatalog,
    selectedArchetypeId,
    selectedArchetype: archetypeCatalog.find((entry) => entry?.id === selectedArchetypeId)
      ?? getArchetypeById(gameData, selectedArchetypeId),
    riskRelics: riskRelicCatalog,
    selectedRiskRelicId,
    selectedRiskRelic: riskRelicCatalog.find((entry) => entry?.id === selectedRiskRelicId)
      ?? getRiskRelicById(gameData, selectedRiskRelicId),
    stages: stageCatalog,
    selectedStageId,
    selectedStage: getStageById(gameData, selectedStageId),
    selectedSeedMode: seedConfig.selectedSeedMode,
    selectedSeedText: seedConfig.selectedSeedText,
    selectedSeedLabel: seedConfig.seedLabel,
    seedPreviewText: buildStartLoadoutSeedPreviewText({
      seedMode: seedConfig.selectedSeedMode,
      seedText: seedConfig.selectedSeedText,
      seedLabel: seedConfig.seedLabel,
    }),
    advancedSummary: buildStartLoadoutAdvancedSummary({
      ascensionChoices,
      selectedAscensionLevel,
      archetypes: archetypeCatalog,
      selectedArchetypeId,
      stages: stageCatalog,
      selectedStageId,
    }),
  };
}
