const AXIS_DEADZONE = 0.2;
const BUTTON_CONFIRM = 1;
const BUTTON_PAUSE = 7;
const BUTTON_DEBUG = 8;

function readGamepads(host = globalThis) {
  return host?.navigator?.getGamepads?.() ?? [];
}

function normalizeAxis(value = 0) {
  const axis = Number.isFinite(value) ? value : 0;
  return Math.abs(axis) >= AXIS_DEADZONE ? axis : 0;
}

function isPressed(button) {
  return button?.pressed === true || button?.value > 0.5;
}

export class GamepadAdapter {
  constructor({ host = globalThis } = {}) {
    this._host = host;
  }

  init() {}

  /**
   * @param {import('./InputState.js').InputState} state
   */
  poll(state) {
    const gamepad = [...readGamepads(this._host)].find((pad) => pad?.connected);
    if (!gamepad) return;

    const moveX = normalizeAxis(gamepad.axes?.[0]);
    const moveY = normalizeAxis(gamepad.axes?.[1]);
    if (moveX !== 0) state.moveX = moveX;
    if (moveY !== 0) state.moveY = moveY;

    if (isPressed(gamepad.buttons?.[BUTTON_CONFIRM])) {
      state.actions.add('confirm');
    }
    if (isPressed(gamepad.buttons?.[BUTTON_PAUSE])) {
      state.actions.add('pause');
    }
    if (isPressed(gamepad.buttons?.[BUTTON_DEBUG])) {
      state.actions.add('debug');
    }
  }

  destroy() {}
}
