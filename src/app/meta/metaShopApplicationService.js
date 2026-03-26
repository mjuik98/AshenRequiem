import { getPermanentUpgradeById } from '../../data/permanentUpgradeData.js';
import { purchasePermanentUpgradeAndSave } from '../../state/sessionFacade.js';

export function purchaseMetaShopUpgrade(session, upgradeId) {
  const definition = getPermanentUpgradeById(upgradeId);
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
