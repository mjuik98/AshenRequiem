/**
 * TitleScene — 타이틀 화면
 *
 * 흐름 제어만 담당. 게임 규칙 없음.
 */
export class TitleScene {
  constructor(game) {
    this.game = game;
    this._overlay = null;
  }

  enter() {
    const container = document.getElementById('ui-container');

    this._overlay = document.createElement('div');
    this._overlay.id = 'title-overlay';
    this._overlay.innerHTML = `
      <div class="title-panel">
        <h1 class="title-logo">ASHEN<br>REQUIEM</h1>
        <p class="title-subtitle">뱀서라이크 MVP</p>
        <button class="title-start-btn" id="title-start-btn">START GAME</button>
        <p class="title-controls">WASD or Arrow Keys to move</p>
      </div>
    `;

    this._injectStyles();
    container.appendChild(this._overlay);

    document.getElementById('title-start-btn').addEventListener('click', () => {
      this._startGame();
    });

    // 스페이스바로도 시작
    this._onKeyDown = (e) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        this._startGame();
      }
    };
    window.addEventListener('keydown', this._onKeyDown);
  }

  _startGame() {
    // PlayScene으로 전환 (동적 import)
    import('../scenes/PlayScene.js').then(({ PlayScene }) => {
      const playScene = new PlayScene(this.game);
      this.game.sceneManager.changeScene(playScene);
    });
  }

  update(dt) {
    // 타이틀에서는 업데이트 불필요
  }

  render() {
    // 배경만 렌더
    const renderer = this.game.renderer;
    renderer.clear();
    renderer.drawBackground({ x: 0, y: 0 });
  }

  exit() {
    if (this._overlay) {
      this._overlay.remove();
      this._overlay = null;
    }
    if (this._onKeyDown) {
      window.removeEventListener('keydown', this._onKeyDown);
      this._onKeyDown = null;
    }
  }

  _injectStyles() {
    if (document.getElementById('title-styles')) return;
    const style = document.createElement('style');
    style.id = 'title-styles';
    style.textContent = `
      #title-overlay {
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 300;
      }
      .title-panel {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 24px;
      }
      .title-logo {
        font-size: 64px;
        font-weight: 900;
        color: #e0e0e0;
        text-align: center;
        line-height: 1.1;
        letter-spacing: 8px;
        text-shadow: 0 0 40px rgba(255,213,79,0.3),
                     0 0 80px rgba(239,83,80,0.2);
        animation: titleGlow 3s ease-in-out infinite alternate;
      }
      @keyframes titleGlow {
        from { text-shadow: 0 0 40px rgba(255,213,79,0.3), 0 0 80px rgba(239,83,80,0.2); }
        to { text-shadow: 0 0 60px rgba(255,213,79,0.5), 0 0 120px rgba(239,83,80,0.3); }
      }
      .title-subtitle {
        font-size: 14px;
        color: #888;
        letter-spacing: 3px;
        text-transform: uppercase;
      }
      .title-start-btn {
        padding: 14px 48px;
        font-size: 18px;
        font-weight: 700;
        color: #0d1117;
        background: linear-gradient(135deg, #ffd54f, #ffb300);
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: inherit;
        letter-spacing: 2px;
        margin-top: 16px;
      }
      .title-start-btn:hover {
        background: linear-gradient(135deg, #ffee58, #ffd54f);
        transform: scale(1.05);
        box-shadow: 0 6px 25px rgba(255,213,79,0.4);
      }
      .title-controls {
        font-size: 12px;
        color: #555;
        letter-spacing: 1px;
      }
    `;
    document.head.appendChild(style);
  }
}
