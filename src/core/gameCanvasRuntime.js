import { GameConfig } from './GameConfig.js';
import { getEffectiveDevicePixelRatio } from '../state/sessionOptions.js';

function getRuntimeHost(host = globalThis) {
  return host ?? null;
}

function getDevicePixelRatio(host = globalThis, fallback = 1) {
  const runtimeHost = getRuntimeHost(host);
  const dpr = runtimeHost?.devicePixelRatio;
  return Number.isFinite(dpr) && dpr > 0 ? dpr : fallback;
}

function getViewportSize(host = globalThis, defaults = { width: 1280, height: 720 }) {
  const runtimeHost = getRuntimeHost(host);
  const width = Number.isFinite(runtimeHost?.innerWidth) ? runtimeHost.innerWidth : defaults.width;
  const height = Number.isFinite(runtimeHost?.innerHeight) ? runtimeHost.innerHeight : defaults.height;
  return { width, height };
}

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
  GameConfig.canvasWidth = width;
  GameConfig.canvasHeight = height;
  ctx?.setTransform?.(dpr, 0, 0, dpr, 0, 0);

  return { width, height, dpr };
}

export function createGameResizeHandler(deps = {}) {
  return () => syncGameCanvasSize(deps);
}
