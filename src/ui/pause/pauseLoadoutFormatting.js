export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function toArray(value) {
  return Array.isArray(value) ? value : [];
}

export function formatCompactNumber(value, digits = 2) {
  return Number.isFinite(value)
    ? String(Number(value.toFixed(digits)))
    : '—';
}

export function formatSeconds(value, digits = 2) {
  return Number.isFinite(value)
    ? `${formatCompactNumber(value, digits)}s`
    : '—';
}

export function getKindLabel(kind) {
  switch (kind) {
    case 'weapon':
      return '무기';
    case 'accessory':
      return '장신구';
    case 'empty':
      return '빈 슬롯';
    case 'locked':
      return '상점 해금';
    default:
      return '로드아웃';
  }
}

export function matchesSlotCategory(item, slotCategory) {
  if (!item || !slotCategory) return false;
  return item.slotCategory === slotCategory
    || (item.kind === slotCategory)
    || (item.kind === 'empty' && item.name?.includes(slotCategory === 'weapon' ? '무기' : '장신구'));
}

export function normalizePauseSynergyRequirementId(requirement) {
  if (typeof requirement !== 'string') return null;
  if (requirement.startsWith('up_')) return requirement.slice(3);
  if (requirement.startsWith('get_')) return requirement.slice(4);
  if (requirement.startsWith('acc_')) return requirement.slice(4);
  return requirement;
}
