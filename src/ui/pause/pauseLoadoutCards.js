import {
  escapeHtml,
  getBehaviorLabel,
  getKindLabel,
  getSlotIcon,
  hasSynergyActive,
  isEvolutionReady,
  matchesSlotCategory,
} from './pauseLoadoutModel.js';

function renderLevelDots(level, maxLevel) {
  if (!level || !maxLevel) return '';

  const isMax = level >= maxLevel;
  let html = '<div class="pv-slot-dots">';
  for (let index = 1; index <= maxLevel; index += 1) {
    const filled = index <= level;
    html += `<div class="pv-slot-dot${filled ? (isMax ? ' filled max' : ' filled') : ''}"></div>`;
  }
  html += '</div>';
  return html;
}

function truncateCardSummary(summary, maxLength = 72) {
  if (!summary) return '';
  const normalized = String(summary).replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

function getCardSummary(item) {
  if (item?.kind === 'weapon' || item?.kind === 'accessory') {
    return truncateCardSummary(item?.description || item?.source?.description || '');
  }
  if (matchesSlotCategory(item, 'weapon')) return '다음 레벨업에서 새 무기를 채울 수 있습니다.';
  if (matchesSlotCategory(item, 'accessory')) return '다음 레벨업에서 새 장신구를 채울 수 있습니다.';
  if (item?.kind === 'locked') return '상점 해금 이후 이 슬롯을 사용할 수 있습니다.';
  return '선택한 항목의 세부 정보를 확인할 수 있습니다.';
}

function renderSectionHeader(label, icon, count, maxCount) {
  const iconClass = label === '무기' ? 'weapon' : label === '장신구' ? 'acc' : 'locked';
  return `
    <div class="pv-slot-section-header">
      <div class="pv-slot-section-title">
        <div class="pv-slot-section-icon ${iconClass}">${icon}</div>
        ${escapeHtml(label)}
      </div>
      <span class="pv-slot-section-count">${count} / ${maxCount}</span>
    </div>
  `;
}

export function renderPauseSlotCard(item, selectedItemKey, player, data, indexes) {
  const isSelected = item?.selectionKey === selectedItemKey;
  const evolutionReady = isEvolutionReady(item, player, data);
  const synergyActive = hasSynergyActive(item, player, indexes);
  const stateClasses = [];

  if (item?.kind === 'empty') stateClasses.push('state-empty');
  if (item?.kind === 'locked') stateClasses.push('state-locked');
  if (item?.source?.rarity === 'rare') stateClasses.push('state-rare');
  if (evolutionReady) stateClasses.push('state-evolution-ready');
  if (synergyActive) stateClasses.push('state-synergy-active');

  const typePill = item?.source?.behaviorId
    ? `<span class="pv-slot-type-pill">${escapeHtml(getBehaviorLabel(item.source.behaviorId))}</span>`
    : '';
  const levelText = item?.level != null
    ? `<span class="pv-slot-lv">Lv.${item.level}</span>`
    : '';
  const dots = item?.kind !== 'empty' && item?.kind !== 'locked'
    ? renderLevelDots(item?.level, item?.maxLevel)
    : '';
  const evolutionBadge = evolutionReady ? '<div class="pv-slot-evo-chip">진화 가능</div>' : '';
  const synergyDot = !evolutionReady && synergyActive ? '<div class="pv-slot-syn-dot"></div>' : '';
  const rightHtml = dots || evolutionBadge || synergyDot
    ? `<div class="pv-slot-right">${dots}${evolutionBadge}${synergyDot}</div>`
    : '';
  const iconBoxClass = item?.kind === 'weapon'
    ? 'weapon'
    : item?.kind === 'accessory'
      ? (item?.rarity === 'rare' ? 'rare-acc' : 'acc')
      : '';
  const summary = getCardSummary(item);

  return `
    <button
      class="pv-slot-card ${stateClasses.join(' ')}${isSelected ? ' selected' : ''}"
      type="button"
      data-loadout="${escapeHtml(item?.kind ?? 'unknown')}"
      data-loadout-id="${escapeHtml(item?.id ?? '')}"
      data-loadout-key="${escapeHtml(item?.selectionKey ?? '')}"
      aria-pressed="${isSelected}"
      ${item?.kind === 'locked' ? 'disabled' : ''}
    >
      <div class="pv-slot-icon-box${iconBoxClass ? ` ${iconBoxClass}` : ''}">
        ${getSlotIcon(item, indexes)}
      </div>
      <div class="pv-slot-body">
        <div class="pv-slot-name">${escapeHtml(item?.name ?? getKindLabel(item?.kind))}</div>
        <div class="pv-slot-sub">${typePill}${levelText}</div>
        <div class="pv-slot-desc">${escapeHtml(summary)}</div>
      </div>
      ${rightHtml}
    </button>
  `;
}

export function renderPauseLoadoutGrid({
  label,
  icon,
  items,
  count,
  maxCount,
  selectedKey,
  player,
  data,
  indexes,
} = {}) {
  const cardsHtml = (items ?? [])
    .map((item) => renderPauseSlotCard(item, selectedKey, player, data, indexes))
    .join('');
  const sectionClass = label === '장신구'
    ? 'pv-slot-section pv-slot-section--acc'
    : 'pv-slot-section';

  return `
    <div class="${sectionClass}">
      ${renderSectionHeader(label, icon, count, maxCount)}
      <div class="pv-slot-cards">${cardsHtml}</div>
    </div>
  `;
}
