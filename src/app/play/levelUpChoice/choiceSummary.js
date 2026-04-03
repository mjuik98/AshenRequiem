function normalizeSummaryText(text) {
  const value = String(text ?? '').trim();
  if (!value) return null;

  return value
    .replace(/\s+/g, ' ')
    .replace(/입니다\.$/, '')
    .replace(/합니다\.$/, '')
    .replace(/니다\.$/, '')
    .replace(/\.$/, '');
}

function buildWeaponAcquireSummary(definition, fallbackName) {
  if (!definition) return fallbackName ? `${fallbackName} 획득` : null;

  switch (definition.behaviorId) {
    case 'boomerang':
      return '회전 부메랑 획득';
    case 'laserBeam':
      return '관통 레이저 획득';
    case 'groundZone':
      return definition.id === 'venom_bog' ? '독성 늪 획득' : '지속 화염 지대 획득';
    case 'ricochetProjectile':
      return '도약 탄환 획득';
    case 'chainLightning':
      return '연쇄 번개 획득';
    case 'orbit':
      return '회전 구체 획득';
    case 'areaBurst':
      return definition.orbitsPlayer ? '근접 광역 오라 획득' : '광역 폭발 획득';
    case 'targetProjectile':
      return (definition.pierce ?? 0) > 1 ? '직선 관통 투사체 획득' : '추적 투사체 획득';
    default:
      return normalizeSummaryText(definition.description) ?? `${definition.name ?? fallbackName ?? '무기'} 획득`;
  }
}

export function resolveSummaryText(choice, {
  previewText,
  currentText,
  weaponById,
  accessoryById,
} = {}) {
  if (previewText) return normalizeSummaryText(previewText);

  if (choice?.type === 'weapon_new') {
    return buildWeaponAcquireSummary(weaponById?.get(choice?.weaponId), choice?.name);
  }

  if (choice?.type === 'weapon_evolution') {
    const resultWeapon = weaponById?.get(choice?.resultWeaponId);
    return resultWeapon?.name ? `${resultWeapon.name} 무기로 진화` : normalizeSummaryText(choice?.description) ?? choice?.name ?? null;
  }

  if (choice?.type === 'accessory') {
    return normalizeSummaryText(accessoryById?.get(choice?.accessoryId)?.description)
      ?? normalizeSummaryText(choice?.description)
      ?? choice?.name
      ?? null;
  }

  if (choice?.type === 'stat') {
    return normalizeSummaryText(choice?.description) ?? choice?.name ?? null;
  }

  return normalizeSummaryText(choice?.description)
    ?? normalizeSummaryText(currentText)
    ?? choice?.name
    ?? null;
}
