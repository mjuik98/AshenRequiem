export function isDebugSmokeEnabled({
  env = process.env,
  argv = process.argv,
} = {}) {
  return env.ASHEN_SMOKE_DEBUG === '1' || argv.includes('--debug-smoke');
}

export function getActiveHandleSummary({
  processRef = process,
} = {}) {
  const handles = typeof processRef._getActiveHandles === 'function'
    ? processRef._getActiveHandles()
    : [];
  return handles.map((handle) => handle?.constructor?.name ?? typeof handle);
}

export function createSmokeLogger({
  enabled = isDebugSmokeEnabled(),
  output = process.stdout,
} = {}) {
  return function logSmoke(message, details = null) {
    if (!enabled) return;
    const suffix = details == null ? '' : ` ${JSON.stringify(details)}`;
    output.write(`[ashen-smoke] ${message}${suffix}\n`);
  };
}
