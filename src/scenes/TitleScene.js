import { PlayScene } from './PlayScene.js';
import { MetaShopScene } from './MetaShopScene.js';
import { setSelectedStartWeaponAndSave } from '../state/sessionFacade.js';
import { createSceneNavigationGuard } from './sceneNavigation.js';
import { buildTitleLoadoutConfig } from './title/titleLoadout.js';
import {
  ensureTitleFonts,
  ensureTitleStyles,
  TITLE_SCREEN_HTML,
} from './title/titleScreenContent.js';

export class TitleScene {
  constructor(game) {
    this.game = game;
    this.sceneId = 'TitleScene';
    this._el = null;
    this._loadoutView = null;
    this._background = null;
    this._loadoutViewPromise = null;
    this._nav = createSceneNavigationGuard();

    this._onMouseMove = null;
    this._onResize = null;
    this._onKeyDown = null;
  }

  enter() {
    this._nav.reset();
    ensureTitleFonts();
    this._buildDOM();
    this._bindEvents();
  }

  update() {}
  render() {}

  exit() {
    window.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('keydown', this._onKeyDown);

    this._background?.destroy();
    this._background = null;

    if (this._el) {
      this._el.remove();
      this._el = null;
    }
    this._loadoutView?.destroy();
    this._loadoutView = null;
  }

  _buildDOM() {
    ensureTitleStyles();

    this._el = document.createElement('div');
    this._el.id = 'title-screen';
    this._el.innerHTML = TITLE_SCREEN_HTML;

    document.getElementById('ui-container').appendChild(this._el);
    this._initBackground();
  }

  async _initBackground() {
    const { TitleBackgroundRenderer } = await import('./title/TitleBackgroundRenderer.js');
    if (!this._el) return;
    this._background = new TitleBackgroundRenderer(
      this._el.querySelector('#title-bg-canvas'),
    );
    this._background.start();
  }

  _bindEvents() {
    const liveEl = this._el.querySelector('#title-live');
    const flashEl = this._el.querySelector('#title-flash');

    const pulseFlash = () => {
      if (!flashEl) return;
      flashEl.style.background = 'rgba(255, 242, 216, 0.12)';
      setTimeout(() => {
        if (flashEl) {
          flashEl.style.background = 'rgba(255, 242, 216, 0)';
        }
      }, 260);
    };

    const setMessage = (text) => {
      if (liveEl) {
        liveEl.textContent = text;
      }
    };

    const startGame = () => {
      pulseFlash();
      setMessage('시작 무기 선택 중…');
      this._openStartLoadout({ setMessage, pulseFlash });
    };

    const attemptQuit = () => {
      pulseFlash();
      setMessage('게임을 종료하는 중…');

      const showBlockedMessage = () => {
        setMessage('브라우저가 종료를 차단했습니다. 탭 또는 창을 직접 닫아주세요.');
      };

      try {
        window.close();
      } catch (error) {
        console.warn('[TitleScene] 창 종료 시도 실패:', error);
        showBlockedMessage();
        return;
      }

      window.setTimeout(() => {
        if (!window.closed) {
          showBlockedMessage();
        }
      }, 180);
    };

    this._el.querySelectorAll('[data-action]').forEach((button) => {
      button.addEventListener('click', () => {
        const action = button.dataset.action;
        if (action === 'start') {
          startGame();
          return;
        }
        if (action === 'shop') {
          this._nav.change(() => {
            this.game.sceneManager.changeScene(new MetaShopScene(this.game));
          });
          return;
        }
        if (action === 'codex') {
          this._nav.load(() => import('./CodexScene.js'), ({ CodexScene }) => {
            this.game.sceneManager.changeScene(new CodexScene(this.game, 'title'));
          }, (error) => console.error('[TitleScene] CodexScene 로드 실패:', error));
          return;
        }
        if (action === 'settings') {
          this._nav.load(() => import('./SettingsScene.js'), ({ SettingsScene }) => {
            this.game.sceneManager.changeScene(new SettingsScene(this.game));
          }, (error) => console.error('[TitleScene] SettingsScene 로드 실패:', error));
          return;
        }
        if (action === 'quit') {
          attemptQuit();
        }
      });
    });

    this._onKeyDown = (event) => {
      if (event.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return;
      if (event.code === 'Enter' || event.code === 'Space') {
        event.preventDefault();
        startGame();
      }
    };
    window.addEventListener('keydown', this._onKeyDown);

    this._onMouseMove = (event) => {
      this._background?.setPointer(event.clientX, event.clientY);
    };
    window.addEventListener('mousemove', this._onMouseMove, { passive: true });

    this._onResize = () => {
      this._background?.resize();
    };
    window.addEventListener('resize', this._onResize);
  }

  async _ensureLoadoutView() {
    if (this._loadoutView) return this._loadoutView;
    if (!this._loadoutViewPromise) {
      this._loadoutViewPromise = import('../ui/title/StartLoadoutView.js').then(({ StartLoadoutView }) => {
        if (!this._el) return null;
        this._loadoutView = new StartLoadoutView(this._el);
        return this._loadoutView;
      });
    }
    return this._loadoutViewPromise;
  }

  async _openStartLoadout({ setMessage, pulseFlash }) {
    const loadoutView = await this._ensureLoadoutView();
    if (!loadoutView) return;
    const loadoutConfig = buildTitleLoadoutConfig(this.game.gameData, this.game.session, {
      onCancel: () => {
        setMessage('게임 시작 입력을 기다리는 중입니다.');
      },
      onStart: (weaponId) => {
        setSelectedStartWeaponAndSave(this.game.session, weaponId);
        pulseFlash();
        setMessage('씬 전환 중…');
        setTimeout(() => {
          this.game.sceneManager.changeScene(new PlayScene(this.game));
        }, 120);
      },
    });

    loadoutView.show(loadoutConfig);
  }
}
