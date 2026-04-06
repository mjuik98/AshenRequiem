function formatRuntimeScope(scope, message) {
  return `[${scope}] ${message}`;
}

let runtimeDebugEnabledResolver = (_scope = '', _host = globalThis) => false;

export function setRuntimeDebugEnabledResolver(resolver = null) {
  runtimeDebugEnabledResolver = typeof resolver === 'function'
    ? resolver
    : (_scope = '', _host = globalThis) => false;
}

export function resetRuntimeDebugEnabledResolver() {
  runtimeDebugEnabledResolver = (_scope = '', _host = globalThis) => false;
}

export function isRuntimeDebugEnabled(scope = '', host = globalThis) {
  return Boolean(runtimeDebugEnabledResolver(scope, host));
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
