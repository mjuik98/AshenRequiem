/**
 * src/input/InputState.js
 *
 * 입력 상태(Raw Data)를 보유하고 가공된 정보(방향 벡터 등)를 제공한다.
 */
export class InputState {
  constructor() {
    this.moveX = 0;   // -1 ~ 1
    this.moveY = 0;   // -1 ~ 1
    this.actions = new Set(); // R-22: actions Set 기반으로 전환
  }

  /**
   * 상/하/좌/우 상태를 키 이름으로 확인 (하위 호환용)
   * @param {string} key
   * @returns {boolean}
   */
  isDown(key) {
    const k = key.toLowerCase();
    if (k === 'a' || k === 'arrowleft')  return this.moveX < -0.1;
    if (k === 'd' || k === 'arrowright') return this.moveX > 0.1;
    if (k === 'w' || k === 'arrowup')    return this.moveY < -0.1;
    if (k === 's' || k === 'arrowdown')  return this.moveY > 0.1;
    return false;
  }

  /**
   * 특정 액션이 활성화되어 있는지 확인한다. (R-22 API)
   * @param {string} action
   * @returns {boolean}
   */
  isAction(action) {
    return this.actions.has(action);
  }

  /**
   * 정규화된 방향 벡터를 반환한다. (크기 1)
   * @returns {{x: number, y: number}}
   */
  getDirection() {
    const dx  = this.moveX;
    const dy  = this.moveY;
    const len = Math.sqrt(dx * dx + dy * dy);

    if (len < 0.001) {
      return { x: 0, y: 0 };
    }

    return { x: dx / len, y: dy / len };
  }

  reset() {
    this.moveX = 0;
    this.moveY = 0;
    this.actions.clear();
  }
}
