/**
 * src/core/runtimeFeatureFlags.js
 *
 * Public compatibility wrapper.
 * Real browser runtime ownership lives in src/adapters/browser/runtimeFeatureFlags.js.
 */
export {
  isRuntimeDebugScopeEnabled,
  shouldEnablePipelineProfiling,
  shouldEnableRuntimeHooks,
  shouldForceTouchHud,
} from '../adapters/browser/runtimeFeatureFlags.js';
