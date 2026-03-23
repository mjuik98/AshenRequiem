import { escapeHtml, getRelatedItems } from './pauseLoadoutModel.js';

export function renderPauseLinkedItemsSection(selectedItem, player, data, indexes) {
  const relatedItems = getRelatedItems(selectedItem, player, data, indexes);
  const linkedItemsHtml = relatedItems.length > 0
    ? relatedItems.map((item) => `
        <span class="pv-loadout-chip${item.equipped ? ' equipped' : ''}">
          ${escapeHtml(item.name)}
          <span class="pv-loadout-chip-meta">${escapeHtml(item.equipped ? '보유' : '미보유')}</span>
        </span>
      `).join('')
    : `<div class="pv-loadout-empty-msg">${escapeHtml(
      selectedItem?.kind === 'weapon' || selectedItem?.kind === 'accessory'
        ? '이 장비와 직접 연결된 아이템이 없습니다.'
        : '장비를 획득하면 연결 가능한 조합이 여기에 표시됩니다.',
    )}</div>`;

  const hints = relatedItems.map((item) => ({
    title: item.name,
    text: [...item.reasons].join(' · '),
  }));
  const hintsHtml = hints.length > 0
    ? hints.map((hint) => `
        <div class="pv-loadout-link-row">
          <span class="pv-loadout-link-key">${escapeHtml(hint.title)}</span>
          <span class="pv-loadout-link-val">${escapeHtml(hint.text)}</span>
        </div>
      `).join('')
    : '';

  return `
    <section class="pv-loadout-linked-items variant-links">
      <h4 class="pv-loadout-section-title">연결 아이템</h4>
      <div class="pv-loadout-chip-row">
        ${linkedItemsHtml}
      </div>
      ${hintsHtml ? `<div class="pv-loadout-link-list">${hintsHtml}</div>` : ''}
    </section>
  `;
}
