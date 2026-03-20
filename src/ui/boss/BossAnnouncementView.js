/**
 * src/ui/boss/BossAnnouncementView.js — 보스 등장 연출 DOM UI
 *
 * 보스 스폰 시 화면 중앙에 극적인 텍스트 연출을 표시한다.
 *
 * 사용법:
 *   const view = new BossAnnouncementView(container);
 *   view.show('THE LICH');   // 자동으로 3.2초 후 사라짐
 *   view.destroy();          // PlayScene.exit() 시 호출
 */
export class BossAnnouncementView {
  constructor(container) {
    this.el = document.createElement('div');
    this.el.className = 'boss-announce-root';
    this.el.style.display = 'none';
    this._injectStyles();
    container.appendChild(this.el);
    this._hideTimer = null;
  }

  /**
   * 보스 등장 연출을 표시한다.
   * @param {string} bossName  표시할 보스 이름
   */
  show(bossName) {
    // 이미 타이머가 있으면 초기화
    if (this._hideTimer !== null) {
      clearTimeout(this._hideTimer);
      this._hideTimer = null;
    }

    this.el.innerHTML = `
      <div class="ba-inner">
        <div class="ba-warning">⚠ WARNING ⚠</div>
        <div class="ba-name">${bossName}</div>
        <div class="ba-subtitle">강력한 적이 나타났다!</div>
      </div>
    `;
    this.el.style.display = 'flex';

    // 3.2초 후 자동 숨김
    this._hideTimer = setTimeout(() => {
      this._fadeOut();
      this._hideTimer = null;
    }, 3200);
  }

  _fadeOut() {
    this.el.classList.add('ba-fade-out');
    setTimeout(() => {
      this.el.style.display = 'none';
      this.el.classList.remove('ba-fade-out');
    }, 500);
  }

  destroy() {
    if (this._hideTimer !== null) clearTimeout(this._hideTimer);
    this.el.remove();
  }

  _injectStyles() {
    if (document.getElementById('boss-announce-styles')) return;
    const s = document.createElement('style');
    s.id = 'boss-announce-styles';
    s.textContent = `
      .boss-announce-root {
        position: absolute; inset: 0;
        display: flex; align-items: center; justify-content: center;
        pointer-events: none; z-index: 45;
      }

      .ba-inner {
        display: flex; flex-direction: column; align-items: center; gap: 8px;
        animation: ba-enter 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }

      .boss-announce-root.ba-fade-out .ba-inner {
        animation: ba-exit 0.5s ease-in forwards;
      }

      @keyframes ba-enter {
        from { opacity: 0; transform: scale(1.25) translateY(-12px); }
        to   { opacity: 1; transform: scale(1)    translateY(0); }
      }

      @keyframes ba-exit {
        from { opacity: 1; transform: scale(1); }
        to   { opacity: 0; transform: scale(0.88) translateY(8px); }
      }

      .ba-warning {
        font-size: clamp(13px, 2.5vw, 18px);
        font-family: 'Segoe UI', monospace, sans-serif;
        font-weight: 900;
        letter-spacing: 0.6em;
        color: #ff1744;
        text-shadow:
          0 0 12px rgba(255, 23, 68, 0.8),
          0 0 30px rgba(255, 23, 68, 0.4);
        animation: ba-warning-blink 0.55s ease-in-out infinite alternate;
      }

      @keyframes ba-warning-blink {
        from { opacity: 0.7; }
        to   { opacity: 1;   }
      }

      .ba-name {
        font-size: clamp(32px, 6vw, 64px);
        font-family: 'Segoe UI', 'Arial Black', sans-serif;
        font-weight: 900;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: #fff;
        text-shadow:
          0 0 20px rgba(255, 64, 129, 0.9),
          0 0 50px rgba(255, 64, 129, 0.5),
          0 4px 0 rgba(0, 0, 0, 0.8);
        /* 보스 이름 흔들림 효과 */
        animation: ba-name-shake 0.08s ease-in-out 3 0.3s;
      }

      @keyframes ba-name-shake {
        0%   { transform: translateX(0); }
        25%  { transform: translateX(-4px); }
        75%  { transform: translateX(4px); }
        100% { transform: translateX(0); }
      }

      .ba-subtitle {
        font-size: clamp(12px, 2vw, 15px);
        font-family: 'Segoe UI', sans-serif;
        color: rgba(255, 255, 255, 0.75);
        letter-spacing: 0.22em;
        text-transform: uppercase;
      }

      /* 배경 비네팅 효과 */
      .boss-announce-root::before {
        content: '';
        position: absolute; inset: 0;
        background: radial-gradient(
          ellipse 80% 40% at 50% 50%,
          rgba(255, 23, 68, 0.12) 0%,
          transparent 70%
        );
        pointer-events: none;
        animation: ba-vignette 3.2s ease-in-out forwards;
      }

      @keyframes ba-vignette {
        0%   { opacity: 0; }
        10%  { opacity: 1; }
        85%  { opacity: 1; }
        100% { opacity: 0; }
      }
    `;
    document.head.appendChild(s);
  }
}
