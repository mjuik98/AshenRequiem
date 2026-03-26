import { InputManager } from '../input/InputManager.js';
import { KeyboardAdapter } from '../input/KeyboardAdapter.js';
import { TouchAdapter } from '../input/TouchAdapter.js';

export function createGameInput({
  canvas,
  host = globalThis,
  inputManagerCtor = InputManager,
  keyboardAdapterCtor = KeyboardAdapter,
  touchAdapterCtor = TouchAdapter,
} = {}) {
  const input = new inputManagerCtor();
  input.addAdapter(new keyboardAdapterCtor());

  if ('ontouchstart' in (host ?? {})) {
    input.addAdapter(new touchAdapterCtor(canvas));
  }

  return input;
}
