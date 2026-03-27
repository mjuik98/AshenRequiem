import { permanentUpgradeData } from '../../data/permanentUpgradeData.js';

const EFFECT_LABELS = {
  maxHp: '최대 HP',
  moveSpeed: '이동 속도',
  damageMult: '모든 무기 데미지',
  magnetRadius: '픽업 흡수 범위',
  lifesteal: '흡혈',
  critChance: '크리티컬 확률',
  critMultiplier: '크리티컬 피해 배율',
  projectileSpeedMult: '투사체 속도',
  projectileSizeMult: '투사체 크기/범위',
  cooldownMult: '무기 쿨다운',
  xpMult: '경험치 획득',
  currencyMult: '골드 획득량',
  curse: '저주',
  projectileLifetimeMult: '투사체 지속시간',
  maxWeaponSlots: '최대 무기 슬롯',
  maxAccessorySlots: '최대 장신구 슬롯',
  bonusProjectileCount: '투사체 개수',
  rerollCharge: '리롤 횟수',
  banishCharge: '봉인 횟수',
};

function formatEffectDelta(value) {
  if (Math.abs(value) > 0 && Math.abs(value) < 1) {
    return `${value > 0 ? '+' : ''}${Math.round(value * 100)}%`;
  }
  return `${value > 0 ? '+' : ''}${value}`;
}

function formatEffectText(upgrade, level) {
  const stat = upgrade?.effect?.stat;
  const valuePerLevel = upgrade?.effect?.valuePerLevel ?? 0;
  const label = EFFECT_LABELS[stat] ?? upgrade?.name ?? '효과';
  return `${label} ${formatEffectDelta(valuePerLevel * level)}`;
}

function resolveStatus({ isMaxed, canAfford }) {
  if (isMaxed) return 'maxed';
  if (canAfford) return 'affordable';
  return 'locked';
}

function resolveStatusLabel(status) {
  if (status === 'maxed') return '완료';
  if (status === 'affordable') return '구매 가능';
  return '재화 부족';
}

function resolveSelectedCard(cards, selectedUpgradeId) {
  if (!Array.isArray(cards) || cards.length <= 0) return null;
  const explicit = cards.find((card) => card.id === selectedUpgradeId);
  if (explicit) return explicit;
  return cards.find((card) => card.status === 'affordable')
    ?? cards.find((card) => card.status !== 'maxed')
    ?? cards[0];
}

export function buildMetaShopViewModel(session, {
  upgradeData = permanentUpgradeData,
  selectedUpgradeId = null,
} = {}) {
  const currency = session?.meta?.currency ?? 0;
  const permanentUpgrades = session?.meta?.permanentUpgrades ?? {};
  const cards = upgradeData.map((upgrade) => {
    const currentLevel = permanentUpgrades[upgrade.id] ?? 0;
    const isMaxed = currentLevel >= upgrade.maxLevel;
    const cost = isMaxed ? 0 : upgrade.costPerLevel(currentLevel);
    const canAfford = !isMaxed && currency >= cost;
    const status = resolveStatus({ isMaxed, canAfford });
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
      status,
      statusLabel: resolveStatusLabel(status),
      levelLabel: isMaxed ? `MAX ${upgrade.maxLevel}/${upgrade.maxLevel}` : `Lv ${currentLevel}/${upgrade.maxLevel}`,
      currentEffectText: formatEffectText(upgrade, currentLevel),
      nextEffectText: isMaxed ? '최대 레벨 도달' : formatEffectText(upgrade, currentLevel + 1),
      nextCostLabel: isMaxed ? '완료' : `💰 ${cost}`,
      postPurchaseCurrency: isMaxed ? currency : currency - cost,
      remainingLevels: Math.max(0, upgrade.maxLevel - currentLevel),
      isSelected: false,
    };
  });

  const selectedCard = resolveSelectedCard(cards, selectedUpgradeId);
  const selectedId = selectedCard?.id ?? null;
  const cardsWithSelection = cards.map((card) => ({
    ...card,
    isSelected: card.id === selectedId,
  }));
  const availableCards = cardsWithSelection.filter((card) => card.status !== 'maxed');
  const completedCards = cardsWithSelection.filter((card) => card.status === 'maxed');
  const resolvedSelectedCard = cardsWithSelection.find((card) => card.id === selectedId) ?? null;

  return {
    currency,
    cards: cardsWithSelection,
    selectedCard: resolvedSelectedCard,
    availableCards,
    completedCards,
  };
}
