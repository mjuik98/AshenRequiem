import { updateSessionOptionsAndSave } from '../../state/sessionFacade.js';
import { applySessionOptionsToRuntime } from '../../state/sessionOptions.js';

export function saveSettingsAndApplyRuntime({
  session,
  nextOptions,
  renderer = null,
  resizeCanvas = null,
} = {}) {
  const resolvedOptions = updateSessionOptionsAndSave(session, nextOptions);

  if (typeof resizeCanvas === 'function') {
    resizeCanvas();
  }

  applySessionOptionsToRuntime(resolvedOptions, { renderer });
  return resolvedOptions;
}
