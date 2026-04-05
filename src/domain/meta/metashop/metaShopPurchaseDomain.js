function resolvePermanentUpgradeDefinition(upgradeId, {
  gameData = null,
  upgradeData = null,
} = {}) {
  const source = upgradeData ?? gameData?.permanentUpgradeData ?? [];
  return source.find((entry) => entry?.id === upgradeId) ?? null;
}

export function resolveMetaShopPurchase({
  session = null,
  upgradeId = '',
  gameData = null,
  upgradeData = null,
} = {}) {
  const definition = resolvePermanentUpgradeDefinition(upgradeId, {
    gameData,
    upgradeData,
  });

  if (!definition || !session?.meta) {
    return {
      allowed: false,
      reason: 'invalid-upgrade',
      definition: null,
      currentLevel: null,
      cost: null,
    };
  }

  const currentLevel = session.meta.permanentUpgrades?.[upgradeId] ?? 0;
  if (currentLevel >= definition.maxLevel) {
    return {
      allowed: false,
      reason: 'max-level',
      definition,
      currentLevel,
      cost: null,
    };
  }

  return {
    allowed: true,
    reason: null,
    definition,
    currentLevel,
    cost: definition.costPerLevel(currentLevel),
  };
}
