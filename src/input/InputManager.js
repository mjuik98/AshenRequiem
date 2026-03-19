/**
 * src/input/InputManager.js
 *
 * 어댑터 패턴 기반의 입력 관리자.
 * 키보드, 터치 등 다양한 입력 소스를 하나로 통합한다.
 */
import { InputState } from './InputState.js';

export class InputManager {
  constructor() {
    this._adapters = [];
    this._state    = new InputState();
  }

  /**
   * 입력 어댑터를 추가한다.
   * @param {{ init?: Function, poll: Function, destroy?: Function }} adapter
   */
  addAdapter(adapter) {
    if (adapter.init) adapter.init();
    this._adapters.push(adapter);
  }

  /**
   * 모든 어댑터로부터 현재 입력을 수집한다. (프레임 시작 시 호출)
   * @returns {InputState}
   */
  poll() {
    this._state.reset();
    for (const adapter of this._adapters) {
      // 나중 어댑터가 이전 어댑터의 값을 덮어쓸 수 있음 (우선순위)
      adapter.poll(this._state);
    }
    return this._state;
  }

  /** @returns {InputState} */
  getState() {
    return this._state;
  }

  /** 하위 호환: 현재 방향 벡터 반환 */
  getDirection() {
    return this._state.getDirection();
  }

  /** 하위 호환: 특정 키 눌림 여부 반환 */
  isDown(key) {
    return this._state.isDown(key);
  }

  destroy() {
    for (const adapter of this._adapters) {
      if (adapter.destroy) adapter.destroy();
    }
    this._adapters = [];
  }
}
