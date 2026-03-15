export class LevelUpView {
  constructor(container) {
    this.el = document.createElement('div');
    this.el.id = 'levelup-overlay';
    this.el.style.display = 'none';
    this._injectStyles();
    container.appendChild(this.el);
  }

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
            </button>`).join('')}
        </div>
      </div>`;
    this.el.style.display = 'flex';
    this.el.querySelectorAll('.levelup-card').forEach((card, i) => {
      card.addEventListener('click', () => { onSelect(choices[i]); this.hide(); });
    });
  }

  hide()    { this.el.style.display = 'none'; this.el.innerHTML = ''; }
  destroy() { this.el.remove(); }

  _injectStyles() {
    if (document.getElementById('levelup-styles')) return;
    const style = document.createElement('style');
    style.id = 'levelup-styles';
    style.textContent = `
      #levelup-overlay { position:absolute;top:0;left:0;right:0;bottom:0;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,0.65);backdrop-filter:blur(4px);z-index:100; }
      .levelup-panel { display:flex;flex-direction:column;align-items:center;gap:24px; }
      .levelup-title { font-size:36px;font-weight:800;color:#ffd54f;text-shadow:0 0 20px rgba(255,213,79,0.5);letter-spacing:4px;animation:levelupPulse 0.8s ease-in-out infinite alternate; }
      @keyframes levelupPulse { from{opacity:0.8;} to{opacity:1;text-shadow:0 0 30px rgba(255,213,79,0.8);} }
      .levelup-cards { display:flex;gap:16px;flex-wrap:wrap;justify-content:center; }
      .levelup-card { background:rgba(30,30,40,0.95);border:2px solid rgba(255,213,79,0.3);border-radius:12px;padding:20px 24px;width:180px;cursor:pointer;transition:all 0.15s;display:flex;flex-direction:column;align-items:center;gap:8px;color:#fff;font-family:'Segoe UI',sans-serif; }
      .levelup-card:hover { border-color:#ffd54f;transform:translateY(-4px);box-shadow:0 8px 24px rgba(255,213,79,0.25); }
      .levelup-card-icon { font-size:32px; }
      .levelup-card-name { font-size:14px;font-weight:700;color:#ffd54f;text-align:center; }
      .levelup-card-desc { font-size:11px;color:#aaa;text-align:center;line-height:1.4; }
    `;
    document.head.appendChild(style);
  }
}
