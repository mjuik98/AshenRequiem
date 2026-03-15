export class ResultView {
  constructor(container) {
    this.el = document.createElement('div');
    this.el.id = 'result-overlay';
    this.el.style.display = 'none';
    this._injectStyles();
    container.appendChild(this.el);
  }

  show({ killCount, survivalTime, level }, onRestart) {
    const totalSec = Math.floor(survivalTime);
    const min = String(Math.floor(totalSec / 60)).padStart(2,'0');
    const sec = String(totalSec % 60).padStart(2,'0');
    this.el.innerHTML = `
      <div class="result-panel">
        <h2 class="result-title">GAME OVER</h2>
        <div class="result-stats">
          <div class="result-stat"><span class="stat-label">생존 시간</span><span class="stat-value">${min}:${sec}</span></div>
          <div class="result-stat"><span class="stat-label">처치 수</span><span class="stat-value">${killCount}</span></div>
          <div class="result-stat"><span class="stat-label">도달 레벨</span><span class="stat-value">Lv ${level}</span></div>
        </div>
        <button class="result-restart-btn" id="result-restart">다시 시작</button>
      </div>`;
    this.el.style.display = 'flex';
    document.getElementById('result-restart').addEventListener('click', onRestart);
  }

  hide()    { this.el.style.display = 'none'; this.el.innerHTML = ''; }
  destroy() { this.el.remove(); }

  _injectStyles() {
    if (document.getElementById('result-styles')) return;
    const style = document.createElement('style');
    style.id = 'result-styles';
    style.textContent = `
      #result-overlay { position:absolute;top:0;left:0;right:0;bottom:0;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,0.8);backdrop-filter:blur(6px);z-index:150; }
      .result-panel { display:flex;flex-direction:column;align-items:center;gap:28px;padding:40px 48px;background:rgba(20,20,30,0.95);border:1px solid rgba(255,255,255,0.1);border-radius:16px; }
      .result-title { font-size:42px;font-weight:900;color:#ef5350;letter-spacing:6px;font-family:'Segoe UI',sans-serif; }
      .result-stats { display:flex;flex-direction:column;gap:12px;width:100%; }
      .result-stat { display:flex;justify-content:space-between;font-family:'Segoe UI',sans-serif;border-bottom:1px solid rgba(255,255,255,0.07);padding-bottom:8px; }
      .stat-label { color:#888;font-size:14px; }
      .stat-value { color:#fff;font-size:18px;font-weight:700; }
      .result-restart-btn { padding:14px 40px;background:#4fc3f7;color:#000;border:none;border-radius:8px;font-size:16px;font-weight:700;cursor:pointer;transition:all 0.15s;font-family:'Segoe UI',sans-serif; }
      .result-restart-btn:hover { background:#81d4fa;transform:scale(1.04); }
    `;
    document.head.appendChild(style);
  }
}
