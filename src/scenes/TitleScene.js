import { PlayScene } from './PlayScene.js';

export class TitleScene {
  constructor(game) {
    this.game = game;
    this._el = null;
  }

  enter() {
    this._el = document.createElement('div');
    this._el.id = 'title-screen';
    this._el.innerHTML = `
      <div class="title-inner">
        <h1 class="title-name">VAMPLIKE</h1>
        <p class="title-sub">생존하라. 성장하라. 무너지지 마라.</p>
        <button class="title-start-btn" id="title-start">게임 시작</button>
        <p class="title-hint">WASD / 화살표 키로 이동 &nbsp;|&nbsp; \` 키로 디버그 패널</p>
      </div>`;
    this._injectStyles();
    document.getElementById('ui-container').appendChild(this._el);
    document.getElementById('title-start').addEventListener('click', () => {
      this.game.sceneManager.changeScene(new PlayScene(this.game));
    });
  }

  update() {}

  render() {
    this.game.renderer.clear();
    this.game.renderer.drawBackground({ x: 0, y: 0 });
  }

  exit() {
    if (this._el) { this._el.remove(); this._el = null; }
  }

  _injectStyles() {
    if (document.getElementById('title-styles')) return;
    const style = document.createElement('style');
    style.id = 'title-styles';
    style.textContent = `
      #title-screen { position:absolute;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;z-index:50; }
      .title-inner { display:flex;flex-direction:column;align-items:center;gap:20px; }
      .title-name { font-size:64px;font-weight:900;color:#4fc3f7;letter-spacing:8px;font-family:'Segoe UI',sans-serif;text-shadow:0 0 40px rgba(79,195,247,0.6); }
      .title-sub { font-size:16px;color:#888;font-family:'Segoe UI',sans-serif;letter-spacing:2px; }
      .title-start-btn { padding:16px 48px;background:#4fc3f7;color:#000;border:none;border-radius:8px;font-size:18px;font-weight:700;cursor:pointer;transition:all 0.15s;font-family:'Segoe UI',sans-serif; }
      .title-start-btn:hover { background:#81d4fa;transform:scale(1.05);box-shadow:0 0 24px rgba(79,195,247,0.5); }
      .title-hint { font-size:12px;color:#444;font-family:'Segoe UI',sans-serif;margin-top:8px; }
    `;
    document.head.appendChild(style);
  }
}
