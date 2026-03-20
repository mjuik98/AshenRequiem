/**
 * src/ui/WeaponEvolutionAnnounceView.js — 무기 진화 연출 DOM UI
 *
 * 무기 진화 성공 시 화면 하단에 팝업으로 표시한다.
 *
 * 사용법:
 *   const view = new WeaponEvolutionAnnounceView(container);
 *   view.show('Magic Bolt이 Arcane Nova로 진화했다!', 'Arcane Nova');
 *   view.destroy();
 */
export class WeaponEvolutionAnnounceView {
  constructor(container) {
    this.el = document.createElement('div');
    this.el.className = 'evo-announce-root';
    this.el.style.display = 'none';
    this._injectStyles();
    container.appendChild(this.el);
    this._hideTimer = null;
    this._queue     = [];
    this._showing   = false;
  }

  /**
   * @param {string} announceText  "Magic Bolt이 Arcane Nova로 진화했다!"
   * @param {string} weaponName    "Arcane Nova"
   */
  show(announceText, weaponName) {
    this._queue.push({ announceText, weaponName });
    if (!this._showing) this._showNext();
  }

  _showNext() {
    if (this._queue.length === 0) { this._showing = false; return; }
    this._showing = true;
    const { announceText, weaponName } = this._queue.shift();

    this.el.innerHTML = `
      <div class="evo-inner">
        <div class="evo-badge">✨ 무기 진화!</div>
        <div class="evo-name">${weaponName}</div>
        <div class="evo-text">${announceText}</div>
      </div>
    `;
    this.el.style.display = 'flex';

    if (this._hideTimer !== null) clearTimeout(this._hideTimer);
    this._hideTimer = setTimeout(() => {
      this.el.classList.add('evo-fade-out');
      setTimeout(() => {
        this.el.style.display = 'none';
        this.el.classList.remove('evo-fade-out');
        this._showNext();
      }, 500);
    }, 3000);
  }

  destroy() {
    if (this._hideTimer !== null) clearTimeout(this._hideTimer);
    this.el.remove();
  }

  _injectStyles() {
    if (document.getElementById('evo-announce-styles')) return;
    const s = document.createElement('style');
    s.id = 'evo-announce-styles';
    s.textContent = `
      .evo-announce-root {
        position: absolute;
        bottom: 80px; left: 50%;
        transform: translateX(-50%);
        display: flex; align-items: center; justify-content: center;
        pointer-events: none; z-index: 32;
        min-width: 280px;
      }

      .evo-inner {
        display: flex; flex-direction: column; align-items: center; gap: 4px;
        background: linear-gradient(135deg, rgba(18, 10, 30, 0.92), rgba(40, 10, 60, 0.88));
        border: 1px solid rgba(224, 64, 251, 0.5);
        border-radius: 14px;
        padding: 14px 28px;
        box-shadow:
          0 0 24px rgba(224, 64, 251, 0.35),
          0 8px 32px rgba(0, 0, 0, 0.6);
        animation: evo-slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        text-align: center;
      }

      .evo-announce-root.evo-fade-out .evo-inner {
        animation: evo-slide-down 0.5s ease-in forwards;
      }

      @keyframes evo-slide-up {
        from { opacity: 0; transform: translateY(20px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes evo-slide-down {
        from { opacity: 1; transform: translateY(0); }
        to   { opacity: 0; transform: translateY(-10px); }
      }

      .evo-badge {
        font-size: 11px;
        letter-spacing: 0.3em;
        text-transform: uppercase;
        color: #ce93d8;
        font-weight: 700;
      }

      .evo-name {
        font-size: 20px;
        font-weight: 900;
        color: #e040fb;
        letter-spacing: 0.1em;
        text-shadow: 0 0 16px rgba(224, 64, 251, 0.7);
      }

      .evo-text {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.72);
      }
    `;
    document.head.appendChild(s);
  }
}
