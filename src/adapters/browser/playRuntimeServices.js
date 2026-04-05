import {
  getDevicePixelRatio,
  getNowMs,
  getNowSeconds,
} from './runtimeEnv.js';
import { createBrowserAudioContextFactory } from './audioRuntime.js';
import { createDocumentAccessibilityRuntime } from '../../ui/shared/accessibilityRuntime.js';

export function createPlayBrowserRuntimeServices({
  host = globalThis,
  getNowMsImpl = getNowMs,
  getNowSecondsImpl = getNowSeconds,
  getDevicePixelRatioImpl = getDevicePixelRatio,
  createAudioContextFactoryImpl = createBrowserAudioContextFactory,
  accessibilityRuntime = null,
  accessibilityRuntimeFactory = createDocumentAccessibilityRuntime,
} = {}) {
  return {
    nowMs: () => getNowMsImpl(host),
    nowSeconds: () => getNowSecondsImpl(host),
    devicePixelRatioReader: () => getDevicePixelRatioImpl(host, 1),
    accessibilityRuntime: accessibilityRuntime ?? accessibilityRuntimeFactory(),
    createAudioContext: createAudioContextFactoryImpl(host),
  };
}
