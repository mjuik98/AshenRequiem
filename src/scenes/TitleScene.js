import { PlayScene } from './PlayScene.js';

/** TitleScene — 타이틀 화면 */
export class TitleScene {
  constructor(game) {
    this.game   = game;
    this._el    = null;
    this._bound = null;
  }

  enter() {
    this._el = document.createElement('div');
    this._el.id = 'title-screen';
    this._el.innerHTML = `
      <div class="title-content">
        <div class="title-name">Ashen Requiem</div>
        <div class="title-sub">뱀서라이크 MVP</div>
        <button class="title-start-btn" id="title-start">게임 시작</button>
        <div class="title-hints">
          <span>이동: WASD / 화살표</span>
          <span>디버그: \`</span>
        </div>
      </div>
    `;
    this._injectStyles();
    document.getElementById('ui-container').appendChild(this._el);

    this._bound = () => this.game.sceneManager.changeScene(new PlayScene(this.game));
    document.getElementById('title-start').addEventListener('click', this._bound);
  }

  update() {}
  render() {}

  exit() {
    if (this._el) { this._el.remove(); this._el = null; }
  }

  _injectStyles() {
    if (document.getElementById('title-styles')) return;
    const s = document.createElement('style');
    s.id = 'title-styles';
    s.textContent = `
      #title-screen {
        position: absolute; inset: 0;
        display: flex; align-items: center; justify-content: center;
        background: radial-gradient(ellipse at center, #0d1f2d 0%, #0a0a0f 100%);
        z-index: 50;
      }
      .title-content {
        text-align: center; display: flex; flex-direction: column;
        align-items: center; gap: 18px;
      }
      .title-name {
        font-size: 52px; font-weight: 800; letter-spacing: 4px;
        background: linear-gradient(135deg, #4fc3f7, #b39ddb, #ef5350);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        background-clip: text;
        animation: title-glow 3s ease-in-out infinite alternate;
      }
      @keyframes title-glow {
        from { filter: drop-shadow(0 0 8px rgba(79,195,247,0.4)); }
        to   { filter: drop-shadow(0 0 20px rgba(179,157,219,0.6)); }
      }
      .title-sub {
        font-size: 14px; color: #666; letter-spacing: 3px; text-transform: uppercase;
      }
      .title-start-btn {
        margin-top: 12px; padding: 14px 48px;
        border: none; border-radius: 8px;
        background: linear-gradient(90deg, #4fc3f7, #b39ddb);
        color: #fff; font-size: 16px; font-weight: 700;
        cursor: pointer; letter-spacing: 2px;
        transition: transform 0.15s, box-shadow 0.15s;
        box-shadow: 0 4px 20px rgba(79,195,247,0.3);
      }
      .title-start-btn:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 28px rgba(79,195,247,0.5);
      }
      .title-hints {
        font-size: 12px; color: #444;
        display: flex; gap: 20px; margin-top: 8px;
      }
    `;
    document.head.appendChild(s);
  }
}
