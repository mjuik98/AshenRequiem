/**
 * src/ui/levelup/LevelUpView.js — 레벨업 / 상자 보상 카드 선택 UI
 *
 * CHANGE: show()에 title 파라미터 추가
 *   - 레벨업: '⬆ LEVEL UP'
 *   - 상자 보상: '📦 상자 보상!'
 *   - 카드 스타일은 동일하게 유지
 */
export class LevelUpView {
  constructor(container) {
    this.el = document.createElement('div');
    this.el.className = 'levelup-overlay';
    this.el.style.display = 'none';
    this._injectStyles();
    container.appendChild(this.el);
    this._onSelect = null;
    this._onReroll = null;
    this._onToggleBanishMode = null;
  }

  /**
   * @param {object} config
   */
  show(config = {}) {
    const {
      choices = [],
      onSelect = null,
      onReroll = null,
      onToggleBanishMode = null,
      title = '⬆ LEVEL UP',
      rerollsRemaining = 0,
      banishesRemaining = 0,
      banishMode = false,
    } = config;

    this._onSelect = onSelect;
    this._onReroll = onReroll;
    this._onToggleBanishMode = onToggleBanishMode;

    // 상자 보상 여부에 따라 타이틀 색상 클래스 변경
    const isChest    = title.includes('상자');
    const titleClass = isChest ? 'levelup-title chest-title' : 'levelup-title';

    this.el.innerHTML = `
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
    const cardsEl = this.el.querySelector('.levelup-cards');
    const toggleButton = this.el.querySelector('.levelup-mode-btn');

    toggleButton?.addEventListener('click', () => {
      this._onToggleBanishMode?.();
    });

    choices.forEach((upgrade, index) => {
      const cardShell = document.createElement('div');
      const card = document.createElement('div');
      const typeClass = _getTypeClass(upgrade.type);
      cardShell.className = 'levelup-card-shell';
      card.className = `levelup-card ${typeClass}${banishMode ? ' is-banish-mode' : ''}`;

      const badge = _getBadge(upgrade.type);
      const rerollDisabled = rerollsRemaining <= 0 || banishMode;

      card.innerHTML = `
        ${badge ? `<div class="card-badge">${badge}</div>` : ''}
        <div class="card-name">${upgrade.name}</div>
        <div class="card-desc">${upgrade.description}</div>
        ${upgrade.type === 'slot' ? `<div class="card-slot-hint">슬롯 확장</div>` : ''}
      `;
      card.addEventListener('click', () => this._pick(upgrade, index));

      const footerActions = document.createElement('div');
      footerActions.className = 'card-footer-actions';
      footerActions.innerHTML = `
        <button class="card-reroll-btn" type="button" ${rerollDisabled ? 'disabled' : ''}>리롤</button>
      `;
      footerActions.querySelector('.card-reroll-btn')?.addEventListener('click', (event) => {
        event.stopPropagation();
        this._onReroll?.(index);
      });

      cardShell.appendChild(card);
      cardShell.appendChild(footerActions);
      cardsEl.appendChild(cardShell);
    });

    this.el.style.display = 'flex';
  }

  hide() {
    this.el.style.display = 'none';
    this.el.innerHTML = '';
    this._onSelect = null;
    this._onReroll = null;
    this._onToggleBanishMode = null;
  }

  _pick(upgrade, index) {
    const onSelect = this._onSelect;
    this.hide();
    if (onSelect) onSelect(upgrade, index);
  }

  destroy() { this.el.remove(); }

  _injectStyles() {
    if (document.getElementById('levelup-styles')) return;
    const s = document.createElement('style');
    s.id = 'levelup-styles';
    s.textContent = `
      .levelup-overlay {
        position: absolute; inset: 0;
        background: rgba(0,0,0,0.75);
        display: flex; flex-direction: column;
        align-items: center; justify-content: center; gap: 24px;
        z-index: 30;
      }
      .levelup-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
      }
      .levelup-title {
        font-size: 28px; font-weight: 700;
        color: #ffd54f; text-shadow: 0 0 20px #ffd54f;
        letter-spacing: 4px;
        animation: levelup-pulse 0.6s ease-out;
      }
      .levelup-actions {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        flex-wrap: wrap;
      }
      .levelup-uses {
        padding: 7px 12px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,0.12);
        background: rgba(12, 18, 28, 0.82);
        font-size: 12px;
        color: #cfd8dc;
      }
      .levelup-mode-btn {
        padding: 8px 14px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,0.16);
        background: linear-gradient(180deg, #233044, #141d2b);
        color: #f3e5f5;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
      }
      .levelup-mode-btn.is-active {
        border-color: rgba(255, 138, 128, 0.8);
        background: linear-gradient(180deg, #4a2020, #2a1414);
        color: #ffccbc;
      }
      .levelup-mode-btn:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }
      /* 상자 보상 타이틀 — 금색 계열로 차별화 */
      .chest-title {
        color: #ffb300;
        text-shadow: 0 0 24px #ff8f00, 0 0 48px rgba(255,143,0,0.4);
        letter-spacing: 3px;
      }
      @keyframes levelup-pulse {
        0%   { transform: scale(0.7); opacity: 0; }
        60%  { transform: scale(1.1); }
        100% { transform: scale(1);   opacity: 1; }
      }
      .levelup-cards {
        display: flex; gap: 14px; flex-wrap: wrap; justify-content: center;
      }
      .levelup-card-shell {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 10px;
        width: 168px;
      }
      .levelup-card {
        position: relative;
        width: 100%; padding: 20px 14px 18px;
        background: linear-gradient(160deg, #1e2736, #141b26);
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 12px; cursor: pointer;
        transition: transform 0.18s, border-color 0.18s, box-shadow 0.18s;
        text-align: center;
      }
      .levelup-card:hover {
        transform: translateY(-6px) scale(1.04);
        box-shadow: 0 8px 28px rgba(0,0,0,0.4);
      }
      .levelup-card.is-banish-mode {
        border-color: rgba(255, 138, 128, 0.6);
        box-shadow: inset 0 0 0 1px rgba(255, 138, 128, 0.22);
      }

      .levelup-card.type-weapon:hover   { border-color: #ffd54f; box-shadow: 0 6px 24px rgba(255,213,79,0.3); }
      .levelup-card.type-stat:hover     { border-color: #66bb6a; box-shadow: 0 6px 24px rgba(102,187,106,0.3); }
      .levelup-card.type-accessory:hover{ border-color: #ce93d8; box-shadow: 0 6px 24px rgba(206,147,216,0.3); }
      .levelup-card.type-slot {
        border-color: rgba(100,181,246,0.35);
        background: linear-gradient(160deg, #1a2540, #111b30);
      }
      .levelup-card.type-slot:hover {
        border-color: #64b5f6;
        box-shadow: 0 6px 24px rgba(100,181,246,0.35);
      }

      .card-badge {
        position: absolute; top: -1px; right: -1px;
        font-size: 9px; font-weight: 800; letter-spacing: 0.08em;
        padding: 3px 8px;
        border-radius: 0 11px 0 8px;
        background: rgba(255,255,255,0.08);
        color: #aaa;
      }
      .type-weapon   .card-badge { background: rgba(255,213,79,0.2);  color: #ffd54f; }
      .type-stat     .card-badge { background: rgba(102,187,106,0.2); color: #66bb6a; }
      .type-accessory .card-badge { background: rgba(206,147,216,0.2); color: #ce93d8; }
      .type-slot     .card-badge { background: rgba(100,181,246,0.2);  color: #64b5f6; }

      .card-name {
        font-size: 13px; font-weight: 700; color: #ffd54f; margin-bottom: 8px;
      }
      .type-stat     .card-name { color: #a5d6a7; }
      .type-accessory .card-name { color: #ce93d8; }
      .type-slot     .card-name { color: #90caf9; }

      .card-desc {
        font-size: 11px; color: #aaa; line-height: 1.5;
      }
      .card-slot-hint {
        margin-top: 8px; font-size: 10px; color: #64b5f6;
        letter-spacing: 0.12em; text-transform: uppercase;
      }
      .card-footer-actions {
        display: flex;
        justify-content: center;
      }
      .card-reroll-btn {
        width: 100%;
        min-height: 36px;
        padding: 7px 10px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,0.14);
        background: rgba(9, 14, 22, 0.88);
        color: #eceff1;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
      }
      .card-reroll-btn:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }
    `;
    document.head.appendChild(s);
  }
}

function _getTypeClass(type) {
  if (type === 'weapon_new' || type === 'weapon_upgrade') return 'type-weapon';
  if (type === 'stat') return 'type-stat';
  if (type === 'accessory') return 'type-accessory';
  if (type === 'slot') return 'type-slot';
  return '';
}

function _getBadge(type) {
  if (type === 'weapon_new')     return 'NEW';
  if (type === 'weapon_upgrade') return 'UP';
  if (type === 'accessory')      return 'ITEM';
  if (type === 'slot')           return 'SLOT';
  if (type === 'stat')           return 'STAT';
  return null;
}
