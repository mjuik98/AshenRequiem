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
import { buildBossAnnouncementMarkup } from './bossAnnouncementMarkup.js';
import { ensureBossAnnouncementStyles } from './bossAnnouncementStyles.js';

export class BossAnnouncementView {
  constructor(container) {
    this.el = document.createElement('div');
    this.el.className = 'boss-announce-root';
    this.el.style.display = 'none';
    ensureBossAnnouncementStyles();
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

    this.el.innerHTML = buildBossAnnouncementMarkup(bossName);
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
}
