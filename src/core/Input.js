/**
 * Input — 키보드 입력 수집
 *
 * 읽기: 키보드 이벤트
 * 출력: 방향 벡터 { x, y } (정규화됨)
 */
export class Input {
  constructor() {
    /** @type {Set<string>} */
    this._keysDown = new Set();
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
  }

  init() {
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }

  destroy() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
  }

  /** 현재 이동 방향을 정규화된 벡터로 반환 */
  getDirection() {
    let x = 0;
    let y = 0;

    if (this._keysDown.has('KeyW') || this._keysDown.has('ArrowUp')) y -= 1;
    if (this._keysDown.has('KeyS') || this._keysDown.has('ArrowDown')) y += 1;
    if (this._keysDown.has('KeyA') || this._keysDown.has('ArrowLeft')) x -= 1;
    if (this._keysDown.has('KeyD') || this._keysDown.has('ArrowRight')) x += 1;

    // 대각선 이동 시 정규화
    const len = Math.sqrt(x * x + y * y);
    if (len > 0) {
      x /= len;
      y /= len;
    }

    return { x, y };
  }

  /** 특정 키가 눌려 있는지 확인 */
  isKeyDown(code) {
    return this._keysDown.has(code);
  }

  _onKeyDown(e) {
    // 브라우저 기본 동작 방지 (화살표키 스크롤 등)
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
    this._keysDown.add(e.code);
  }

  _onKeyUp(e) {
    this._keysDown.delete(e.code);
  }
}
