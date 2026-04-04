/**
 * src/core/gameCanvasRuntime.js
 *
 * Public compatibility wrapper.
 * Real browser runtime ownership lives in src/adapters/browser/gameCanvasRuntime.js.
 */
export {
  createGameResizeHandler,
  syncGameCanvasSize,
} from '../adapters/browser/gameCanvasRuntime.js';
