/**
 * ResultView — 게임 오버 결과 화면
 *
 * CHANGE: 메인 화면 버튼 + 획득 재화 표시 추가
 * show(stats, onRestartCallback, onTitleCallback?)
 */
export class ResultView {
  constructor(container) {
    this.el = document.createElement('div');
    this.el.className = 'result-overlay';
    this.el.style.display = 'none';
    this._injectStyles();
    container.appendChild(this.el);
  }

  /**
   * @param {object}        stats
   * @param {number}        stats.survivalTime
   * @param {number}        stats.level
   * @param {number}        stats.killCount
   * @param {number}        [stats.currencyEarned]   이번 런 획득 재화
   * @param {number}        [stats.totalCurrency]    누적 재화
   * @param {Function}      onRestartCallback
   * @param {Function|null} onTitleCallback          없으면 버튼 미표시
   */
  show(stats, onRestartCallback, onTitleCallback = null) {
    const mm = Math.floor(stats.survivalTime / 60);
    const ss = String(Math.floor(stats.survivalTime % 60)).padStart(2, '0');
    const isVictory = stats.outcome === 'victory';
    const titleText  = isVictory ? 'VICTORY' : 'GAME OVER';
    const subtitle   = isVictory ? 'The night is broken.' : 'The hunt ends here.';

    const currencyRow = (stats.currencyEarned != null)
      ? `<div class="result-row"><span>획득 재화</span><span>💰 ${stats.currencyEarned}</span></div>`
      : '';

    const totalRow = (stats.totalCurrency != null)
      ? `<div class="result-row dim"><span>누적 재화</span><span>💰 ${stats.totalCurrency}</span></div>`
      : '';

    const titleBtn = onTitleCallback
      ? `<button class="result-title-btn">⌂ 메인 화면으로</button>`
      : '';

    this.el.innerHTML = `
      <div class="result-box ${isVictory ? 'victory' : 'defeat'}">
        <div class="result-title ${isVictory ? 'victory' : 'defeat'}">${isVictory ? '☑' : '☠'} ${titleText}</div>
        <div class="result-subtitle">${subtitle}</div>
        <div class="result-stats">
          <div class="result-row"><span>생존 시간</span><span>${mm}:${ss}</span></div>
          <div class="result-row"><span>최종 레벨</span><span>Lv.${stats.level}</span></div>
          <div class="result-row"><span>총 킬 수</span><span>${stats.killCount}</span></div>
          ${currencyRow}
          ${totalRow}
        </div>
        <div class="result-btns">
          ${titleBtn}
          <button class="result-restart-btn">다시 시작</button>
        </div>
      </div>
    `;

    this.el.querySelector('.result-restart-btn')
      .addEventListener('click', () => {
        this.el.style.display = 'none';
        this.el.innerHTML = '';
        onRestartCallback();
      });

    if (onTitleCallback) {
      this.el.querySelector('.result-title-btn')
        .addEventListener('click', () => {
          this.el.style.display = 'none';
          this.el.innerHTML = '';
          onTitleCallback();
        });
    }

    this.el.style.display = 'flex';
  }

  destroy() { this.el.remove(); }

  _injectStyles() {
    if (document.getElementById('result-styles')) return;
    const s = document.createElement('style');
    s.id = 'result-styles';
    s.textContent = `
      .result-overlay {
        position: absolute; inset: 0;
        background: rgba(0,0,0,0.8);
        display: flex; align-items: center; justify-content: center;
        z-index: 40;
      }
      .result-box {
        background: linear-gradient(160deg, #1a2030, #0d1117);
        border: 1px solid rgba(255,255,255,0.15);
        border-radius: 16px; padding: 40px 48px;
        text-align: center; min-width: 300px;
        box-shadow: 0 8px 40px rgba(0,0,0,0.6);
        animation: result-appear 0.4s cubic-bezier(0.34,1.56,0.64,1);
      }
      .result-box.victory {
        background: linear-gradient(160deg, #13231c, #08110d);
      }
      .result-box.defeat {
        background: linear-gradient(160deg, #1a2030, #0d1117);
      }
      @keyframes result-appear {
        from { transform: scale(0.8); opacity: 0; }
        to   { transform: scale(1);   opacity: 1; }
      }
      .result-title {
        font-size: 28px; font-weight: 800; color: #ef5350;
        letter-spacing: 3px; margin-bottom: 24px;
        text-shadow: 0 0 20px rgba(239,83,80,0.5);
      }
      .result-title.victory {
        color: #a5d6a7;
        text-shadow: 0 0 20px rgba(165,214,167,0.5);
      }
      .result-subtitle {
        margin-top: -12px;
        margin-bottom: 22px;
        font-size: 13px;
        color: rgba(255,255,255,0.72);
        letter-spacing: 0.6px;
      }
      .result-stats {
        display: flex; flex-direction: column; gap: 10px; margin-bottom: 28px;
      }
      .result-row {
        display: flex; justify-content: space-between;
        font-size: 14px; color: #ccc; gap: 32px;
      }
      .result-row.dim { opacity: 0.6; font-size: 12px; }
      .result-row span:last-child { color: #fff; font-weight: 600; }
      .result-btns {
        display: flex; flex-direction: column; gap: 10px;
      }
      .result-title-btn {
        padding: 11px 40px; border: none; border-radius: 8px;
        background: linear-gradient(90deg, #90a4ae, #607d8b);
        color: #f5f7f9; font-size: 15px; font-weight: 700;
        cursor: pointer; letter-spacing: 1px;
        transition: transform 0.15s, box-shadow 0.15s;
        box-shadow: 0 4px 16px rgba(96,125,139,0.28);
      }
      .result-box.victory .result-title-btn {
        background: linear-gradient(90deg, #78909c, #546e7a);
        box-shadow: 0 4px 16px rgba(84,110,122,0.3);
      }
      .result-title-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 22px rgba(96,125,139,0.45);
      }
      .result-restart-btn {
        padding: 12px 40px; border: none; border-radius: 8px;
        background: linear-gradient(90deg, #ef5350, #ff7043);
        color: #fff; font-size: 15px; font-weight: 700;
        cursor: pointer; letter-spacing: 1px;
        transition: transform 0.15s, box-shadow 0.15s;
        box-shadow: 0 4px 16px rgba(239,83,80,0.3);
      }
      .result-box.victory .result-restart-btn {
        background: linear-gradient(90deg, #66bb6a, #43a047);
        box-shadow: 0 4px 16px rgba(102,187,106,0.3);
      }
      .result-restart-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 22px rgba(239,83,80,0.5);
      }
    `;
    document.head.appendChild(s);
  }
}
