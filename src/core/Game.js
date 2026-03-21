import { GameConfig }     from './GameConfig.js';
import { GameLoop }       from './GameLoop.js';
import { SceneManager }   from './SceneManager.js';
import { InputManager }    from '../input/InputManager.js';
import { KeyboardAdapter } from '../input/KeyboardAdapter.js';
import { TouchAdapter }    from '../input/TouchAdapter.js';
import { CanvasRenderer }  from '../renderer/CanvasRenderer.js';
import { TitleScene }      from '../scenes/TitleScene.js';
import { validateGameData } from '../utils/validateGameData.js';
import { GameDataLoader }   from '../data/GameDataLoader.js';
import { AssetManager }     from '../managers/AssetManager.js';
import { loadSession } from '../state/createSessionState.js';
import { getEffectiveDevicePixelRatio } from '../state/sessionOptions.js';
import { registerRuntimeHooks, unregisterRuntimeHooks } from './runtimeHooks.js';

/** Game — 게임 최상위 진입점 */
export class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx    = this.canvas.getContext('2d');

    this.session = loadSession();
    this.inputState = null;

    // FIX(memory): resize 핸들러를 인스턴스에 저장해 나중에 제거 가능하도록
    this._onResize = () => this._resizeCanvas();
    this._resizeCanvas();
    window.addEventListener('resize', this._onResize);

    this.input = new InputManager();
    this.input.addAdapter(new KeyboardAdapter());
    if ('ontouchstart' in window) {
      this.input.addAdapter(new TouchAdapter(this.canvas));
    }
    this.assets       = new AssetManager();
    this.gameData     = GameDataLoader.loadDefault();
    this.sceneManager = new SceneManager();
    this.renderer     = new CanvasRenderer(this.canvas, this.ctx);
    this._loop        = new GameLoop((dt) => this._tick(dt));
    registerRuntimeHooks(this);
  }

  async start() {
    validateGameData({
      upgradeData: this.gameData.upgradeData,
      weaponData:  this.gameData.weaponData,
      waveData:    this.gameData.waveData,
    });

    await this.assets.loadAll();

    this.sceneManager.changeScene(new TitleScene(this));
    this._loop.start();
  }

  destroy() {
    this._loop.stop();
    this.input.destroy();
    this.inputState = null;
    window.removeEventListener('resize', this._onResize);
    unregisterRuntimeHooks();
  }

  advanceTime(ms) {
    const frameMs = 1000 / 60;
    const steps = Math.max(1, Math.round((ms ?? frameMs) / frameMs));
    for (let i = 0; i < steps; i += 1) {
      this._tick(frameMs / 1000);
    }
  }

  _tick(dt) {
    this.inputState = this.input.poll();
    this.sceneManager.update(dt);
    this.sceneManager.render();
  }

  /**
   * FIX(web): devicePixelRatio 대응 + 리사이즈 시 캔버스 동기화
   *
   * CHANGE(Settings): useDevicePixelRatio를 session.options에서 읽도록 변경.
   *   session이 없거나 options 필드가 없을 때는 GameConfig.useDevicePixelRatio 폴백 사용.
   *   SettingsScene._handleSave()에서 저장 직후 호출되어 즉시 반영된다.
   */
  _resizeCanvas() {
    const dpr = getEffectiveDevicePixelRatio(
      this.session?.options,
      window.devicePixelRatio || 1,
      GameConfig.useDevicePixelRatio,
    );

    const w = window.innerWidth, h = window.innerHeight;
    this.canvas.width  = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width  = `${w}px`;
    this.canvas.style.height = `${h}px`;
    GameConfig.canvasWidth  = w;
    GameConfig.canvasHeight = h;
    if (this.ctx) this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
}
