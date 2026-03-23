import {
  buildRequirementReference,
  escapeHtml,
  getReferenceGlyphForRequirement,
  isReferenceEquipped,
  toArray,
} from './pauseLoadoutModel.js';

function renderMetaIcon(icon, toneClass = 'tone-neutral') {
  const glyph = escapeHtml(icon || '•');
  return `<span class="pv-loadout-meta-icon ${toneClass}" aria-hidden="true">${glyph}</span>`;
}

function renderRequirementChip(reference, player) {
  if (!reference) return '';
  const toneClass = reference.kind === 'weapon'
    ? 'tone-weapon'
    : reference.kind === 'accessory'
      ? 'tone-accessory'
      : 'tone-neutral';
  const icon = reference?.item?.icon ?? getReferenceGlyphForRequirement(reference?.kind);
  const name = reference?.item?.name ?? reference?.id ?? '요구 조건';
  const equippedClass = isReferenceEquipped(reference, player) ? ' equipped' : '';
  return `
    <span class="pv-loadout-req-chip ${toneClass}${equippedClass}" data-req-id="${escapeHtml(reference?.id ?? '')}">
      <span class="pv-loadout-req-icon" aria-hidden="true">${escapeHtml(icon)}</span>
      <span class="pv-loadout-req-name">${escapeHtml(name)}</span>
    </span>
  `;
}

export function renderPauseSynergySection(selectedItem, player, indexes) {
  if (selectedItem?.kind !== 'weapon' && selectedItem?.kind !== 'accessory') {
    return `
      <section class="pv-loadout-synergy variant-synergy">
        <h4 class="pv-loadout-section-title">시너지</h4>
        <div class="pv-loadout-empty-msg">현재 장비 조합으로 활성 가능한 시너지가 없습니다.</div>
      </section>
    `;
  }

  const sourceMap = selectedItem.kind === 'weapon'
    ? indexes?.synergiesByWeaponId
    : indexes?.synergiesByAccessoryId;
  const synergies = sourceMap?.get(selectedItem.id) ?? [];
  const activeSynergyIds = new Set(player?.activeSynergies ?? []);

  if (synergies.length === 0) {
    return `
      <section class="pv-loadout-synergy variant-synergy">
        <h4 class="pv-loadout-section-title">시너지</h4>
        <div class="pv-loadout-empty-msg">현재 장비 조합으로 활성 가능한 시너지가 없습니다.</div>
      </section>
    `;
  }

  const synergyHtml = synergies.map((synergy) => {
    const isActive = activeSynergyIds.has(synergy?.id);
    const requirementRefs = toArray(synergy?.requires)
      .map((requirement) => buildRequirementReference(requirement, indexes))
      .filter(Boolean);
    return `
      <div class="pv-loadout-synergy-row${isActive ? ' active' : ''}">
        <div class="pv-loadout-synergy-head">
          <div class="pv-loadout-meta-title">
            ${renderMetaIcon('✦', 'tone-synergy')}
            <span class="pv-loadout-synergy-name">${escapeHtml(synergy?.name ?? synergy?.id ?? '시너지')}</span>
          </div>
          <span class="pv-loadout-synergy-state">${isActive ? '활성' : '비활성'}</span>
        </div>
        <div class="pv-loadout-synergy-desc">${escapeHtml(synergy?.description ?? '')}</div>
        ${requirementRefs.length > 0 ? `<div class="pv-loadout-req-chips">${requirementRefs.map((reference) => renderRequirementChip(reference, player)).join('')}</div>` : ''}
      </div>
    `;
  }).join('');

  return `
    <section class="pv-loadout-synergy variant-synergy">
      <h4 class="pv-loadout-section-title">시너지</h4>
      <div class="pv-loadout-synergy-list">
        ${synergyHtml}
      </div>
    </section>
  `;
}
