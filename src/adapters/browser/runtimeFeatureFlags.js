const PIPELINE_PROFILE_FLAG = '__ASHEN_PROFILE_PIPELINE__';
const RUNTIME_DEBUG_FLAG = '__ASHEN_RUNTIME_DEBUG__';
const DEBUG_RUNTIME_FLAG = '__ASHEN_DEBUG_RUNTIME__';

function hasRuntimeQueryFlag(flagName, host = globalThis) {
  const search = host?.location?.search ?? '';
  if (!flagName || !search) return false;
  return new URLSearchParams(search).has(flagName);
}

export function shouldEnablePipelineProfiling(host = globalThis) {
  if (!host) return false;
  if (host[PIPELINE_PROFILE_FLAG] === true) return true;
  return hasRuntimeQueryFlag('profilePipeline', host);
}

export function shouldForceTouchHud(host = globalThis, options = null) {
  if (options?.forceTouchHud === true) return true;
  return hasRuntimeQueryFlag('forceTouchHud', host);
}

export function isRuntimeDebugScopeEnabled(scope = '', host = globalThis) {
  const flag = host?.[RUNTIME_DEBUG_FLAG];
  if (flag === true) return true;
  if (typeof flag === 'string') return flag === scope;
  if (Array.isArray(flag)) return flag.includes(scope);
  if (flag instanceof Set) return flag.has(scope);
  return false;
}

export function shouldEnableRuntimeHooks(options = {}, host = globalThis) {
  if (options.enabled === true) return true;
  if (options.enabled === false) return false;
  if (!host) return false;
  if (host[DEBUG_RUNTIME_FLAG] === true) return true;
  return hasRuntimeQueryFlag('debugRuntime', host);
}
