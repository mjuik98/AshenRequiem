import { GameApp } from '../GameApp.js';
import { createBrowserGameShell } from '../../adapters/browser/BrowserGameShell.js';
import { createSceneFactory } from './createSceneFactory.js';
import {
  registerRuntimeHooks,
  unregisterRuntimeHooks,
} from '../../adapters/browser/runtimeHooks.js';

export function bootstrapBrowserGame({
  createShellImpl = createBrowserGameShell,
  createSceneFactoryImpl = createSceneFactory,
  createAppImpl = (options) => new GameApp({
    createInitialSceneImpl: (game) => game?.sceneFactory?.createTitleScene?.(game) ?? null,
    registerRuntimeHooksImpl: registerRuntimeHooks,
    unregisterRuntimeHooksImpl: unregisterRuntimeHooks,
    ...(options ?? {}),
  }),
} = {}) {
  const game = {};
  const shell = createShellImpl();
  const app = createAppImpl();

  shell.attach(game);
  app.attach(game);
  game.sceneFactory = createSceneFactoryImpl();

  game.start = () => app.start(game);
  game.destroy = () => {
    app.destroy(game);
    game.sceneFactory = null;
    shell.detach(game);
  };
  game.advanceTime = (ms) => app.advanceTime(game, ms);
  game._tick = (dt) => app.tick(game, dt);

  return game;
}
