import { InputManager } from '../../input/InputManager.js';
import { GamepadAdapter } from '../../platform/browser/input/GamepadAdapter.js';
import { KeyboardAdapter } from '../../platform/browser/input/KeyboardAdapter.js';
import { TouchAdapter } from '../../platform/browser/input/TouchAdapter.js';
import { shouldForceTouchHud } from './runtimeFeatureFlags.js';

function shouldEnableTouchAdapter(host = globalThis, options = null) {
  return shouldForceTouchHud(host, options) || 'ontouchstart' in (host ?? {});
}

function shouldEnableGamepadAdapter(host = globalThis) {
  return typeof host?.navigator?.getGamepads === 'function';
}

export function createGameInput({
  canvas,
  host = globalThis,
  options = null,
  inputManagerCtor = InputManager,
  keyboardAdapterCtor = KeyboardAdapter,
  gamepadAdapterCtor = GamepadAdapter,
  touchAdapterCtor = TouchAdapter,
} = {}) {
  const input = new inputManagerCtor();
  input.addAdapter(new keyboardAdapterCtor({
    keyBindings: options?.keyBindings,
    host,
  }));
  if (shouldEnableGamepadAdapter(host)) {
    input.addAdapter(new gamepadAdapterCtor({ host }));
  }

  if (shouldEnableTouchAdapter(host, options)) {
    input.addAdapter(new touchAdapterCtor(canvas));
  }

  return input;
}
