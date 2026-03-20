/**
 * src/input/KeyboardAdapter.js
 *
 * 키보드 입력을 감지하는 어댑터.
 * CHANGE: ESC 키 → 'pause' 액션 추가
 */
const PREVENT_KEYS = new Set([
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ',
]);

export class KeyboardAdapter {
  constructor() {
    this._keys = new Set();
    this._onKeyDown = null;
    this._onKeyUp   = null;
    this._onBlur    = null;
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
    if (this._isDown('arrowleft')  || this._isDown('a')) state.moveX -= 1;
    if (this._isDown('arrowright') || this._isDown('d')) state.moveX += 1;
    if (this._isDown('arrowup')    || this._isDown('w')) state.moveY -= 1;
    if (this._isDown('arrowdown')  || this._isDown('s')) state.moveY += 1;

    // -1 ~ 1 사이로 클램프 (중복 입력 대비)
    state.moveX = Math.max(-1, Math.min(1, state.moveX));
    state.moveY = Math.max(-1, Math.min(1, state.moveY));

    if (this._isDown('`')) {
      state.actions.add('debug');
    }

    // CHANGE: ESC 키 → 'pause' 액션
    if (this._isDown('escape')) {
      state.actions.add('pause');
    }
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
}
