export { shouldEnableRuntimeHooks } from '../runtimeFeatureFlags.js';
import { shouldEnableRuntimeHooks } from '../runtimeFeatureFlags.js';

export function getHookHost() {
  return typeof globalThis !== 'undefined' ? globalThis : null;
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
