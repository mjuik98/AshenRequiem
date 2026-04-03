import {
  renderSubscreenFooter,
  renderSubscreenHeader,
} from '../shared/subscreenTheme.js';

function renderMetaShopCard(card) {
  return `
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
}

function resolveActiveCard(viewModel = {}) {
  return viewModel.selectedCard ?? viewModel.availableCards?.[0] ?? viewModel.completedCards?.[0] ?? null;
}

export function renderMetaShopCurrencyBar({ currency = 0 } = {}) {
  return `
    <span class="ms-currency-label">보유 재화</span>
    <span class="ms-currency-value">💰 ${currency}</span>
  `;
}

export function renderMetaShopToolbar({
  activeCategory = 'all',
  activeSort = 'recommended',
  filters = [],
  sorts = [],
  visibleCount = 0,
  roadmapGoal = null,
} = {}) {
  return `
    <div class="ms-filter-tabs">
      ${filters.map((filter) => `
        <button
          class="ms-filter-tab ${filter.id === activeCategory ? 'is-active' : ''}"
          data-filter-id="${filter.id}"
          type="button"
        >
          ${filter.label}
        </button>
      `).join('')}
    </div>
    <div class="ms-toolbar-meta">
      <div class="ms-result-count">표시 항목 ${visibleCount}</div>
      ${roadmapGoal ? `
        <div class="ms-roadmap-chip">
          <span class="ms-roadmap-icon">${roadmapGoal.icon ?? '✦'}</span>
          <span class="ms-roadmap-copy">${roadmapGoal.title}</span>
          <span class="ms-roadmap-progress">${roadmapGoal.progressText ?? ''}</span>
        </div>
      ` : ''}
      <div class="ms-sort-group">
        ${sorts.map((sort) => `
          <button
            class="ms-sort-btn ${sort.id === activeSort ? 'is-active' : ''}"
            data-sort-id="${sort.id}"
            type="button"
          >
            ${sort.label}
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

export function renderMetaShopDetailPanel({ activeCard = null } = {}) {
  if (!activeCard) return '';

  return `
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
      <div class="ms-detail-stat">
        <span class="ms-detail-label">MAX까지 총 비용</span>
        <strong class="ms-detail-value">💰 ${activeCard.maxCostToFinish}</strong>
      </div>
      <div class="ms-detail-stat">
        <span class="ms-detail-label">추가 구매 가능 횟수</span>
        <strong class="ms-detail-value">${activeCard.affordablePurchaseCount}회</strong>
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
  `;
}

export function renderMetaShopStateSections({
  availableCards = [],
  lockedCards = [],
  completedCards = [],
} = {}) {
  return `
    <section class="ms-section ms-state-section">
      <div class="ms-section-heading">구매 가능</div>
      <div class="ms-grid">
        ${availableCards.map(renderMetaShopCard).join('')}
      </div>
    </section>

    ${lockedCards.length > 0 ? `
      <section class="ms-section ms-state-section">
        <div class="ms-section-heading">재화 부족</div>
        <div class="ms-grid">
          ${lockedCards.map(renderMetaShopCard).join('')}
        </div>
      </section>
    ` : ''}

    ${completedCards.length > 0 ? `
      <section class="ms-section ms-state-section is-completed">
        <div class="ms-section-heading">완료한 강화</div>
        <div class="ms-grid ms-grid-completed">
          ${completedCards.map(renderMetaShopCard).join('')}
        </div>
      </section>
    ` : ''}
  `;
}

export function renderMetaShopMarkup(viewModel = {}) {
  const activeCard = resolveActiveCard(viewModel);

  return `
    <div class="ms-panel ss-panel ss-scroll" role="dialog" aria-modal="true" aria-label="메타 상점" tabindex="-1">

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
        ${renderMetaShopCurrencyBar(viewModel)}
      </div>

      <section class="ms-toolbar">
        ${renderMetaShopToolbar(viewModel)}
      </section>

      <section class="ms-detail-panel">
        ${renderMetaShopDetailPanel({ activeCard })}
      </section>

      <div class="ms-sections-root">
        ${renderMetaShopStateSections(viewModel)}
      </div>

      ${renderSubscreenFooter({
        footerClass: 'ms-footer',
        backButtonClass: 'ms-back-btn',
      })}

    </div>
  `;
}
