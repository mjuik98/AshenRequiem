import { purchasePermanentUpgradeAndSave } from '../session/sessionPersistenceService.js';

function findPermanentUpgradeDefinition(upgradeId, {
  gameData = null,
  upgradeData = null,
} = {}) {
  const source = upgradeData ?? gameData?.permanentUpgradeData ?? [];
  return source.find((entry) => entry?.id === upgradeId) ?? null;
}

export function purchaseMetaShopUpgrade(session, upgradeId, options = {}) {
  const definition = findPermanentUpgradeDefinition(upgradeId, options);
  if (!definition || !session?.meta) {
    return {
      success: false,
      reason: 'invalid-upgrade',
      definition: null,
    };
  }

  const currentLevel = session.meta.permanentUpgrades?.[upgradeId] ?? 0;
  if (currentLevel >= definition.maxLevel) {
    return {
      success: false,
      reason: 'max-level',
      definition,
    };
  }

  const cost = definition.costPerLevel(currentLevel);
  const success = purchasePermanentUpgradeAndSave(session, upgradeId, cost);

  return {
    success,
    reason: success ? null : 'insufficient-currency',
    cost,
    currentLevel,
    definition,
  };
}
