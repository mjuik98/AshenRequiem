import { GameConfig } from './GameConfig.js';
import { GameLoop } from './GameLoop.js';
import { SceneManager } from './SceneManager.js';
import { Input } from './Input.js';
import { CanvasRenderer } from '../renderer/CanvasRenderer.js';
import { TitleScene } from '../scenes/TitleScene.js';

/**
 * Game — 게임 최상위 진입점
 *
 * Canvas 초기화, Input/SceneManager 생성, GameLoop 시작
 */
export class Game {
  constructor() {
    // Canvas 설정
    /** @type {HTMLCanvasElement} */
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this._resizeCanvas();
    window.addEventListener('resize', () => this._resizeCanvas());

    // 서비스 초기화
    this.input = new Input();
    this.input.init();

    this.sceneManager = new SceneManager();
    this.renderer = new CanvasRenderer(this.canvas, this.ctx);

    // 게임 루프
    this._loop = new GameLoop((dt) => this._tick(dt));
  }

  start() {
    // 첫 씬은 TitleScene
    const titleScene = new TitleScene(this);
    this.sceneManager.changeScene(titleScene);
    this._loop.start();
  }

  _tick(dt) {
    this.sceneManager.update(dt);
    this.sceneManager.render();
  }

  _resizeCanvas() {
    const dpr = GameConfig.useDevicePixelRatio ? (window.devicePixelRatio || 1) : 1;
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';

    // 논리 해상도 업데이트
    GameConfig.canvasWidth = w;
    GameConfig.canvasHeight = h;

    if (this.ctx) {
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }
}
