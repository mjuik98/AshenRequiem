import { isRuntimeDebugScopeEnabled } from './runtimeFeatureFlags.js';
import {
  resetRuntimeDebugEnabledResolver,
  setRuntimeDebugEnabledResolver,
} from '../../utils/runtimeLogger.js';

export function configureBrowserRuntimeLoggerPolicy(host = globalThis) {
  setRuntimeDebugEnabledResolver((scope = '', targetHost = host) => (
    isRuntimeDebugScopeEnabled(scope, targetHost ?? host)
  ));

  return () => {
    resetRuntimeDebugEnabledResolver();
  };
}
