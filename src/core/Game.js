import { GameApp } from '../app/GameApp.js';
import { createBrowserGameShell } from '../adapters/browser/BrowserGameShell.js';

export function createGame(options) {
  return new Game(options);
}

/** Game — 게임 최상위 진입점 */
export class Game {
  constructor({
    createInitialSceneImpl = null,
    createShellImpl = createBrowserGameShell,
    createAppImpl = (options) => new GameApp({
      createInitialSceneImpl,
      ...(options ?? {}),
    }),
  } = {}) {
    this._shell = createShellImpl();
    this._shell.attach(this);
    this._app = createAppImpl();
    this._app.attach(this);
  }

  async start() {
    this._app.start(this);
  }

  destroy() {
    this._app.destroy(this);
    this._shell.detach(this);
  }

  advanceTime(ms) {
    this._app.advanceTime(this, ms);
  }

  _tick(dt) {
    this._app.tick(this, dt);
  }

  /**
   * FIX(web): devicePixelRatio 대응 + 리사이즈 시 캔버스 동기화
   *
   * CHANGE(Settings): useDevicePixelRatio를 session.options에서 읽도록 변경.
   *   session이 없거나 options 필드가 없을 때는 GameConfig.useDevicePixelRatio 폴백 사용.
   *   SettingsScene._handleSave()에서 저장 직후 호출되어 즉시 반영된다.
   */
  _resizeCanvas() {
    this._shell.resize(this);
  }
}
