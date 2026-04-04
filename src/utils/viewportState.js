import { GameConfig } from '../core/GameConfig.js';

export function resolveViewportDimensions({
  camera = null,
  viewport = null,
  defaults = GameConfig,
} = {}) {
  return {
    width: camera?.width ?? viewport?.width ?? defaults.canvasWidth,
    height: camera?.height ?? viewport?.height ?? defaults.canvasHeight,
  };
}

export function applyViewportToCamera(camera, viewport = null, defaults = GameConfig) {
  if (!camera) return camera ?? null;
  const { width, height } = resolveViewportDimensions({ camera, viewport, defaults });
  camera.width = width;
  camera.height = height;
  return camera;
}
