import { GameConfig } from '../../core/GameConfig.js';
import { getEffectiveDevicePixelRatio } from '../../state/sessionOptions.js';
import {
  getDevicePixelRatio,
  getViewportSize,
} from './runtimeHost.js';

export function syncGameCanvasSize({
  canvas,
  ctx,
  sessionOptions,
  host = globalThis,
  defaultUseDevicePixelRatio = GameConfig.useDevicePixelRatio,
} = {}) {
  const dpr = getEffectiveDevicePixelRatio(
    sessionOptions,
    getDevicePixelRatio(host, 1),
    defaultUseDevicePixelRatio,
  );
  const { width, height } = getViewportSize(host, {
    width: GameConfig.canvasWidth,
    height: GameConfig.canvasHeight,
  });

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx?.setTransform?.(dpr, 0, 0, dpr, 0, 0);

  return { width, height, dpr };
}

export function createGameResizeHandler({
  getDeps = null,
  resizeImpl = syncGameCanvasSize,
  ...deps
} = {}) {
  return () => resizeImpl(typeof getDeps === 'function' ? getDeps() : deps);
}
