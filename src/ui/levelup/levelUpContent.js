function getTypeClass(type) {
  switch (type) {
    case 'weapon':
    case 'weapon_new':
    case 'weapon_upgrade':
    case 'weapon_evolution':
      return 'type-weapon';
    case 'stat': return 'type-stat';
    case 'accessory': return 'type-accessory';
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
    case 'slot': return 'SLOT';
    default: return '';
  }
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

  return `
    <div class="levelup-card-shell" data-index="${index}">
      <div class="levelup-card ${typeClass}${banishMode ? ' is-banish-mode' : ''}">
        ${badge ? `<div class="card-badge">${badge}</div>` : ''}
        <div class="card-name">${upgrade?.name ?? ''}</div>
        <div class="card-desc">${upgrade?.description ?? ''}</div>
        ${upgrade?.type === 'slot' ? '<div class="card-slot-hint">슬롯 확장</div>' : ''}
      </div>
      <div class="card-footer-actions">
        <button class="card-reroll-btn" type="button" ${rerollDisabled ? 'disabled' : ''}>리롤</button>
      </div>
    </div>
  `;
}
