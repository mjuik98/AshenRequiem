import {
  createTitleBackgroundState,
  resizeTitleBackgroundState,
} from './titleBackgroundState.js';
import { drawTitleBackgroundFrame } from './titleBackgroundDraw.js';

export class TitleBackgroundRenderer {
  constructor(canvas, {
    host = globalThis.window ?? globalThis,
    rng = undefined,
    requestAnimationFrameImpl = host?.requestAnimationFrame?.bind?.(host) ?? null,
    cancelAnimationFrameImpl = host?.cancelAnimationFrame?.bind?.(host) ?? null,
  } = {}) {
    this._host = host;
    this._canvas = canvas;
    this._ctx = canvas?.getContext?.('2d') ?? null;
    this._frameId = 0;
    this._state = null;
    this._rng = rng;
    this._requestAnimationFrame = requestAnimationFrameImpl;
    this._cancelAnimationFrame = cancelAnimationFrameImpl;
  }

  start() {
    if (!this._canvas || !this._ctx) return;

    this._state = createTitleBackgroundState(this._host, this._rng);
    this.resize();

    if (this._state.prefersReducedMotion) {
      this._draw(0, 0);
      return;
    }

    const tick = (ts) => {
      if (!this._ctx || !this._state) return;
      const time = ts * 0.001;
      const delta = Math.min(0.033, time - (this._state.lastTime || time));
      this._state.lastTime = time;
      this._state.smoothedX += (this._state.pointerX - this._state.smoothedX) * 0.04;
      this._state.smoothedY += (this._state.pointerY - this._state.smoothedY) * 0.04;
      this._draw(time, delta);
      this._frameId = this._requestAnimationFrame?.(tick) ?? 0;
    };

    this._frameId = this._requestAnimationFrame?.(tick) ?? 0;
  }

  setPointer(x, y) {
    if (!this._state) return;
    this._state.pointerX = x;
    this._state.pointerY = y;
  }

  resize() {
    const state = this._state;
    if (!state || !this._canvas || !this._ctx) return;

    resizeTitleBackgroundState(state, this._canvas, this._ctx, this._host);
    this._draw(0, 0);
  }

  destroy() {
    if (this._frameId) {
      this._cancelAnimationFrame?.(this._frameId);
      this._frameId = 0;
    }
    this._state = null;
    this._ctx = null;
    this._canvas = null;
  }

  _draw(time, delta) {
    drawTitleBackgroundFrame(this._ctx, this._state, time, delta);
  }
}
