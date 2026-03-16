/**
 * Input — 키보드 입력 수집
 * FIX(web): 화살표 키 / 스페이스바 등 브라우저 기본 동작 충돌 방지
 */
const PREVENT_KEYS = new Set([
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ',
]);

export class Input {
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
    // FIX(web): 포커스 잃으면 키 상태 초기화
    this._onBlur = () => this._keys.clear();

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup',   this._onKeyUp);
    window.addEventListener('blur',    this._onBlur);
  }

  /** FIX(memory): 이벤트 리스너 정리 */
  destroy() {
    if (this._onKeyDown) window.removeEventListener('keydown', this._onKeyDown);
    if (this._onKeyUp)   window.removeEventListener('keyup',   this._onKeyUp);
    if (this._onBlur)    window.removeEventListener('blur',    this._onBlur);
    this._keys.clear();
  }

  isDown(key) {
    return this._keys.has(key.toLowerCase());
  }

  /**
   * WASD + 화살표 키 → 정규화된 방향 벡터
   * @returns {{ x: number, y: number }}
   */
  getDirection() {
    let x = 0, y = 0;
    if (this.isDown('arrowleft')  || this.isDown('a')) x -= 1;
    if (this.isDown('arrowright') || this.isDown('d')) x += 1;
    if (this.isDown('arrowup')    || this.isDown('w')) y -= 1;
    if (this.isDown('arrowdown')  || this.isDown('s')) y += 1;
    if (x !== 0 && y !== 0) {
      const inv = 1 / Math.sqrt(2);
      x *= inv; y *= inv;
    }
    return { x, y };
  }
}
