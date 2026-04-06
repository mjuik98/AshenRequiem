import {
  createTouchHudRuntime,
  syncTouchHudRuntime,
} from './touchHudRuntime.js';

const JOYSTICK_DEADZONE = 0.15;
const JOYSTICK_MAX_DIST = 60;

export class TouchAdapter {
  constructor(canvas) {
    this._canvas = canvas;

    this._joystickActive = false;
    this._joystickOriginX = 0;
    this._joystickOriginY = 0;
    this._joystickCurrentX = 0;
    this._joystickCurrentY = 0;
    this._joystickTouchId = null;

    this._normX = 0;
    this._normY = 0;
    this._pauseRequested = false;

    this._onTouchStart = null;
    this._onTouchMove = null;
    this._onTouchEnd = null;
    this._hudRoot = null;
    this._joystickBase = null;
    this._joystickKnob = null;
    this._moveGuide = null;
    this._actionGuide = null;
    this._pauseButton = null;
    this._onPauseTap = null;
    this._touchHud = null;
  }

  init() {
    this._onPauseTap = (event) => {
      event?.preventDefault?.();
      this._pauseRequested = true;
    };
    this._touchHud = createTouchHudRuntime(this._canvas, {
      onPauseTap: this._onPauseTap,
    });
    this._hudRoot = this._touchHud?.root ?? null;
    this._joystickBase = this._touchHud?.joystickBase ?? null;
    this._joystickKnob = this._touchHud?.joystickKnob ?? null;
    this._moveGuide = this._touchHud?.moveGuide ?? null;
    this._actionGuide = this._touchHud?.actionGuide ?? null;
    this._pauseButton = this._touchHud?.pauseButton ?? null;

    this._onTouchStart = (e) => {
      e.preventDefault();
      for (const touch of e.changedTouches) {
        const rect = this._canvas.getBoundingClientRect();
        const relX = touch.clientX - rect.left;
        if (relX < rect.width / 2 && this._joystickTouchId === null) {
          this._joystickTouchId = touch.identifier;
          this._joystickOriginX = touch.clientX;
          this._joystickOriginY = touch.clientY;
          this._joystickCurrentX = touch.clientX;
          this._joystickCurrentY = touch.clientY;
          this._joystickActive = true;
        }
      }
      this._updateNorm();
      this._syncTouchHud();
    };

    this._onTouchMove = (e) => {
      e.preventDefault();
      for (const touch of e.changedTouches) {
        if (touch.identifier === this._joystickTouchId) {
          this._joystickCurrentX = touch.clientX;
          this._joystickCurrentY = touch.clientY;
        }
      }
      this._updateNorm();
      this._syncTouchHud();
    };

    this._onTouchEnd = (e) => {
      for (const touch of e.changedTouches) {
        if (touch.identifier === this._joystickTouchId) {
          this._joystickTouchId = null;
          this._joystickActive = false;
          this._normX = 0;
          this._normY = 0;
        }
      }
      this._syncTouchHud();
    };

    this._canvas.addEventListener('touchstart', this._onTouchStart, { passive: false });
    this._canvas.addEventListener('touchmove', this._onTouchMove, { passive: false });
    this._canvas.addEventListener('touchend', this._onTouchEnd, { passive: false });
    this._canvas.addEventListener('touchcancel', this._onTouchEnd, { passive: false });
  }

  /**
   * @param {import('../../../input/InputState.js').InputState} state
   */
  poll(state) {
    if (this._joystickActive) {
      state.moveX = this._normX;
      state.moveY = this._normY;
    }
    if (this._pauseRequested) {
      state.actions.add('pause');
      this._pauseRequested = false;
    }
  }

  destroy() {
    if (this._onTouchStart) {
      this._canvas.removeEventListener('touchstart', this._onTouchStart);
      this._canvas.removeEventListener('touchmove', this._onTouchMove);
      this._canvas.removeEventListener('touchend', this._onTouchEnd);
      this._canvas.removeEventListener('touchcancel', this._onTouchEnd);
    }
    this._touchHud?.destroy?.();
  }

  _updateNorm() {
    if (!this._joystickActive) return;

    const dx = this._joystickCurrentX - this._joystickOriginX;
    const dy = this._joystickCurrentY - this._joystickOriginY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < JOYSTICK_DEADZONE * JOYSTICK_MAX_DIST) {
      this._normX = 0;
      this._normY = 0;
      return;
    }

    const clampedDist = Math.min(dist, JOYSTICK_MAX_DIST);
    const factor = clampedDist / JOYSTICK_MAX_DIST;
    this._normX = (dx / dist) * factor;
    this._normY = (dy / dist) * factor;
  }

  _syncTouchHud() {
    syncTouchHudRuntime(this._touchHud, {
      active: this._joystickActive,
      originX: this._joystickOriginX,
      originY: this._joystickOriginY,
      currentX: this._joystickCurrentX,
      currentY: this._joystickCurrentY,
      maxDistance: JOYSTICK_MAX_DIST,
    });
  }
}
