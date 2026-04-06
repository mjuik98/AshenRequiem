import { mountUI } from '../../ui/dom/mountUI.js';
import { buildPlayRuntime as buildPlayRuntimeBase } from '../../core/PlayRuntimeBuilder.js';
import { PlayUI } from './PlayUI.js';
import { shouldEnablePipelineProfiling } from './playSceneRuntime.js';

export function buildPlayRuntime({
  shouldEnableProfilingImpl = shouldEnablePipelineProfiling,
  mountUiImpl = mountUI,
  onOverlayLoadFailure = null,
  createPlayUiImpl = (container) => new PlayUI(container, { onOverlayLoadFailure }),
  ...options
} = {}) {
  return buildPlayRuntimeBase({
    ...options,
    shouldEnableProfilingImpl,
    mountUiImpl,
    createPlayUiImpl,
  });
}
