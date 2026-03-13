import { GameConfig } from './GameConfig.js';

/**
 * GameLoop — requestAnimationFrame 기반 메인 루프
 *
 * deltaTime을 계산하고 상한을 클램핑하여 콜백에 전달한다.
 */
export class GameLoop {
  /**
   * @param {function(number): void} updateFn — 매 프레임 호출될 함수 (dt: 초)
   */
  constructor(updateFn) {
    this._updateFn = updateFn;
    this._lastTime = 0;
    this._running = false;
    this._rafId = null;
    this._tick = this._tick.bind(this);
  }

  start() {
    if (this._running) return;
    this._running = true;
    this._lastTime = performance.now();
    this._rafId = requestAnimationFrame(this._tick);
  }

  stop() {
    this._running = false;
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  _tick(now) {
    if (!this._running) return;

    let dt = (now - this._lastTime) / 1000; // ms → 초
    this._lastTime = now;

    // deltaTime 상한 클램핑 (탭 전환 등 대응)
    if (dt > GameConfig.maxDeltaTime) {
      dt = GameConfig.maxDeltaTime;
    }

    this._updateFn(dt);

    this._rafId = requestAnimationFrame(this._tick);
  }
}
