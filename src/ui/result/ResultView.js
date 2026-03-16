/**
 * ResultView — 게임 오버 결과 화면
 * 규칙: 재시작 콜백을 Scene 에 전달만 함
 */
export class ResultView {
  constructor(container) {
    this.el = document.createElement('div');
    this.el.className = 'result-overlay';
    this.el.style.display = 'none';
    this._injectStyles();
    container.appendChild(this.el);
  }

  show(stats, onRestartCallback) {
    const mm = Math.floor(stats.survivalTime / 60);
    const ss = String(Math.floor(stats.survivalTime % 60)).padStart(2, '0');
    this.el.innerHTML = `
      <div class="result-box">
        <div class="result-title">☠ GAME OVER</div>
        <div class="result-stats">
          <div class="result-row"><span>생존 시간</span><span>${mm}:${ss}</span></div>
          <div class="result-row"><span>최종 레벨</span><span>Lv.${stats.level}</span></div>
          <div class="result-row"><span>총 킬 수</span><span>${stats.killCount}</span></div>
        </div>
        <button class="result-restart-btn">다시 시작</button>
      </div>
    `;
    this.el.querySelector('.result-restart-btn')
      .addEventListener('click', () => {
        this.el.style.display = 'none';
        this.el.innerHTML = '';
        onRestartCallback();
      });
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
      @keyframes result-appear {
        from { transform: scale(0.8); opacity: 0; }
        to   { transform: scale(1);   opacity: 1; }
      }
      .result-title {
        font-size: 28px; font-weight: 800; color: #ef5350;
        letter-spacing: 3px; margin-bottom: 24px;
        text-shadow: 0 0 20px rgba(239,83,80,0.5);
      }
      .result-stats {
        display: flex; flex-direction: column; gap: 10px; margin-bottom: 28px;
      }
      .result-row {
        display: flex; justify-content: space-between;
        font-size: 14px; color: #ccc; gap: 32px;
      }
      .result-row span:last-child { color: #fff; font-weight: 600; }
      .result-restart-btn {
        padding: 12px 40px; border: none; border-radius: 8px;
        background: linear-gradient(90deg, #ef5350, #ff7043);
        color: #fff; font-size: 15px; font-weight: 700;
        cursor: pointer; letter-spacing: 1px;
        transition: transform 0.15s, box-shadow 0.15s;
        box-shadow: 0 4px 16px rgba(239,83,80,0.3);
      }
      .result-restart-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 22px rgba(239,83,80,0.5);
      }
    `;
    document.head.appendChild(s);
  }
}
