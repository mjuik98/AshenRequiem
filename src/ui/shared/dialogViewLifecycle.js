import { bindDialogRuntime } from './dialogRuntime.js';

export function replaceDialogRuntime(
  currentRuntime = null,
  options = {},
  {
    bindRuntime = bindDialogRuntime,
  } = {},
) {
  currentRuntime?.dispose?.({ restoreFocus: false });
  return bindRuntime(options);
}

export function disposeDialogRuntime(
  currentRuntime = null,
  {
    restoreFocus = true,
  } = {},
) {
  currentRuntime?.dispose?.({ restoreFocus });
  return null;
}
