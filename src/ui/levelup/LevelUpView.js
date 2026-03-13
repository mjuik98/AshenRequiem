/**
 * LevelUpView — 레벨업 카드 선택 UI
 */
export class LevelUpView {
  constructor(container) {
    this.el = document.createElement('div');
    this.el.id = 'levelup-overlay';
    this.el.style.display = 'none';
    this._injectStyles();
    container.appendChild(this.el);
  }

  /**
   * 선택지 표시
   * @param {Array} choices
   * @param {function} onSelect — (upgrade) => void
   */
  show(choices, onSelect) {
    this.el.innerHTML = `
      <div class="levelup-panel">
        <h2 class="levelup-title">LEVEL UP!</h2>
        <div class="levelup-cards">
          ${choices.map((c, i) => `
            <button class="levelup-card" data-index="${i}">
              <div class="levelup-card-icon">${c.icon || '⭐'}</div>
              <div class="levelup-card-name">${c.name}</div>
              <div class="levelup-card-desc">${c.description}</div>
            </button>
          `).join('')}
        </div>
      </div>
    `;

    this.el.style.display = 'flex';

    // 카드 클릭 핸들러
    const cards = this.el.querySelectorAll('.levelup-card');
    cards.forEach((card, i) => {
      card.addEventListener('click', () => {
        onSelect(choices[i]);
        this.hide();
      });
    });
  }

  hide() {
    this.el.style.display = 'none';
    this.el.innerHTML = '';
  }

  destroy() {
    this.el.remove();
  }

  _injectStyles() {
    if (document.getElementById('levelup-styles')) return;
    const style = document.createElement('style');
    style.id = 'levelup-styles';
    style.textContent = `
      #levelup-overlay {
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        display: none;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.65);
        backdrop-filter: blur(4px);
        z-index: 100;
      }
      .levelup-panel {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 24px;
      }
      .levelup-title {
        font-size: 36px;
        font-weight: 800;
        color: #ffd54f;
        text-shadow: 0 0 20px rgba(255,213,79,0.5);
        letter-spacing: 4px;
        animation: levelupPulse 0.8s ease-in-out infinite alternate;
      }
      @keyframes levelupPulse {
        from { transform: scale(1); }
        to { transform: scale(1.05); }
      }
      .levelup-cards {
        display: flex;
        gap: 16px;
      }
      .levelup-card {
        width: 180px;
        padding: 24px 16px;
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.15);
        border-radius: 12px;
        color: #e0e0e0;
        cursor: pointer;
        text-align: center;
        transition: all 0.2s ease;
        font-family: inherit;
      }
      .levelup-card:hover {
        background: rgba(255,213,79,0.15);
        border-color: #ffd54f;
        transform: translateY(-4px);
        box-shadow: 0 6px 20px rgba(255,213,79,0.2);
      }
      .levelup-card-icon {
        font-size: 36px;
        margin-bottom: 12px;
      }
      .levelup-card-name {
        font-size: 16px;
        font-weight: 700;
        margin-bottom: 8px;
        color: #fff;
      }
      .levelup-card-desc {
        font-size: 12px;
        color: #aaa;
        line-height: 1.4;
      }
    `;
    document.head.appendChild(style);
  }
}
