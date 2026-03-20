/**
 * src/ui/levelup/LevelUpView.js — 레벨업 카드 선택 UI
 *
 * MERGED:
 *   - Phase 2 Final: 카드 타입별 색상 구분 및 배지 추가
 *   - 기존 스타일 구조 유지
 */
export class LevelUpView {
  constructor(container) {
    this.el = document.createElement('div');
    this.el.className = 'levelup-overlay';
    this.el.style.display = 'none';
    this._injectStyles();
    container.appendChild(this.el);
    this._onSelect = null;
  }

  show(choices, onSelectCallback) {
    this._onSelect = onSelectCallback;
    this.el.innerHTML = `
      <div class="levelup-title">⬆ LEVEL UP</div>
      <div class="levelup-cards"></div>
    `;
    const cardsEl = this.el.querySelector('.levelup-cards');

    choices.forEach(upgrade => {
      const card = document.createElement('div');
      const typeClass = _getTypeClass(upgrade.type);
      card.className = `levelup-card ${typeClass}`;

      const badge = _getBadge(upgrade.type);

      card.innerHTML = `
        ${badge ? `<div class="card-badge">${badge}</div>` : ''}
        <div class="card-name">${upgrade.name}</div>
        <div class="card-desc">${upgrade.description}</div>
        ${upgrade.type === 'slot' ? `<div class="card-slot-hint">슬롯 확장</div>` : ''}
      `;
      card.addEventListener('click', () => this._pick(upgrade));
      cardsEl.appendChild(card);
    });

    this.el.style.display = 'flex';
  }

  _pick(upgrade) {
    this.el.style.display = 'none';
    this.el.innerHTML = '';
    if (this._onSelect) this._onSelect(upgrade);
    this._onSelect = null;
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
      .levelup-title {
        font-size: 28px; font-weight: 700;
        color: #ffd54f; text-shadow: 0 0 20px #ffd54f;
        letter-spacing: 4px;
        animation: levelup-pulse 0.6s ease-out;
      }
      @keyframes levelup-pulse {
        0%   { transform: scale(0.7); opacity: 0; }
        60%  { transform: scale(1.1); }
        100% { transform: scale(1);   opacity: 1; }
      }
      .levelup-cards {
        display: flex; gap: 14px; flex-wrap: wrap; justify-content: center;
      }
      .levelup-card {
        position: relative;
        width: 168px; padding: 20px 14px 18px;
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

      /* 타입별 색상 */
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
