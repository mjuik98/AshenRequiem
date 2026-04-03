import {
  registerRuntimeHooks as registerRuntimeHooksImpl,
  unregisterRuntimeHooks as unregisterRuntimeHooksImpl,
} from './runtimeHooks/runtimeHostRegistration.js';

export function registerRuntimeHooks(game, options = {}) {
  return registerRuntimeHooksImpl(game, options);
}

export function unregisterRuntimeHooks() {
  return unregisterRuntimeHooksImpl();
}
