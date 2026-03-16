/**
 * LevelUpView — 레벨업 카드 선택 UI
 * 규칙: 업그레이드 선택 결과를 callback 으로 Scene 에 전달만 함 — 직접 수정 금지
 */
export class LevelUpView {
  constructor(container) {
    this.el = document.createElement('div');
    this.el.id = 'levelup-overlay';
    this.el.style.display = 'none';
    this._injectStyles();
    container.appendChild(this.el);
    this._onSelect = null;
  }

  show(choices, onSelectCallback) {
    this._onSelect = onSelectCallback;
    this.el.innerHTML = `
      <div class="levelup-title">⬆ LEVEL UP</div>
      <div class="levelup-cards" id="levelup-cards"></div>
    `;
    const cardsEl = document.getElementById('levelup-cards');
    choices.forEach(upgrade => {
      const card = document.createElement('div');
      card.className = 'levelup-card';
      card.innerHTML = `
        <div class="card-name">${upgrade.name}</div>
        <div class="card-desc">${upgrade.description}</div>
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
      #levelup-overlay {
        position: absolute; inset: 0;
        background: rgba(0,0,0,0.72);
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
        display: flex; gap: 16px; flex-wrap: wrap; justify-content: center;
      }
      .levelup-card {
        width: 160px; padding: 20px 16px;
        background: linear-gradient(160deg, #1e2736, #141b26);
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 10px; cursor: pointer;
        transition: transform 0.18s, border-color 0.18s, box-shadow 0.18s;
        text-align: center;
      }
      .levelup-card:hover {
        transform: translateY(-6px) scale(1.04);
        border-color: #ffd54f;
        box-shadow: 0 6px 24px rgba(255,213,79,0.25);
      }
      .card-name {
        font-size: 14px; font-weight: 700; color: #ffd54f; margin-bottom: 8px;
      }
      .card-desc {
        font-size: 12px; color: #aaa; line-height: 1.5;
      }
    `;
    document.head.appendChild(s);
  }
}
