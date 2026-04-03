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
  constructor({
    keyBindings = null,
    host = globalThis.window ?? globalThis,
  } = {}) {
    this._keys = new Set();
    this._onKeyDown = null;
    this._onKeyUp   = null;
    this._onBlur    = null;
    this._keyBindings = normalizeKeyBindings(keyBindings ?? {});
    this._host = host;
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

    this._host?.addEventListener?.('keydown', this._onKeyDown);
    this._host?.addEventListener?.('keyup',   this._onKeyUp);
    this._host?.addEventListener?.('blur',    this._onBlur);
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
    if (this._onKeyDown) this._host?.removeEventListener?.('keydown', this._onKeyDown);
    if (this._onKeyUp)   this._host?.removeEventListener?.('keyup',   this._onKeyUp);
    if (this._onBlur)    this._host?.removeEventListener?.('blur',    this._onBlur);
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
