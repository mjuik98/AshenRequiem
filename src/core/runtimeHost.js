/**
 * src/core/runtimeHost.js
 *
 * Public compatibility wrapper.
 * Real browser runtime ownership lives in src/adapters/browser/runtimeHost.js.
 */
export {
  getDevicePixelRatio,
  getRuntimeHost,
  getViewportSize,
} from '../adapters/browser/runtimeHost.js';
