import { GameApp } from '../GameApp.js';
import { createBrowserGameShell } from '../../adapters/browser/BrowserGameShell.js';
import { createPlayBrowserRuntimeServices } from '../../adapters/browser/playRuntimeServices.js';
import { configureBrowserRuntimeLoggerPolicy } from '../../adapters/browser/runtimeLoggerPolicy.js';
import { createSceneFactory } from './createSceneFactory.js';
import { registerPlayEventHandlers } from '../play/playEventRegistrationService.js';
import {
  registerRuntimeHooks,
  unregisterRuntimeHooks,
} from '../../adapters/browser/runtimeHooks.js';

export function bootstrapBrowserGame({
  createShellImpl = createBrowserGameShell,
  createPlayRuntimeServicesImpl = createPlayBrowserRuntimeServices,
  createSceneFactoryImpl = createSceneFactory,
  registerPlayEventHandlersImpl = registerPlayEventHandlers,
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
  let resetRuntimeLoggerPolicy = () => {};

  shell.attach(game);
  resetRuntimeLoggerPolicy = configureBrowserRuntimeLoggerPolicy(game.runtimeHost ?? globalThis);
  app.attach(game);
  game.sceneFactory = createSceneFactoryImpl();
  game.playRuntimeServices = createPlayRuntimeServicesImpl({
    host: game.runtimeHost ?? globalThis,
    accessibilityRuntime: game.accessibilityRuntime ?? null,
  });
  game.registerPlayEventHandlers = registerPlayEventHandlersImpl;

  game.start = () => app.start(game);
  game.destroy = () => {
    app.destroy(game);
    resetRuntimeLoggerPolicy();
    game.sceneFactory = null;
    game.playRuntimeServices = null;
    game.registerPlayEventHandlers = null;
    shell.detach(game);
  };
  game.advanceTime = (ms) => app.advanceTime(game, ms);
  game._tick = (dt) => app.tick(game, dt);

  return game;
}
