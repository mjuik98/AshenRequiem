/**
 * src/input/KeyboardAdapter.js
 *
 * 키보드 입력을 감지하는 어댑터.
 */
import {
  matchesActionBinding,
  normalizeKeyBindings,
} from './keyBindings.js';

const PREVENT_KEYS = new Set([
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ',
]);

export class KeyboardAdapter {
  constructor({ keyBindings = null } = {}) {
    this._keys = new Set();
    this._onKeyDown = null;
    this._onKeyUp   = null;
    this._onBlur    = null;
    this._keyBindings = normalizeKeyBindings(keyBindings ?? {});
  }

  init() {
    this._onKeyDown = (e) => {
      if (PREVENT_KEYS.has(e.key)) e.preventDefault();
      this._keys.add(e.key.toLowerCase());
    };
    this._onKeyUp = (e) => {
      this._keys.delete(e.key.toLowerCase());
    };
    this._onBlur = () => this._keys.clear();

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup',   this._onKeyUp);
    window.addEventListener('blur',    this._onBlur);
  }

  /**
   * @param {import('./InputState.js').InputState} state
   */
  poll(state) {
    if (this._isActionDown('moveLeft')) state.moveX -= 1;
    if (this._isActionDown('moveRight')) state.moveX += 1;
    if (this._isActionDown('moveUp')) state.moveY -= 1;
    if (this._isActionDown('moveDown')) state.moveY += 1;

    // -1 ~ 1 사이로 클램프 (중복 입력 대비)
    state.moveX = Math.max(-1, Math.min(1, state.moveX));
    state.moveY = Math.max(-1, Math.min(1, state.moveY));

    if (this._isActionDown('pause')) {
      state.actions.add('pause');
    }
    if (this._isActionDown('confirm')) state.actions.add('confirm');
    if (this._isActionDown('debug')) state.actions.add('debug');
  }

  destroy() {
    if (this._onKeyDown) window.removeEventListener('keydown', this._onKeyDown);
    if (this._onKeyUp)   window.removeEventListener('keyup',   this._onKeyUp);
    if (this._onBlur)    window.removeEventListener('blur',    this._onBlur);
    this._keys.clear();
  }

  _isDown(key) {
    return this._keys.has(key.toLowerCase());
  }

  _isActionDown(action) {
    for (const key of this._keys) {
      if (matchesActionBinding(action, key, this._keyBindings)) {
        return true;
      }
    }
    return false;
  }

  updateKeyBindings(keyBindings = {}) {
    this._keyBindings = normalizeKeyBindings(keyBindings);
  }
}
