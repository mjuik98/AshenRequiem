import { GameConfig } from './GameConfig.js';
import { GameLoop } from './GameLoop.js';
import { SceneManager } from './SceneManager.js';
import { Input } from './Input.js';
import { CanvasRenderer } from '../renderer/CanvasRenderer.js';
import { TitleScene } from '../scenes/TitleScene.js';

/**
 * Game — 게임 최상위 진입점
 */
export class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx    = this.canvas.getContext('2d');
    this._resizeCanvas();
    window.addEventListener('resize', () => this._resizeCanvas());

    this.input        = new Input();
    this.input.init();
    this.sceneManager = new SceneManager();
    this.renderer     = new CanvasRenderer(this.canvas, this.ctx);
    this._loop        = new GameLoop((dt) => this._tick(dt));
  }

  start() {
    this.sceneManager.changeScene(new TitleScene(this));
    this._loop.start();
  }

  _tick(dt) {
    this.sceneManager.update(dt);
    this.sceneManager.render();
  }

  _resizeCanvas() {
    const dpr = GameConfig.useDevicePixelRatio ? (window.devicePixelRatio || 1) : 1;
    const w = window.innerWidth, h = window.innerHeight;
    this.canvas.width  = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width  = w + 'px';
    this.canvas.style.height = h + 'px';
    GameConfig.canvasWidth  = w;
    GameConfig.canvasHeight = h;
    if (this.ctx) this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
}
