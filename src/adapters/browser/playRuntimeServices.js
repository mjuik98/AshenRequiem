import { getNowSeconds } from './runtimeEnv.js';
import { createBrowserAudioContextFactory } from './audioRuntime.js';

export function createPlayBrowserRuntimeServices({
  host = globalThis,
  getNowSecondsImpl = getNowSeconds,
  createAudioContextFactoryImpl = createBrowserAudioContextFactory,
} = {}) {
  return {
    nowSeconds: () => getNowSecondsImpl(host),
    createAudioContext: createAudioContextFactoryImpl(host),
  };
}
