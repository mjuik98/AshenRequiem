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
import { createSessionState } from '../state/createSessionState.js';

/** Game — 게임 최상위 진입점 */
export class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx    = this.canvas.getContext('2d');

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
    this.session      = createSessionState();
    this.gameData     = GameDataLoader.loadDefault();
    this.sceneManager = new SceneManager();
    this.renderer     = new CanvasRenderer(this.canvas, this.ctx);
    this._loop        = new GameLoop((dt) => this._tick(dt));
  }

  async start() {
    // FIX(R-17): import 없는 변수 참조 버그 수정
    //   Before: validateGameData({ upgradeData, weaponData, waveData })
    //           → upgradeData/weaponData/waveData가 선언되지 않아 ReferenceError
    //   After:  constructor에서 이미 로드한 this.gameData 재사용
    validateGameData({
      upgradeData: this.gameData.upgradeData,
      weaponData:  this.gameData.weaponData,
      waveData:    this.gameData.waveData,
    });

    // 에셋 로드 시작 (MVP: 현재는 등록된 에셋이 없으므로 즉시 완료됨)
    await this.assets.loadAll();
    
    this.sceneManager.changeScene(new TitleScene(this));
    this._loop.start();
  }

  destroy() {
    this._loop.stop();
    this.input.destroy();
    window.removeEventListener('resize', this._onResize);
  }

  _tick(dt) {
    this.input.poll();
    this.sceneManager.update(dt);
    this.sceneManager.render();
  }

  /** FIX(web): devicePixelRatio 대응 + 리사이즈 시 캔버스 동기화 */
  _resizeCanvas() {
    const dpr = GameConfig.useDevicePixelRatio ? (window.devicePixelRatio || 1) : 1;
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
