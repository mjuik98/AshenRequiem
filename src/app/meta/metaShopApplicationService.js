import { purchasePermanentUpgradeAndSave } from '../session/sessionPersistenceService.js';
import { resolveMetaShopPurchase } from '../../domain/meta/metashop/metaShopPurchaseDomain.js';

export function purchaseMetaShopUpgrade(session, upgradeId, options = {}) {
  const purchase = resolveMetaShopPurchase({
    session,
    upgradeId,
    ...options,
  });

  if (!purchase.allowed) {
    return {
      success: false,
      reason: purchase.reason,
      definition: purchase.definition,
      currentLevel: purchase.currentLevel,
      cost: purchase.cost,
    };
  }

  const success = purchasePermanentUpgradeAndSave(session, upgradeId, purchase.cost);

  return {
    success,
    reason: success ? null : 'insufficient-currency',
    cost: purchase.cost,
    currentLevel: purchase.currentLevel,
    definition: purchase.definition,
  };
}
