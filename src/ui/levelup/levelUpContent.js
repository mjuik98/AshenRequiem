function getTypeClass(type) {
  switch (type) {
    case 'weapon':
    case 'weapon_new':
    case 'weapon_upgrade':
      return 'type-weapon';
    case 'weapon_evolution':
      return 'type-weapon type-evolution';
    case 'accessory_upgrade':
    case 'accessory': return 'type-accessory';
    case 'stat': return 'type-stat';
    case 'slot': return 'type-slot';
    default: return '';
  }
}

function getBadge(type) {
  switch (type) {
    case 'weapon': return 'WEAPON';
    case 'weapon_new': return 'NEW';
    case 'weapon_upgrade': return 'UP';
    case 'weapon_evolution': return 'EVO';
    case 'stat': return 'STAT';
    case 'accessory': return 'RELIC';
    case 'accessory_upgrade': return 'UP';
    case 'slot': return 'SLOT';
    default: return '';
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function buildLevelUpHeaderMarkup({
  title = '⬆ LEVEL UP',
  rerollsRemaining = 0,
  banishesRemaining = 0,
  banishMode = false,
} = {}) {
  const isChest = title.includes('상자');
  const titleClass = isChest ? 'levelup-title chest-title' : 'levelup-title';

  return `
    <div class="levelup-header">
      <div class="${titleClass}">${title}</div>
      <div class="levelup-actions">
        <div class="levelup-uses">남은 리롤 <strong>${rerollsRemaining}</strong></div>
        <div class="levelup-uses">남은 봉인 <strong>${banishesRemaining}</strong></div>
        <button
          class="levelup-mode-btn ${banishMode ? 'is-active' : ''}"
          type="button"
          ${banishesRemaining <= 0 && !banishMode ? 'disabled' : ''}
        >
          ${banishMode ? '봉인 모드 해제' : '봉인 모드'}
        </button>
      </div>
    </div>
    <div class="levelup-cards"></div>
  `;
}

export function buildLevelUpCardMarkup({
  upgrade,
  index,
  rerollsRemaining = 0,
  banishMode = false,
}) {
  const typeClass = getTypeClass(upgrade?.type);
  const badge = getBadge(upgrade?.type);
  const rerollDisabled = rerollsRemaining <= 0 || banishMode;
  const relatedHints = Array.isArray(upgrade?.relatedHints) ? upgrade.relatedHints : [];
  const levelLabel = upgrade?.levelLabel ?? '';
  const currentLabel = upgrade?.currentLabel ?? '';
  const currentText = upgrade?.currentText ?? '';
  const previewLabel = upgrade?.previewLabel ?? '';
  const previewText = upgrade?.previewText ?? '';
  const discoveryLabel = upgrade?.discoveryLabel ?? '';
  const icon = upgrade?.icon ?? (upgrade?.type === 'weapon_evolution' ? '✦' : upgrade?.type === 'accessory' || upgrade?.type === 'accessory_upgrade' ? '◆' : upgrade?.type === 'slot' ? '⬒' : upgrade?.type === 'stat' ? '✚' : '⚔');
  const badgeClass = upgrade?.type === 'weapon_evolution' ? ' card-badge-evolution' : '';

  return `
    <div class="levelup-card-shell" data-index="${index}">
      <div class="levelup-card ${typeClass}${banishMode ? ' is-banish-mode' : ''}">
        ${badge ? `<div class="card-badge${badgeClass}">${badge}</div>` : ''}
        <div class="card-icon" aria-hidden="true">${icon}</div>
        <div class="card-name">${escapeHtml(upgrade?.name ?? '')}</div>
        ${levelLabel || discoveryLabel ? `
          <div class="card-meta-row">
            ${levelLabel ? `<span class="card-progression">${escapeHtml(levelLabel)}</span>` : ''}
            ${discoveryLabel ? `<span class="card-discovery-chip">${escapeHtml(discoveryLabel)}</span>` : ''}
          </div>
        ` : ''}
        ${currentText || previewText ? `
          <div class="card-comparison">
            ${currentText ? `
              <div class="card-detail-block card-detail-current">
                ${currentLabel ? `<div class="card-current-label">${escapeHtml(currentLabel)}</div>` : ''}
                <div class="card-current-text">${escapeHtml(currentText)}</div>
              </div>
            ` : ''}
            ${previewText ? `
              <div class="card-detail-block card-detail-next">
                ${previewLabel ? `<div class="card-preview-label">${escapeHtml(previewLabel)}</div>` : ''}
                <div class="card-preview-text">${escapeHtml(previewText)}</div>
              </div>
            ` : ''}
          </div>
        ` : ''}
        <div class="card-desc">${escapeHtml(upgrade?.description ?? '')}</div>
        ${relatedHints.length > 0 ? `
          <div class="card-related-hints">
            ${relatedHints.map((hint) => `<span class="card-related-chip">${escapeHtml(hint)}</span>`).join('')}
          </div>
        ` : ''}
        ${upgrade?.type === 'slot' ? '<div class="card-slot-hint">슬롯 확장</div>' : ''}
      </div>
      <div class="card-footer-actions">
        <button class="card-reroll-btn" type="button" ${rerollDisabled ? 'disabled' : ''}>리롤</button>
      </div>
    </div>
  `;
}
