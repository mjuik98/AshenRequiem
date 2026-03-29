import { validateGameData } from '../utils/validateGameData.js';
import { registerRuntimeHooks, unregisterRuntimeHooks } from '../adapters/browser/runtimeHooks.js';
import { recordReplaySample } from '../core/replayTraceRuntime.js';

export class GameApp {
  constructor({
    createInitialSceneImpl = null,
    validateGameDataImpl = validateGameData,
    registerRuntimeHooksImpl = registerRuntimeHooks,
    unregisterRuntimeHooksImpl = unregisterRuntimeHooks,
  } = {}) {
    this._createInitialScene = createInitialSceneImpl;
    this._validateGameData = validateGameDataImpl;
    this._registerRuntimeHooks = registerRuntimeHooksImpl;
    this._unregisterRuntimeHooks = unregisterRuntimeHooksImpl;
    this._game = null;
  }

  attach(game) {
    this._game = game;
    game._loop._tickFn = (dt) => this.tick(game, dt);
    this._registerRuntimeHooks(game);
    return game;
  }

  start(game = this._game) {
    const createInitialScene = this._createInitialScene ?? game?.createInitialSceneImpl;
    if (typeof createInitialScene !== 'function') {
      throw new Error('GameApp requires createInitialSceneImpl to be provided by the bootstrap boundary.');
    }

    this._validateGameData({
      upgradeData: game.gameData.upgradeData,
      weaponData: game.gameData.weaponData,
      waveData: game.gameData.waveData,
    });

    game.sceneManager.changeScene(createInitialScene(game));
    game._loop.start();
  }

  destroy(game = this._game) {
    game?._loop?.stop?.();
    game?.input?.destroy?.();
    if (game) {
      game.inputState = null;
    }
    this._unregisterRuntimeHooks();
  }

  tick(game = this._game, dt) {
    if (!game) return;
    game.inputState = game.input.poll();
    const world = game.sceneManager?.currentScene?.world ?? null;
    if (world) {
      recordReplaySample(world, game.inputState, dt);
    }
    game.sceneManager.update(dt);
    game.sceneManager.render();
  }

  advanceTime(game = this._game, ms) {
    if (!game) return;
    const frameMs = 1000 / 60;
    const steps = Math.max(1, Math.round((ms ?? frameMs) / frameMs));
    for (let i = 0; i < steps; i += 1) {
      this.tick(game, frameMs / 1000);
    }
  }
}
