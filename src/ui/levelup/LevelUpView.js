/**
 * src/ui/levelup/LevelUpView.js — 레벨업 / 상자 보상 카드 선택 UI
 *
 * CHANGE: show()에 title 파라미터 추가
 *   - 레벨업: '⬆ LEVEL UP'
 *   - 상자 보상: '📦 상자 보상!'
 *   - 카드 스타일은 동일하게 유지
 */
import {
  buildLevelUpCardMarkup,
  buildLevelUpHeaderMarkup,
} from './levelUpContent.js';

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

    this.el.innerHTML = buildLevelUpHeaderMarkup({
      title,
      rerollsRemaining,
      banishesRemaining,
      banishMode,
    });
    const cardsEl = this.el.querySelector('.levelup-cards');
    const toggleButton = this.el.querySelector('.levelup-mode-btn');

    toggleButton?.addEventListener('click', () => {
      this._onToggleBanishMode?.();
    });

    choices.forEach((upgrade, index) => {
      const cardShell = document.createElement('div');
      cardShell.innerHTML = buildLevelUpCardMarkup({
        upgrade,
        index,
        rerollsRemaining,
        banishMode,
      });
      const renderedShell = cardShell.firstElementChild;
      const card = renderedShell?.querySelector('.levelup-card');
      card.addEventListener('click', () => this._pick(upgrade, index));
      renderedShell?.querySelector('.card-reroll-btn')?.addEventListener('click', (event) => {
        event.stopPropagation();
        this._onReroll?.(index);
      });
      if (renderedShell) {
        cardsEl.appendChild(renderedShell);
      }
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
        background:
          radial-gradient(circle at 50% 30%, rgba(212,175,106,0.12), transparent 36%),
          rgba(0,0,0,0.78);
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
        font-size: 30px; font-weight: 800;
        color: #f5d47c; text-shadow: 0 0 20px rgba(245,212,124,0.55);
        letter-spacing: 0.2em;
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
        display: flex; gap: 16px; flex-wrap: wrap; justify-content: center;
      }
      .levelup-card-shell {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 10px;
        width: 188px;
      }
      .levelup-card {
        position: relative;
        width: 100%; padding: 22px 16px 18px;
        background: linear-gradient(180deg, rgba(22,27,36,0.98), rgba(12,16,24,0.98));
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 16px; cursor: pointer;
        transition: transform 0.18s, border-color 0.18s, box-shadow 0.18s, background 0.18s;
        text-align: left;
        overflow: hidden;
      }
      .levelup-card::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 3px;
        background: rgba(255,255,255,0.1);
      }
      .levelup-card:hover {
        transform: translateY(-6px);
        box-shadow: 0 16px 36px rgba(0,0,0,0.42);
      }
      .levelup-card.is-banish-mode {
        border-color: rgba(255, 138, 128, 0.6);
        box-shadow: inset 0 0 0 1px rgba(255, 138, 128, 0.22);
      }

      .levelup-card.type-weapon::before { background: linear-gradient(90deg, #f7d67f, #d4af6a); }
      .levelup-card.type-stat::before { background: linear-gradient(90deg, #9bd49f, #66bb6a); }
      .levelup-card.type-accessory::before { background: linear-gradient(90deg, #e0b4e6, #ce93d8); }
      .levelup-card.type-slot::before { background: linear-gradient(90deg, #9ccffd, #64b5f6); }
      .levelup-card.type-evolution {
        background: linear-gradient(180deg, rgba(41,25,15,0.98), rgba(18,13,9,0.98));
        border-color: rgba(245, 212, 124, 0.4);
      }
      .levelup-card.type-evolution::before { background: linear-gradient(90deg, #fff2b0, #f5c96a); }
      .levelup-card.type-weapon:hover   { border-color: #ffd54f; box-shadow: 0 14px 32px rgba(255,213,79,0.2); }
      .levelup-card.type-stat:hover     { border-color: #66bb6a; box-shadow: 0 14px 32px rgba(102,187,106,0.18); }
      .levelup-card.type-accessory:hover{ border-color: #ce93d8; box-shadow: 0 14px 32px rgba(206,147,216,0.2); }
      .levelup-card.type-evolution:hover { border-color: #ffe08a; box-shadow: 0 16px 36px rgba(255, 208, 112, 0.22); }
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
      .card-badge-evolution { background: rgba(255, 224, 138, 0.2) !important; color: #ffe08a !important; }

      .card-icon {
        width: 38px;
        height: 38px;
        margin-bottom: 12px;
        border-radius: 12px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.08);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
      }
      .type-weapon .card-icon { color: #f7d67f; background: rgba(212,175,106,0.12); border-color: rgba(212,175,106,0.22); }
      .type-accessory .card-icon { color: #e0b4e6; background: rgba(206,147,216,0.12); border-color: rgba(206,147,216,0.22); }
      .type-stat .card-icon { color: #9bd49f; background: rgba(102,187,106,0.12); border-color: rgba(102,187,106,0.22); }
      .type-slot .card-icon { color: #9ccffd; background: rgba(100,181,246,0.12); border-color: rgba(100,181,246,0.24); }
      .type-evolution .card-icon { color: #fff2b0; background: rgba(245,212,124,0.14); border-color: rgba(245,212,124,0.28); }

      .card-name {
        font-size: 15px; font-weight: 800; color: #ffd54f; margin-bottom: 8px; line-height: 1.25;
      }
      .type-stat     .card-name { color: #a5d6a7; }
      .type-accessory .card-name { color: #ce93d8; }
      .type-slot     .card-name { color: #90caf9; }
      .type-evolution .card-name { color: #ffe08a; }

      .card-desc {
        font-size: 11px; color: rgba(236,239,241,0.72); line-height: 1.55; min-height: 52px;
      }
      .card-related-hints {
        margin-top: 10px;
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 6px;
      }
      .card-related-chip {
        display: inline-flex;
        align-items: center;
        min-height: 22px;
        padding: 0 9px;
        border-radius: 999px;
        border: 1px solid rgba(212,175,106,0.18);
        background: rgba(212,175,106,0.08);
        color: #f3e5c3;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.02em;
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
