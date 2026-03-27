import {
  renderSubscreenFooter,
  renderSubscreenHeader,
} from '../shared/subscreenTheme.js';

export function renderMetaShopMarkup({
  currency = 0,
  cards = [],
  selectedCard = null,
  availableCards = cards,
  completedCards = [],
} = {}) {
  const activeCard = selectedCard ?? availableCards[0] ?? completedCards[0] ?? null;
  const renderCard = (card) => `
    <article class="ms-card ${card.isMaxed ? 'is-maxed' : ''} ${card.canAfford ? 'can-afford' : ''} ${card.isSelected ? 'is-selected' : ''}">
      <button class="ms-select-btn" data-select-id="${card.id}" type="button" aria-pressed="${card.isSelected ? 'true' : 'false'}">
        <span class="ms-card-icon">${card.icon}</span>
        <span class="ms-card-copy">
          <span class="ms-card-topline">
            <span class="ms-card-name">${card.name}</span>
            <span class="ms-status-badge is-${card.status}">${card.statusLabel}</span>
          </span>
          <span class="ms-card-level">${card.levelLabel}</span>
          <span class="ms-card-cost">${card.nextCostLabel}</span>
        </span>
      </button>
    </article>
  `;

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

      <section class="ms-detail-panel">
        ${activeCard ? `
          <div class="ms-detail-head">
            <div class="ms-detail-title-wrap">
              <div class="ms-detail-icon">${activeCard.icon}</div>
              <div>
                <div class="ms-detail-title-row">
                  <h2 class="ms-detail-title">${activeCard.name}</h2>
                  <span class="ms-status-badge is-${activeCard.status}">${activeCard.statusLabel}</span>
                </div>
                <p class="ms-detail-desc">${activeCard.description}</p>
              </div>
            </div>
            <div class="ms-detail-level">${activeCard.levelLabel}</div>
          </div>

          <div class="ms-detail-stats">
            <div class="ms-detail-stat">
              <span class="ms-detail-label">현재 효과</span>
              <strong class="ms-detail-value">${activeCard.currentEffectText}</strong>
            </div>
            <div class="ms-detail-stat">
              <span class="ms-detail-label">다음 레벨</span>
              <strong class="ms-detail-value">${activeCard.nextEffectText}</strong>
            </div>
            <div class="ms-detail-stat">
              <span class="ms-detail-label">남은 레벨</span>
              <strong class="ms-detail-value">${activeCard.remainingLevels}</strong>
            </div>
            <div class="ms-detail-stat">
              <span class="ms-detail-label">구매 후 잔액</span>
              <strong class="ms-detail-value">${activeCard.isMaxed ? '완료' : `💰 ${activeCard.postPurchaseCurrency}`}</strong>
            </div>
          </div>

          <button
            class="ms-buy-btn ms-detail-buy-btn"
            data-id="${activeCard.id}"
            type="button"
            ${activeCard.canAfford ? '' : 'disabled'}
          >
            ${activeCard.isMaxed ? '완료' : activeCard.canAfford ? `${activeCard.nextCostLabel} 구매` : `${activeCard.nextCostLabel} 필요`}
          </button>
        ` : ''}
      </section>

      <section class="ms-section">
        <div class="ms-section-heading">구매 후보</div>
        <div class="ms-grid">
          ${availableCards.map(renderCard).join('')}
        </div>
      </section>

      ${completedCards.length > 0 ? `
        <section class="ms-section is-completed">
          <div class="ms-section-heading">완료한 강화</div>
          <div class="ms-grid ms-grid-completed">
            ${completedCards.map(renderCard).join('')}
          </div>
        </section>
      ` : ''}

      ${renderSubscreenFooter({
        footerClass: 'ms-footer',
        backButtonClass: 'ms-back-btn',
      })}

    </div>
  `;
}
