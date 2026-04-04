import { GameConfig } from '../../core/GameConfig.js';
import { createGameRuntimeState } from './gameRuntime.js';
import {
  createGameResizeHandler,
  syncGameCanvasSize,
} from './gameCanvasRuntime.js';
import { createDocumentAccessibilityRuntime } from '../../ui/shared/accessibilityRuntime.js';

export function createBrowserGameShell({
  host = globalThis,
  documentRef = document,
  createRuntimeStateImpl = createGameRuntimeState,
  createResizeHandlerImpl = createGameResizeHandler,
  syncCanvasSizeImpl = syncGameCanvasSize,
  createAccessibilityRuntimeImpl = createDocumentAccessibilityRuntime,
} = {}) {
  const runtimeState = createRuntimeStateImpl({ host, documentRef });
  let resizeHandler = null;
  let accessibilityRuntime = null;

  function buildResizeDeps(game) {
    return {
      canvas: game.canvas,
      ctx: game.ctx,
      sessionOptions: game.session?.options,
      host,
      defaultUseDevicePixelRatio: GameConfig.useDevicePixelRatio,
    };
  }

  function applyViewportState(game, viewport) {
    if (!game || !viewport) return viewport ?? null;
    game.viewport = { ...viewport };
    return game.viewport;
  }

  function resize(game) {
    return applyViewportState(game, syncCanvasSizeImpl(buildResizeDeps(game)));
  }

  return {
    runtimeState,

    attach(game) {
      Object.assign(game, runtimeState);
      accessibilityRuntime = createAccessibilityRuntimeImpl(documentRef?.documentElement ?? null);
      game.runtimeHost = host;
      game.accessibilityRuntime = accessibilityRuntime;
      game.viewport = null;
      resizeHandler = createResizeHandlerImpl({
        getDeps: () => buildResizeDeps(game),
        resizeImpl: (deps) => applyViewportState(game, syncCanvasSizeImpl(deps)),
      });
      if (typeof resizeHandler !== 'function') {
        resizeHandler = () => resize(game);
      }
      const resizeCanvas = () => resize(game);
      game._onResize = resizeHandler;
      game._resizeCanvas = resizeCanvas;
      game.runtimeCapabilities = {
        ...(game.runtimeCapabilities ?? {}),
        resizeCanvas,
      };
      resizeCanvas();
      host?.addEventListener?.('resize', resizeHandler);
      return game;
    },

    detach(game) {
      host?.removeEventListener?.('resize', resizeHandler ?? game?._onResize);
      if (game) {
        game._onResize = null;
        game.runtimeHost = null;
        game.accessibilityRuntime = null;
        game.runtimeCapabilities = null;
        game.viewport = null;
      }
    },

    resize,
  };
}
