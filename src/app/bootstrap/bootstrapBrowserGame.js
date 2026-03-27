import { GameApp } from '../GameApp.js';
import { createBrowserGameShell } from '../../adapters/browser/BrowserGameShell.js';
import { TitleScene } from '../../scenes/TitleScene.js';

export function bootstrapBrowserGame({
  createShellImpl = createBrowserGameShell,
  createAppImpl = (options) => new GameApp({
    createInitialSceneImpl: (game) => new TitleScene(game),
    ...(options ?? {}),
  }),
} = {}) {
  const game = {};
  const shell = createShellImpl();
  const app = createAppImpl();

  shell.attach(game);
  app.attach(game);

  game.start = () => app.start(game);
  game.destroy = () => {
    app.destroy(game);
    shell.detach(game);
  };
  game.advanceTime = (ms) => app.advanceTime(game, ms);
  game._tick = (dt) => app.tick(game, dt);

  return game;
}
