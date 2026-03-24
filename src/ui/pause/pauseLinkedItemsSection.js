import { escapeHtml, getRelatedItems } from './pauseLoadoutModel.js';

export function renderPauseLinkedItemsSection(selectedItem, player, data, indexes) {
  const relatedItems = getRelatedItems(selectedItem, player, data, indexes)
    .map((item) => ({
      ...item,
      reasons: [...item.reasons].filter((reason) => reason !== '진화 경로'),
    }))
    .filter((item) => item.reasons.length > 0);
  const linkedItemsHtml = relatedItems.length > 0
    ? relatedItems.map((item) => `
        <span class="pv-loadout-chip${item.equipped ? ' equipped' : ''}">
          ${escapeHtml(item.name)}
          <span class="pv-loadout-chip-meta">${escapeHtml(`${item.equipped ? '보유' : '미보유'} · ${item.reasons.join(', ')}`)}</span>
        </span>
      `).join('')
    : `<div class="pv-loadout-empty-msg">${escapeHtml(
      selectedItem?.kind === 'weapon' || selectedItem?.kind === 'accessory'
        ? '이 장비와 직접 연결된 아이템이 없습니다.'
        : '장비를 획득하면 연결 가능한 조합이 여기에 표시됩니다.',
    )}</div>`;

  return `
    <section class="pv-loadout-linked-items variant-links">
      <h4 class="pv-loadout-section-title">연결 아이템</h4>
      <div class="pv-loadout-chip-row">
        ${linkedItemsHtml}
      </div>
    </section>
  `;
}
