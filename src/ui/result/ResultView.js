/**
 * ResultView — 사망 시 결과 화면
 */
export class ResultView {
  constructor(container) {
    this.el = document.createElement('div');
    this.el.id = 'result-overlay';
    this.el.style.display = 'none';
    this._injectStyles();
    container.appendChild(this.el);
  }

  /**
   * 결과 표시
   * @param {{ killCount, survivalTime, level }} data
   * @param {function} onRestart
   */
  show(data, onRestart) {
    const min = String(Math.floor(data.survivalTime / 60)).padStart(2, '0');
    const sec = String(Math.floor(data.survivalTime % 60)).padStart(2, '0');

    this.el.innerHTML = `
      <div class="result-panel">
        <h2 class="result-title">YOU DIED</h2>
        <div class="result-stats">
          <div class="result-stat">
            <span class="result-stat-label">생존 시간</span>
            <span class="result-stat-value">${min}:${sec}</span>
          </div>
          <div class="result-stat">
            <span class="result-stat-label">처치 수</span>
            <span class="result-stat-value">${data.killCount}</span>
          </div>
          <div class="result-stat">
            <span class="result-stat-label">레벨</span>
            <span class="result-stat-value">${data.level}</span>
          </div>
        </div>
        <button class="result-restart-btn" id="result-restart-btn">다시 시작</button>
      </div>
    `;

    this.el.style.display = 'flex';

    document.getElementById('result-restart-btn').addEventListener('click', () => {
      this.hide();
      onRestart();
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
    if (document.getElementById('result-styles')) return;
    const style = document.createElement('style');
    style.id = 'result-styles';
    style.textContent = `
      #result-overlay {
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        display: none;
        align-items: center;
        justify-content: center;
        background: rgba(0,0,0,0.75);
        backdrop-filter: blur(6px);
        z-index: 200;
      }
      .result-panel {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 32px;
      }
      .result-title {
        font-size: 48px;
        font-weight: 900;
        color: #ef5350;
        text-shadow: 0 0 30px rgba(239,83,80,0.6);
        letter-spacing: 6px;
      }
      .result-stats {
        display: flex;
        gap: 40px;
      }
      .result-stat {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
      }
      .result-stat-label {
        font-size: 12px;
        color: #888;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      .result-stat-value {
        font-size: 28px;
        font-weight: 700;
        color: #fff;
      }
      .result-restart-btn {
        padding: 12px 40px;
        font-size: 16px;
        font-weight: 700;
        color: #0d1117;
        background: #ffd54f;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: inherit;
      }
      .result-restart-btn:hover {
        background: #ffee58;
        transform: scale(1.05);
        box-shadow: 0 4px 15px rgba(255,213,79,0.4);
      }
    `;
    document.head.appendChild(style);
  }
}
