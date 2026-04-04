import { GameLoop } from '../../core/GameLoop.js';
import { SceneManager } from '../../core/SceneManager.js';
import { CanvasRenderer } from '../../renderer/CanvasRenderer.js';
import { GameDataLoader } from '../../data/GameDataLoader.js';
import { loadSession } from '../../state/createSessionState.js';
import { createGameInput } from './gameInputRuntime.js';

export function createGameRuntimeState({
  documentRef = document,
  host = globalThis,
  canvasId = 'game-canvas',
  loadSessionImpl = loadSession,
  createInputImpl = createGameInput,
  loadGameDataImpl = () => GameDataLoader.loadDefault(),
  createSceneManagerImpl = () => new SceneManager(),
  createRendererImpl = (canvas, ctx) => new CanvasRenderer(canvas, ctx),
  createGameLoopImpl = (tickFn, options) => new GameLoop(tickFn, options),
  getNowMsImpl = () => host?.performance?.now?.() ?? Date.now(),
} = {}) {
  const canvas = documentRef.getElementById(canvasId);
  const ctx = canvas.getContext('2d');
  const session = loadSessionImpl();
  const input = createInputImpl({ canvas, host, options: session?.options });
  const gameData = loadGameDataImpl();
  const sceneManager = createSceneManagerImpl();
  const renderer = createRendererImpl(canvas, ctx);

  return {
    canvas,
    ctx,
    session,
    inputState: null,
    input,
    gameData,
    sceneManager,
    renderer,
    _loop: createGameLoopImpl(() => {}, { getNowMs: getNowMsImpl }),
  };
}
