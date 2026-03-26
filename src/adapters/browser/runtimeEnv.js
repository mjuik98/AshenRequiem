export function getRuntimeHost(host = globalThis) {
  return host ?? null;
}

export function hasRuntimeQueryFlag(flagName, host = globalThis) {
  const runtimeHost = getRuntimeHost(host);
  if (!runtimeHost || !flagName) return false;
  const search = runtimeHost.location?.search ?? '';
  return new URLSearchParams(search).has(flagName);
}

export function getDevicePixelRatio(host = globalThis, fallback = 1) {
  const runtimeHost = getRuntimeHost(host);
  const dpr = runtimeHost?.devicePixelRatio;
  return Number.isFinite(dpr) && dpr > 0 ? dpr : fallback;
}

export function getViewportSize(host = globalThis, defaults = { width: 1280, height: 720 }) {
  const runtimeHost = getRuntimeHost(host);
  const width = Number.isFinite(runtimeHost?.innerWidth) ? runtimeHost.innerWidth : defaults.width;
  const height = Number.isFinite(runtimeHost?.innerHeight) ? runtimeHost.innerHeight : defaults.height;
  return { width, height };
}

export function getNowMs(host = globalThis) {
  const runtimeHost = getRuntimeHost(host);
  const value = runtimeHost?.performance?.now?.();
  return Number.isFinite(value) ? value : 0;
}

export function getNowSeconds(host = globalThis) {
  return getNowMs(host) / 1000;
}
