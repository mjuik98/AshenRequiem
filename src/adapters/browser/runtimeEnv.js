import {
  getDevicePixelRatio,
  getRuntimeHost,
  getViewportSize,
} from '../../core/runtimeHost.js';

export {
  getDevicePixelRatio,
  getRuntimeHost,
  getViewportSize,
};

export function hasRuntimeQueryFlag(flagName, host = globalThis) {
  const runtimeHost = getRuntimeHost(host);
  if (!runtimeHost || !flagName) return false;
  const search = runtimeHost.location?.search ?? '';
  return new URLSearchParams(search).has(flagName);
}

export function getNowMs(host = globalThis) {
  const runtimeHost = getRuntimeHost(host);
  const value = runtimeHost?.performance?.now?.();
  return Number.isFinite(value) ? value : 0;
}

export function getNowSeconds(host = globalThis) {
  return getNowMs(host) / 1000;
}
