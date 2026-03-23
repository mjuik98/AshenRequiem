const STAT_LABELS = {
  moveSpeed: '이동 속도',
  maxHp: '최대 HP',
  lifesteal: '흡혈',
  magnetRadius: '자석 범위',
  damageMult: '데미지',
  cooldownMult: '쿨다운 단축',
  projectileSpeedMult: '투사체 속도',
  projectileSizeMult: '투사체 크기/범위',
  xpMult: '경험치 획득',
  critChance: '크리티컬 확률',
  critMultiplier: '크리티컬 피해',
  bonusProjectileCount: '추가 투사체',
  invincibleDuration: '무적 시간',
  currencyMult: '골드 획득',
  projectileLifetimeMult: '투사체 지속시간',
};

function formatAccessoryStatValue(stat, value) {
  switch (stat) {
    case 'damageMult':
      return `+${Math.round(value * 100)}%`;
    case 'cooldownMult':
      return `-${Math.round(Math.abs(value) * 100)}%`;
    case 'lifesteal':
    case 'critChance':
    case 'critMultiplier':
    case 'projectileSpeedMult':
    case 'projectileSizeMult':
    case 'xpMult':
    case 'currencyMult':
    case 'projectileLifetimeMult':
      return `+${Math.round(value * 100)}%`;
    case 'bonusProjectileCount':
      return `+${value}발`;
    case 'invincibleDuration':
      return `+${value.toFixed(1)}초`;
    default:
      return `+${Math.round(value)}`;
  }
}

function getAccessoryEffectValueAtLevel(effect, level) {
  const perLevel = effect.valuePerLevel ?? 0;
  if (effect.stat === 'damageMult') {
    return (effect.value - 1) + perLevel * (level - 1);
  }
  if (effect.stat === 'cooldownMult') {
    return Math.abs(effect.value) + Math.abs(perLevel) * (level - 1);
  }
  return effect.value + perLevel * (level - 1);
}

export function buildAccessoryLevelDesc(accessoryDefinition) {
  if (!accessoryDefinition?.effects?.length) return [accessoryDefinition?.description ?? ''];

  const maxLevel = accessoryDefinition.maxLevel ?? 5;
  return accessoryDefinition.effects.map((effect) => {
    const label = STAT_LABELS[effect.stat] ?? effect.stat;
    const parts = [];
    for (let level = 1; level <= maxLevel; level += 1) {
      const value = getAccessoryEffectValueAtLevel(effect, level);
      parts.push(`Lv${level} ${formatAccessoryStatValue(effect.stat, value)}`);
    }
    return `${label}  ${parts.join(' → ')}`;
  });
}

export function buildAccessoryPickupDesc(accessoryDefinition) {
  if (!accessoryDefinition?.effects?.length) return accessoryDefinition?.description ?? '';
  return accessoryDefinition.effects.map((effect) => {
    const label = STAT_LABELS[effect.stat] ?? effect.stat;
    const value = getAccessoryEffectValueAtLevel(effect, 1);
    return `${label} ${formatAccessoryStatValue(effect.stat, value)}`;
  }).join(', ');
}

export function buildAccessoryUpgradeDesc(accessoryDefinition) {
  if (!accessoryDefinition?.effects?.length) return accessoryDefinition?.description ?? '';
  return accessoryDefinition.effects.map((effect) => {
    const label = STAT_LABELS[effect.stat] ?? effect.stat;
    const delta = effect.stat === 'damageMult'
      ? (effect.valuePerLevel ?? 0)
      : effect.stat === 'cooldownMult'
        ? -(Math.abs(effect.valuePerLevel ?? 0))
        : (effect.valuePerLevel ?? 0);
    return `${label} ${formatAccessoryStatValue(effect.stat, delta)}`;
  }).join(', ');
}

export function buildAccessoryShortDesc(accessoryDefinition, currentLevel = 1) {
  if (!accessoryDefinition?.effects?.length) return [accessoryDefinition?.description ?? ''];

  const maxLevel = accessoryDefinition.maxLevel ?? 5;
  return accessoryDefinition.effects.map((effect) => {
    const label = STAT_LABELS[effect.stat] ?? effect.stat;
    const currentValue = getAccessoryEffectValueAtLevel(effect, currentLevel);
    const currentText = formatAccessoryStatValue(effect.stat, currentValue);

    if (currentLevel >= maxLevel) {
      return `${label}  ${currentText} (MAX)`;
    }

    const nextValue = getAccessoryEffectValueAtLevel(effect, currentLevel + 1);
    const nextText = formatAccessoryStatValue(effect.stat, nextValue);
    return `${label}  ${currentText} → Lv${currentLevel + 1}: ${nextText}`;
  });
}

export function buildAccessoryCurrentDesc(accessoryDefinition, currentLevel = 1) {
  if (!accessoryDefinition?.effects?.length) return [accessoryDefinition?.description ?? ''];

  return accessoryDefinition.effects.map((effect) => {
    const label = STAT_LABELS[effect.stat] ?? effect.stat;
    const currentValue = getAccessoryEffectValueAtLevel(effect, currentLevel);
    return `${label} ${formatAccessoryStatValue(effect.stat, currentValue)}`;
  });
}
