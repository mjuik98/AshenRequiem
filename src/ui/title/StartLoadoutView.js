import { bindStartLoadoutInteractions } from './startLoadoutInteractions.js';
import { renderStartLoadoutMarkup } from './startLoadoutMarkup.js';
import { ensureStartLoadoutStyles } from './startLoadoutStyles.js';

export class StartLoadoutView {
  constructor(container) {
    this._container = container;
    this._el = document.createElement('div');
    this._el.className = 'sl-root';
    this._el.style.display = 'none';
    this._selectedWeaponId = null;
    this._canStart = false;
    this._weapons = [];
    this._onStart = null;
    this._onCancel = null;
    this._windowRef = globalThis.window;
    this._onKeyDown = (event) => {
      if (this._el.style.display === 'none') return;
      if (event?.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return;
      if (event?.key !== 'Escape' && event?.code !== 'Escape') return;
      event?.preventDefault?.();
      this.hide();
      this._onCancel?.();
    };
    ensureStartLoadoutStyles();
    container.appendChild(this._el);
  }

  show({ weapons = [], selectedWeaponId = null, canStart = false, onStart, onCancel }) {
    this._weapons = weapons;
    this._selectedWeaponId = weapons.some((weapon) => weapon?.id === selectedWeaponId)
      ? selectedWeaponId
      : weapons[0]?.id ?? null;
    this._canStart = Boolean(canStart && this._selectedWeaponId);
    this._onStart = onStart;
    this._onCancel = onCancel;
    this._windowRef?.removeEventListener('keydown', this._onKeyDown);
    this._windowRef?.addEventListener('keydown', this._onKeyDown);
    this._render();
    this._el.style.display = 'flex';
  }

  hide() {
    this._windowRef?.removeEventListener('keydown', this._onKeyDown);
    this._el.style.display = 'none';
    this._el.innerHTML = '';
  }

  destroy() {
    this._windowRef?.removeEventListener('keydown', this._onKeyDown);
    this._el.remove();
  }

  _render() {
    this._el.innerHTML = renderStartLoadoutMarkup({
      weapons: this._weapons,
      selectedWeaponId: this._selectedWeaponId,
      canStart: this._canStart,
    });

    bindStartLoadoutInteractions(this._el, {
      canStart: this._canStart,
      getSelectedWeaponId: () => this._selectedWeaponId,
      onSelectWeapon: (weaponId) => {
        this._selectedWeaponId = weaponId;
        this._render();
      },
      onCancel: () => {
        this.hide();
        this._onCancel?.();
      },
      onStart: (selectedWeaponId) => {
        this.hide();
        this._onStart?.(selectedWeaponId);
      },
    });
  }
}
