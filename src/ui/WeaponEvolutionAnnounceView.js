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
import { buildWeaponEvolutionAnnounceMarkup } from './weapon-evolution/weaponEvolutionAnnounceMarkup.js';
import { ensureWeaponEvolutionAnnounceStyles } from './weapon-evolution/weaponEvolutionAnnounceStyles.js';

export class WeaponEvolutionAnnounceView {
  constructor(container) {
    this.el = document.createElement('div');
    this.el.className = 'evo-announce-root';
    this.el.style.display = 'none';
    ensureWeaponEvolutionAnnounceStyles();
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

    this.el.innerHTML = buildWeaponEvolutionAnnounceMarkup(announceText, weaponName);
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
}
