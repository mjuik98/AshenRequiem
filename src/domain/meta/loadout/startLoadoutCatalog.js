export const DEFAULT_START_WEAPON_ID = 'magic_bolt';
export const DEFAULT_SEED_MODE = 'none';

function getCatalog(gameData = {}, key) {
  const entries = gameData?.[key];
  return Array.isArray(entries) ? entries.filter(Boolean) : [];
}

function normalizeCatalogId(catalog = [], requestedId = null, { allowNull = false } = {}) {
  if (allowNull && (requestedId == null || requestedId === '')) {
    return null;
  }
  if (typeof requestedId !== 'string' || requestedId.length === 0) {
    return catalog[0]?.id ?? (allowNull ? null : null);
  }
  return catalog.some((entry) => entry?.id === requestedId)
    ? requestedId
    : (catalog[0]?.id ?? (allowNull ? null : null));
}

function coerceNumericLevel(level = 0) {
  const numericLevel = Number.isFinite(level)
    ? Math.trunc(level)
    : Number.parseInt(level ?? '0', 10);
  return Number.isFinite(numericLevel) ? numericLevel : 0;
}

export function getWeaponCatalog(gameData = {}) {
  return getCatalog(gameData, 'weaponData');
}

export function getAccessoryCatalog(gameData = {}) {
  return getCatalog(gameData, 'accessoryData');
}

export function getStageCatalog(gameData = {}) {
  return getCatalog(gameData, 'stageData');
}

export function getArchetypeCatalog(gameData = {}) {
  return getCatalog(gameData, 'archetypeData');
}

export function getRiskRelicCatalog(gameData = {}) {
  return getCatalog(gameData, 'riskRelicData');
}

export function getAscensionCatalog(gameData = {}) {
  return getCatalog(gameData, 'ascensionData');
}

export function normalizeStageId(gameData = {}, stageId = null) {
  return normalizeCatalogId(getStageCatalog(gameData), stageId);
}

export function getStageById(gameData = {}, stageId = null) {
  const catalog = getStageCatalog(gameData);
  const normalizedId = normalizeStageId(gameData, stageId);
  return catalog.find((entry) => entry?.id === normalizedId) ?? catalog[0] ?? null;
}

export function normalizeArchetypeId(gameData = {}, archetypeId = null) {
  return normalizeCatalogId(getArchetypeCatalog(gameData), archetypeId);
}

export function getArchetypeById(gameData = {}, archetypeId = null) {
  const catalog = getArchetypeCatalog(gameData);
  const normalizedId = normalizeArchetypeId(gameData, archetypeId);
  return catalog.find((entry) => entry?.id === normalizedId) ?? catalog[0] ?? null;
}

export function normalizeRiskRelicId(gameData = {}, riskRelicId = null) {
  return normalizeCatalogId(getRiskRelicCatalog(gameData), riskRelicId, { allowNull: true });
}

export function getRiskRelicById(gameData = {}, riskRelicId = null) {
  const catalog = getRiskRelicCatalog(gameData);
  const normalizedId = normalizeRiskRelicId(gameData, riskRelicId);
  if (!normalizedId) return null;
  return catalog.find((entry) => entry?.id === normalizedId) ?? null;
}

export function normalizeAscensionLevel(gameData = {}, level = 0) {
  const catalog = getAscensionCatalog(gameData);
  const numericLevel = Math.max(0, coerceNumericLevel(level));
  if (catalog.length <= 0) return numericLevel;

  const levels = catalog
    .map((entry) => Number(entry?.level))
    .filter((entry) => Number.isFinite(entry));
  const minLevel = levels.length > 0 ? Math.min(...levels) : 0;
  const maxLevel = levels.length > 0 ? Math.max(...levels) : numericLevel;
  return Math.min(Math.max(numericLevel, minLevel), maxLevel);
}

export function getAscensionByLevel(gameData = {}, level = 0) {
  const catalog = getAscensionCatalog(gameData);
  const normalizedLevel = normalizeAscensionLevel(gameData, level);
  return catalog.find((entry) => entry?.level === normalizedLevel) ?? catalog[0] ?? null;
}

export function getAscensionChoices(gameData = {}) {
  return getAscensionCatalog(gameData).map((entry) => ({
    ...entry,
    pressureLabel: `적 체력 x${Number(entry?.enemyHpMult ?? 1).toFixed(2)} · 스폰 x${Number(entry?.spawnRateMult ?? 1).toFixed(2)}`,
    rewardLabel: `보상 x${Number(entry?.rewardMult ?? 1).toFixed(2)}`,
  }));
}

export function getAvailableStartWeapons(weaponCatalog, unlockedWeapons) {
  return weaponCatalog.filter((weapon) => (
    weapon
    && weapon.isEvolved !== true
    && unlockedWeapons.includes(weapon.id)
  ));
}

export function getAvailableStartAccessories(accessoryCatalog, unlockedAccessories) {
  return accessoryCatalog.filter((accessory) => (
    accessory
    && unlockedAccessories.includes(accessory.id)
  ));
}

export function getFallbackStartWeaponId(availableStartWeapons) {
  return availableStartWeapons.find((weapon) => weapon?.id === DEFAULT_START_WEAPON_ID)?.id
    ?? availableStartWeapons[0]?.id
    ?? null;
}

export function cloneStartWeapon(weapon) {
  return weapon ? [{ ...weapon, currentCooldown: 0, level: 1 }] : [];
}

export function cloneStartAccessory(accessory) {
  return accessory ? [{ ...accessory, level: 1 }] : [];
}
