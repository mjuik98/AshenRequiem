import { hasRuntimeQueryFlag } from '../runtimeEnv.js';

export function getHookHost() {
  return typeof globalThis !== 'undefined' ? globalThis : null;
}

export function shouldEnableRuntimeHooks(options = {}, host = getHookHost()) {
  if (options.enabled === true) return true;
  if (options.enabled === false) return false;
  if (!host) return false;
  if (host.__ASHEN_DEBUG_RUNTIME__ === true) return true;
  return hasRuntimeQueryFlag('debugRuntime', host);
}

export function getSceneName(scene) {
  return scene?.sceneId ?? scene?.constructor?.name ?? 'UnknownScene';
}

export function getSceneDebugSurface(scene) {
  const surface = scene?.getDebugSurface?.();
  if (!surface || typeof surface !== 'object') {
    return {
      ui: null,
      gameData: null,
      levelUpController: null,
    };
  }
  return {
    ui: surface.ui ?? null,
    gameData: surface.gameData ?? null,
    levelUpController: surface.levelUpController ?? null,
  };
}
