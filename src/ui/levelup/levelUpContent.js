import { renderActionButton } from '../shared/actionButtonTheme.js';
import { renderModalHeader, renderModalShell } from '../shared/modalShell.js';

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
    case 'weapon': return '무기';
    case 'weapon_new': return '신규';
    case 'weapon_upgrade': return '강화';
    case 'weapon_evolution': return '진화';
    case 'stat': return '능력';
    case 'accessory': return '장신구';
    case 'accessory_upgrade': return '강화';
    case 'slot': return '슬롯';
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
  const eyebrow = isChest ? 'Reward' : 'Choice';
  const copy = isChest
    ? '상자에서 나온 보상 중 현재 빌드에 가장 필요한 선택지를 고르세요.'
    : '지금 빌드 흐름에 맞는 강화 카드를 선택하세요.';
  const modeButton = renderActionButton({
    className: `levelup-mode-btn ${banishMode ? 'is-active' : ''}`,
    label: banishMode ? '봉인 모드 해제' : '봉인 모드',
    tone: banishMode ? 'danger' : 'neutral',
    shape: 'pill',
    size: 'sm',
    disabled: banishesRemaining <= 0 && !banishMode,
    attributes: {
      'data-action': 'toggle-banish-mode',
    },
  });
  const headerHtml = renderModalHeader({
    eyebrow,
    title,
    copy,
    titleTag: 'div',
    titleId: 'levelup-title',
    headerClassName: 'levelup-header',
    eyebrowClassName: 'levelup-eyebrow',
    titleClassName: titleClass,
    copyClassName: 'levelup-copy',
  });
  const bodyHtml = `
    <div class="levelup-actions">
      <div class="levelup-uses">남은 리롤 <strong>${rerollsRemaining}</strong></div>
      <div class="levelup-uses">남은 봉인 <strong>${banishesRemaining}</strong></div>
      ${modeButton}
    </div>
    <div class="levelup-cards"></div>
  `;

  return renderModalShell({
    tone: 'reward',
    shellClassName: 'levelup-shell',
    backdropClassName: 'levelup-backdrop',
    panelTag: 'div',
    panelClassName: 'levelup-stage ui-modal-panel--floating ui-modal-panel--scroll',
    panelAttributes: {
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': 'levelup-title',
      tabindex: '-1',
    },
    headerHtml,
    bodyHtml,
  });
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
  const summaryText = upgrade?.summaryText ?? upgrade?.previewText ?? upgrade?.description ?? '';
  const priorityHint = upgrade?.priorityHint ?? '';
  const priorityHintType = upgrade?.priorityHintType ?? '';
  const discoveryLabel = upgrade?.discoveryLabel ?? '';
  const icon = upgrade?.icon ?? (upgrade?.type === 'weapon_evolution' ? '✦' : upgrade?.type === 'accessory' || upgrade?.type === 'accessory_upgrade' ? '◆' : upgrade?.type === 'slot' ? '⬒' : upgrade?.type === 'stat' ? '✚' : '⚔');
  const badgeClass = upgrade?.type === 'weapon_evolution' ? ' card-badge-evolution' : '';
  const rerollButton = renderActionButton({
    className: 'card-reroll-btn',
    label: '리롤',
    tone: 'neutral',
    shape: 'pill',
    size: 'sm',
    disabled: rerollDisabled,
  });

  return `
    <div class="levelup-card-shell" data-index="${index}">
      <div class="levelup-card ${typeClass}${banishMode ? ' is-banish-mode' : ''}">
        ${badge ? `<div class="card-badge${badgeClass}">${badge}</div>` : ''}
        <div class="card-main">
          <div class="card-icon" aria-hidden="true">${icon}</div>
          <div class="card-name">${escapeHtml(upgrade?.name ?? '')}</div>
          ${priorityHint ? `<div class="card-priority-hint ${priorityHintType ? `is-${escapeHtml(priorityHintType)}` : ''}">${escapeHtml(priorityHint)}</div>` : ''}
          ${summaryText ? `<div class="card-summary">${escapeHtml(summaryText)}</div>` : ''}
          ${levelLabel || discoveryLabel ? `
            <div class="card-meta-row">
              ${levelLabel ? `<span class="card-progression">${escapeHtml(levelLabel)}</span>` : ''}
              ${discoveryLabel ? `<span class="card-discovery-chip">${escapeHtml(discoveryLabel)}</span>` : ''}
            </div>
          ` : ''}
          ${relatedHints.length > 0 ? `
            <div class="card-related-hints">
              ${relatedHints.map((hint) => `<span class="card-related-chip">${escapeHtml(hint)}</span>`).join('')}
            </div>
          ` : ''}
          ${upgrade?.type === 'slot' ? '<div class="card-slot-hint">슬롯 확장</div>' : ''}
        </div>
      </div>
      <div class="card-footer-actions">
        ${rerollButton}
      </div>
    </div>
  `;
}
