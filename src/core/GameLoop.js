import { GameConfig } from './GameConfig.js';

function defaultGetNowMs(host = globalThis) {
  return host?.performance?.now?.() ?? Date.now();
}

/** GameLoop — requestAnimationFrame 기반 게임 루프 */
export class GameLoop {
  constructor(tickFn, { getNowMs = defaultGetNowMs } = {}) {
    this._tickFn   = tickFn;
    this._lastTime = null;
    this._rafId    = null;
    this._bound    = this._frame.bind(this);
    this._getNowMs = getNowMs;
  }

  start() {
    this._lastTime = this._getNowMs();
    this._rafId    = requestAnimationFrame(this._bound);
  }

  stop() {
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  _frame(now) {
    const raw = (now - this._lastTime) / 1000;
    const dt  = Math.min(raw, GameConfig.maxDeltaTime);
    this._lastTime = now;
    this._tickFn(dt);
    this._rafId = requestAnimationFrame(this._bound);
  }
}
