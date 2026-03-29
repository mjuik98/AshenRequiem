import { InputManager } from '../input/InputManager.js';
import { KeyboardAdapter } from '../input/KeyboardAdapter.js';
import { TouchAdapter } from '../input/TouchAdapter.js';

function shouldEnableTouchAdapter(host = globalThis, options = null) {
  if (options?.forceTouchHud === true) return true;
  const search = host?.location?.search ?? '';
  if (search && new URLSearchParams(search).has('forceTouchHud')) {
    return true;
  }
  return 'ontouchstart' in (host ?? {});
}

export function createGameInput({
  canvas,
  host = globalThis,
  options = null,
  inputManagerCtor = InputManager,
  keyboardAdapterCtor = KeyboardAdapter,
  touchAdapterCtor = TouchAdapter,
} = {}) {
  const input = new inputManagerCtor();
  input.addAdapter(new keyboardAdapterCtor({
    keyBindings: options?.keyBindings,
  }));

  if (shouldEnableTouchAdapter(host, options)) {
    input.addAdapter(new touchAdapterCtor(canvas));
  }

  return input;
}
