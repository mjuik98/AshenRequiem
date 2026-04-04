import { buildMetaGoalRoadmap } from '../progression/metaGoalDomain.js';

export const META_SHOP_FILTERS = [
  { id: 'all', label: '전체' },
  { id: 'attack', label: '공격' },
  { id: 'survival', label: '생존' },
  { id: 'economy', label: '경제' },
  { id: 'utility', label: '유틸' },
];

export const META_SHOP_SORTS = [
  { id: 'recommended', label: '추천순' },
  { id: 'price', label: '가격순' },
  { id: 'affordable-first', label: '구매 가능 우선' },
];

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

const CATEGORY_BY_STAT = {
  maxHp: 'survival',
  moveSpeed: 'survival',
  damageMult: 'attack',
  magnetRadius: 'survival',
  lifesteal: 'survival',
  critChance: 'attack',
  critMultiplier: 'attack',
  projectileSpeedMult: 'attack',
  projectileSizeMult: 'attack',
  cooldownMult: 'attack',
  xpMult: 'economy',
  currencyMult: 'economy',
  curse: 'survival',
  projectileLifetimeMult: 'utility',
  maxWeaponSlots: 'utility',
  maxAccessorySlots: 'utility',
  bonusProjectileCount: 'attack',
  rerollCharge: 'utility',
  banishCharge: 'utility',
};

const CATEGORY_LABELS = {
  all: '전체',
  attack: '공격',
  survival: '생존',
  economy: '경제',
  utility: '유틸',
};

const RECOMMENDED_WEIGHT_BY_STAT = {
  damageMult: 100,
  cooldownMult: 95,
  bonusProjectileCount: 92,
  maxHp: 88,
  lifesteal: 84,
  magnetRadius: 80,
  currencyMult: 94,
  xpMult: 90,
  rerollCharge: 88,
  banishCharge: 86,
  maxWeaponSlots: 82,
  maxAccessorySlots: 80,
  critChance: 78,
  critMultiplier: 76,
  projectileSpeedMult: 74,
  projectileSizeMult: 72,
  projectileLifetimeMult: 68,
  moveSpeed: 66,
  curse: 40,
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

function resolveCategory(upgrade) {
  return CATEGORY_BY_STAT[upgrade?.effect?.stat] ?? 'utility';
}

function resolveRecommendedWeight(upgrade) {
  return RECOMMENDED_WEIGHT_BY_STAT[upgrade?.effect?.stat] ?? 10;
}

function calculateMaxCostToFinish(upgrade, currentLevel) {
  let total = 0;
  for (let level = currentLevel; level < upgrade.maxLevel; level += 1) {
    total += upgrade.costPerLevel(level);
  }
  return total;
}

function calculateAffordablePurchaseCount(upgrade, currentLevel, currency) {
  let level = currentLevel;
  let remainingCurrency = currency;
  let purchases = 0;

  while (level < upgrade.maxLevel) {
    const cost = upgrade.costPerLevel(level);
    if (remainingCurrency < cost) break;
    remainingCurrency -= cost;
    purchases += 1;
    level += 1;
  }

  return purchases;
}

function resolveSelectedCard(cards, selectedUpgradeId) {
  if (!Array.isArray(cards) || cards.length <= 0) return null;
  const explicit = cards.find((card) => card.id === selectedUpgradeId);
  if (explicit) return explicit;
  return cards.find((card) => card.status === 'affordable')
    ?? cards.find((card) => card.status !== 'maxed')
    ?? cards[0];
}

function sortCards(cards, activeSort) {
  const list = [...cards];
  if (activeSort === 'price') {
    return list.sort((left, right) => (
      (left.cost - right.cost)
      || (right.recommendedWeight - left.recommendedWeight)
      || (left.originalIndex - right.originalIndex)
    ));
  }
  if (activeSort === 'affordable-first') {
    return list.sort((left, right) => {
      const leftBucket = left.status === 'affordable' ? 0 : left.status === 'locked' ? 1 : 2;
      const rightBucket = right.status === 'affordable' ? 0 : right.status === 'locked' ? 1 : 2;
      return (leftBucket - rightBucket) || (left.originalIndex - right.originalIndex);
    });
  }
  return list.sort((left, right) => {
    const leftBucket = left.status === 'affordable' ? 0 : left.status === 'locked' ? 1 : 2;
    const rightBucket = right.status === 'affordable' ? 0 : right.status === 'locked' ? 1 : 2;
    return (leftBucket - rightBucket) || (left.originalIndex - right.originalIndex);
  });
}

export function buildMetaShopViewModel(session, {
  gameData = null,
  upgradeData = null,
  selectedUpgradeId = null,
  activeCategory = 'all',
  activeSort = 'recommended',
} = {}) {
  const resolvedUpgradeData = upgradeData ?? gameData?.permanentUpgradeData ?? [];
  const currency = session?.meta?.currency ?? 0;
  const permanentUpgrades = session?.meta?.permanentUpgrades ?? {};
  const cards = resolvedUpgradeData.map((upgrade, originalIndex) => {
    const currentLevel = permanentUpgrades[upgrade.id] ?? 0;
    const isMaxed = currentLevel >= upgrade.maxLevel;
    const cost = isMaxed ? 0 : upgrade.costPerLevel(currentLevel);
    const canAfford = !isMaxed && currency >= cost;
    const status = resolveStatus({ isMaxed, canAfford });
    const category = resolveCategory(upgrade);
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
      category,
      categoryLabel: CATEGORY_LABELS[category],
      recommendedWeight: resolveRecommendedWeight(upgrade),
      originalIndex,
      levelLabel: isMaxed ? `MAX ${upgrade.maxLevel}/${upgrade.maxLevel}` : `Lv ${currentLevel}/${upgrade.maxLevel}`,
      currentEffectText: formatEffectText(upgrade, currentLevel),
      nextEffectText: isMaxed ? '최대 레벨 도달' : formatEffectText(upgrade, currentLevel + 1),
      nextCostLabel: isMaxed ? '완료' : `💰 ${cost}`,
      postPurchaseCurrency: isMaxed ? currency : currency - cost,
      remainingLevels: Math.max(0, upgrade.maxLevel - currentLevel),
      maxCostToFinish: calculateMaxCostToFinish(upgrade, currentLevel),
      affordablePurchaseCount: calculateAffordablePurchaseCount(upgrade, currentLevel, currency),
      isSelected: false,
    };
  });

  const filteredCards = activeCategory === 'all'
    ? cards
    : cards.filter((card) => card.category === activeCategory);
  const sortedCards = sortCards(filteredCards, activeSort);
  const selectedCard = resolveSelectedCard(sortedCards, selectedUpgradeId);
  const selectedId = selectedCard?.id ?? null;
  const cardsWithSelection = sortedCards.map((card) => ({
    ...card,
    isSelected: card.id === selectedId,
  }));
  const availableCards = cardsWithSelection.filter((card) => card.status === 'affordable');
  const lockedCards = cardsWithSelection.filter((card) => card.status === 'locked');
  const completedCards = cardsWithSelection.filter((card) => card.status === 'maxed');
  const resolvedSelectedCard = cardsWithSelection.find((card) => card.id === selectedId) ?? null;
  const roadmapGoal = buildMetaGoalRoadmap({
    session,
    gameData: {
      ...(gameData ?? {}),
      permanentUpgradeData: resolvedUpgradeData,
    },
    limit: 1,
  })[0] ?? null;

  return {
    currency,
    cards: cardsWithSelection,
    selectedCard: resolvedSelectedCard,
    affordableCards: availableCards,
    availableCards,
    lockedCards,
    completedCards,
    visibleCount: cardsWithSelection.length,
    activeCategory,
    activeSort,
    filters: META_SHOP_FILTERS,
    sorts: META_SHOP_SORTS,
    roadmapGoal,
  };
}
