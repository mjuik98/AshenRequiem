const RUNTIME_DEBUG_FLAG = '__ASHEN_RUNTIME_DEBUG__';

function formatRuntimeScope(scope, message) {
  return `[${scope}] ${message}`;
}

export function isRuntimeDebugEnabled(scope = '') {
  const flag = globalThis?.[RUNTIME_DEBUG_FLAG];
  if (flag === true) return true;
  if (typeof flag === 'string') return flag === scope;
  if (Array.isArray(flag)) return flag.includes(scope);
  if (flag instanceof Set) return flag.has(scope);
  return false;
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
