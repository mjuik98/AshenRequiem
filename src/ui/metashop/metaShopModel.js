import { permanentUpgradeData } from '../../data/permanentUpgradeData.js';

export function buildMetaShopViewModel(session, {
  upgradeData = permanentUpgradeData,
} = {}) {
  const currency = session?.meta?.currency ?? 0;
  const permanentUpgrades = session?.meta?.permanentUpgrades ?? {};
  const cards = upgradeData.map((upgrade) => {
    const currentLevel = permanentUpgrades[upgrade.id] ?? 0;
    const isMaxed = currentLevel >= upgrade.maxLevel;
    const cost = isMaxed ? 0 : upgrade.costPerLevel(currentLevel);
    const canAfford = !isMaxed && currency >= cost;
    return {
      id: upgrade.id,
      icon: upgrade.icon,
      name: upgrade.name,
      description: upgrade.description,
      maxLevel: upgrade.maxLevel,
      currentLevel,
      isMaxed,
      cost,
      canAfford,
    };
  });

  return {
    currency,
    cards,
  };
}
