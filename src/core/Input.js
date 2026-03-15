/**
 * Input — 키보드 입력 수집
 */
export class Input {
  constructor() {
    this._keysDown = new Set();
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp   = this._onKeyUp.bind(this);
  }

  init() {
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup',   this._onKeyUp);
  }

  destroy() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup',   this._onKeyUp);
  }

  getDirection() {
    let x = 0, y = 0;
    if (this._keysDown.has('KeyW') || this._keysDown.has('ArrowUp'))    y -= 1;
    if (this._keysDown.has('KeyS') || this._keysDown.has('ArrowDown'))  y += 1;
    if (this._keysDown.has('KeyA') || this._keysDown.has('ArrowLeft'))  x -= 1;
    if (this._keysDown.has('KeyD') || this._keysDown.has('ArrowRight')) x += 1;
    const len = Math.sqrt(x * x + y * y);
    if (len > 0) { x /= len; y /= len; }
    return { x, y };
  }

  isKeyDown(code) { return this._keysDown.has(code); }

  _onKeyDown(e) {
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
      e.preventDefault();
    }
    this._keysDown.add(e.code);
  }

  _onKeyUp(e) { this._keysDown.delete(e.code); }
}
