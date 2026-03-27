export function createBrowserAudioContextFactory(host = globalThis) {
  return function createBrowserAudioContext() {
    const AudioCtx = host?.AudioContext
      || host?.webkitAudioContext
      || host?.window?.AudioContext
      || host?.window?.webkitAudioContext;
    return AudioCtx ? new AudioCtx() : null;
  };
}
