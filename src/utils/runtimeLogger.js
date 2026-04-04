import { isRuntimeDebugScopeEnabled } from '../adapters/browser/runtimeFeatureFlags.js';

function formatRuntimeScope(scope, message) {
  return `[${scope}] ${message}`;
}

export function isRuntimeDebugEnabled(scope = '', host = globalThis) {
  return isRuntimeDebugScopeEnabled(scope, host);
}

export function logRuntimeInfo(scope, message, ...args) {
  if (!isRuntimeDebugEnabled(scope)) return;
  console.info(formatRuntimeScope(scope, message), ...args);
}

export function logRuntimeWarn(scope, message, ...args) {
  console.warn(formatRuntimeScope(scope, message), ...args);
}

export function logRuntimeError(scope, message, ...args) {
  console.error(formatRuntimeScope(scope, message), ...args);
}
