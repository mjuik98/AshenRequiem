import { PlayScene } from '../PlayScene.js';
import { MetaShopScene } from '../MetaShopScene.js';
import { setSelectedStartWeaponAndSave } from '../../state/sessionFacade.js';
import { buildTitleLoadoutConfig } from './titleLoadout.js';
import {
  attemptWindowClose,
  createTitleStatusController,
} from './titleSceneStatus.js';
import {
  ensureTitleStyles,
  TITLE_SCREEN_HTML,
} from './titleScreenContent.js';

export function buildTitleSceneDom(scene, {
  documentRef = document,
  ensureTitleStylesImpl = ensureTitleStyles,
  titleScreenHtml = TITLE_SCREEN_HTML,
  initBackgroundImpl = initTitleSceneBackground,
} = {}) {
  ensureTitleStylesImpl();

  scene._el = documentRef.createElement('div');
  scene._el.id = 'title-screen';
  scene._el.innerHTML = titleScreenHtml;

  documentRef.getElementById('ui-container')?.appendChild(scene._el);
  initBackgroundImpl(scene);
  return scene._el;
}

export async function initTitleSceneBackground(scene, {
  loadTitleBackgroundRenderer = () => import('./TitleBackgroundRenderer.js'),
} = {}) {
  const { TitleBackgroundRenderer } = await loadTitleBackgroundRenderer();
  if (!scene._el) return null;
  scene._background = new TitleBackgroundRenderer(
    scene._el.querySelector('#title-bg-canvas'),
  );
  scene._background.start();
  return scene._background;
}

export function teardownTitleSceneRuntime(scene, {
  windowRef = window,
} = {}) {
  windowRef.removeEventListener('mousemove', scene._onMouseMove);
  windowRef.removeEventListener('resize', scene._onResize);
  windowRef.removeEventListener('keydown', scene._onKeyDown);

  scene._background?.destroy();
  scene._background = null;

  if (scene._el) {
    scene._el.remove();
    scene._el = null;
  }
  scene._loadoutView?.destroy();
  scene._loadoutView = null;
}

export async function ensureTitleLoadoutView(scene, {
  loadStartLoadoutView = () => import('../../ui/title/StartLoadoutView.js'),
} = {}) {
  if (scene._loadoutView) return scene._loadoutView;
  if (!scene._loadoutViewPromise) {
    scene._loadoutViewPromise = loadStartLoadoutView().then(({ StartLoadoutView }) => {
      if (!scene._el) return null;
      scene._loadoutView = new StartLoadoutView(scene._el);
      return scene._loadoutView;
    });
  }
  return scene._loadoutViewPromise;
}

export async function openTitleStartLoadout(scene, {
  setMessage,
  pulseFlash,
  buildTitleLoadoutConfigImpl = buildTitleLoadoutConfig,
  ensureTitleLoadoutViewImpl = ensureTitleLoadoutView,
  setSelectedStartWeaponAndSaveImpl = setSelectedStartWeaponAndSave,
  createPlaySceneImpl = (game) => new PlayScene(game),
  setTimeoutFn = globalThis.setTimeout,
} = {}) {
  const loadoutView = await ensureTitleLoadoutViewImpl(scene);
  if (!loadoutView) return null;
  const loadoutConfig = buildTitleLoadoutConfigImpl(scene.game.gameData, scene.game.session, {
    onCancel: () => {
      setMessage('게임 시작 입력을 기다리는 중입니다.');
    },
    onStart: (weaponId) => {
      setSelectedStartWeaponAndSaveImpl(scene.game.session, weaponId);
      pulseFlash();
      setMessage('씬 전환 중…');
      setTimeoutFn(() => {
        scene.game.sceneManager.changeScene(createPlaySceneImpl(scene.game));
      }, 120);
    },
  });

  loadoutView.show(loadoutConfig);
  return loadoutConfig;
}

export function bindTitleSceneEvents(scene, {
  windowRef = window,
  createTitleStatusControllerImpl = createTitleStatusController,
  attemptWindowCloseImpl = attemptWindowClose,
  openTitleStartLoadoutImpl = openTitleStartLoadout,
  createMetaShopSceneImpl = (game) => new MetaShopScene(game),
  loadCodexScene = () => import('../CodexScene.js'),
  loadSettingsScene = () => import('../SettingsScene.js'),
} = {}) {
  const liveEl = scene._el?.querySelector('#title-live');
  const flashEl = scene._el?.querySelector('#title-flash');
  const { pulseFlash, setMessage } = createTitleStatusControllerImpl(liveEl, flashEl);

  const startGame = () => {
    pulseFlash();
    setMessage('시작 무기 선택 중…');
    openTitleStartLoadoutImpl(scene, { setMessage, pulseFlash });
  };

  const attemptQuit = () => {
    pulseFlash();
    attemptWindowCloseImpl({
      windowRef,
      setMessage,
      onError: (error) => {
        console.warn('[TitleScene] 창 종료 시도 실패:', error);
      },
    });
  };

  scene._el?.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.action;
      if (action === 'start') {
        startGame();
        return;
      }
      if (action === 'shop') {
        scene._nav.change(() => {
          scene.game.sceneManager.changeScene(createMetaShopSceneImpl(scene.game));
        });
        return;
      }
      if (action === 'codex') {
        scene._nav.load(loadCodexScene, ({ CodexScene }) => {
          scene.game.sceneManager.changeScene(new CodexScene(scene.game, 'title'));
        }, (error) => console.error('[TitleScene] CodexScene 로드 실패:', error));
        return;
      }
      if (action === 'settings') {
        scene._nav.load(loadSettingsScene, ({ SettingsScene }) => {
          scene.game.sceneManager.changeScene(new SettingsScene(scene.game));
        }, (error) => console.error('[TitleScene] SettingsScene 로드 실패:', error));
        return;
      }
      if (action === 'quit') {
        attemptQuit();
      }
    });
  });

  scene._onKeyDown = (event) => {
    if (event.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return;
    if (event.code === 'Enter' || event.code === 'Space') {
      event.preventDefault();
      startGame();
    }
  };
  windowRef.addEventListener('keydown', scene._onKeyDown);

  scene._onMouseMove = (event) => {
    scene._background?.setPointer(event.clientX, event.clientY);
  };
  windowRef.addEventListener('mousemove', scene._onMouseMove, { passive: true });

  scene._onResize = () => {
    scene._background?.resize();
  };
  windowRef.addEventListener('resize', scene._onResize);
}
