import {
  renderSubscreenFooter,
  renderSubscreenHeader,
} from '../shared/subscreenTheme.js';

export function renderMetaShopMarkup({
  currency = 0,
  cards = [],
} = {}) {
  return `
    <div class="ms-panel ss-panel">

      ${renderSubscreenHeader({
        headerClass: 'ms-header',
        leftClass: 'ms-header-left',
        headingClass: 'ms-heading',
        runeClass: 'ms-rune',
        titleClass: 'ms-title',
        subtitleClass: 'ms-subtitle',
        rune: '⚗',
        title: 'Meta Shop',
        subtitle: '영구 강화를 구매해 다음 런을 준비합니다.',
      })}

      <div class="ms-currency-bar">
        <span class="ms-currency-label">보유 재화</span>
        <span class="ms-currency-value">💰 ${currency}</span>
      </div>

      <div class="ms-grid">
        ${cards.map((card) => `
          <div class="ms-card ${card.isMaxed ? 'is-maxed' : ''} ${card.canAfford ? 'can-afford' : ''}">
            <div class="ms-card-icon">${card.icon}</div>
            <div class="ms-card-body">
              <div class="ms-card-name">${card.name}</div>
              <div class="ms-card-desc">${card.description}</div>
              <div class="ms-progress-row">
                <div class="ms-pips">
                  ${Array.from({ length: card.maxLevel }, (_, index) => `
                    <span class="ms-pip ${index < card.currentLevel ? 'filled' : ''}"></span>
                  `).join('')}
                </div>
                <span class="ms-level-label">${card.isMaxed ? 'MAX' : `${card.currentLevel}/${card.maxLevel}`}</span>
              </div>
            </div>
            <button
              class="ms-buy-btn"
              data-id="${card.id}"
              ${card.canAfford ? '' : 'disabled'}
            >
              ${card.isMaxed ? '완료' : `💰 ${card.cost}`}
            </button>
          </div>
        `).join('')}
      </div>

      ${renderSubscreenFooter({
        footerClass: 'ms-footer',
        backButtonClass: 'ms-back-btn',
      })}

    </div>
  `;
}
