import { GameConfig } from '../../core/GameConfig.js';
import { createGameRuntimeState } from '../../core/gameRuntime.js';
import {
  createGameResizeHandler,
  syncGameCanvasSize,
} from '../../core/gameCanvasRuntime.js';

export function createBrowserGameShell({
  host = globalThis,
  createRuntimeStateImpl = createGameRuntimeState,
  createResizeHandlerImpl = createGameResizeHandler,
  syncCanvasSizeImpl = syncGameCanvasSize,
} = {}) {
  const runtimeState = createRuntimeStateImpl({ host });
  let resizeHandler = null;

  function resize(game) {
    return syncCanvasSizeImpl({
      canvas: game.canvas,
      ctx: game.ctx,
      sessionOptions: game.session?.options,
      host,
      defaultUseDevicePixelRatio: GameConfig.useDevicePixelRatio,
    });
  }

  return {
    runtimeState,

    attach(game) {
      Object.assign(game, runtimeState);
      resizeHandler = createResizeHandlerImpl({
        canvas: game.canvas,
        ctx: game.ctx,
        sessionOptions: game.session?.options,
        host,
        defaultUseDevicePixelRatio: GameConfig.useDevicePixelRatio,
      });
      game._onResize = resizeHandler;
      game._resizeCanvas = () => resize(game);
      game._resizeCanvas();
      host?.addEventListener?.('resize', resizeHandler);
      return game;
    },

    detach(game) {
      host?.removeEventListener?.('resize', resizeHandler ?? game?._onResize);
      if (game) {
        game._onResize = null;
      }
    },

    resize,
  };
}
