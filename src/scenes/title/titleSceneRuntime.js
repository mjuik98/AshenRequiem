import {
  loadCodexSceneModule,
  loadMetaShopSceneModule,
  loadSettingsSceneModule,
} from '../sceneLoaders.js';
import {
  ensureTitleLoadoutView,
  openTitleStartLoadout,
} from './titleLoadoutFlow.js';
import { bindTitleSceneInput } from './titleSceneInput.js';
import { bindTitleActionButtons } from './titleSceneNavigation.js';
import {
  attemptWindowClose,
  createTitleStatusController,
} from './titleSceneStatus.js';
import {
  ensureTitleStyles,
  TITLE_SCREEN_HTML,
} from './titleScreenContent.js';

export {
  ensureTitleLoadoutView,
  openTitleStartLoadout,
};

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

export function bindTitleSceneEvents(scene, {
  windowRef = window,
  createTitleStatusControllerImpl = createTitleStatusController,
  attemptWindowCloseImpl = attemptWindowClose,
  openTitleStartLoadoutImpl = openTitleStartLoadout,
  createMetaShopSceneImpl = async (game) => {
    const { MetaShopScene } = await loadMetaShopSceneModule();
    return new MetaShopScene(game);
  },
  loadCodexScene = loadCodexSceneModule,
  loadSettingsScene = loadSettingsSceneModule,
} = {}) {
  const liveEl = scene._el?.querySelector('#title-live');
  const flashEl = scene._el?.querySelector('#title-flash');
  const { pulseFlash, setMessage } = createTitleStatusControllerImpl(liveEl, flashEl);

  const startGame = () => {
    pulseFlash();
    setMessage('시작 무기 선택 중…');
    openTitleStartLoadoutImpl(scene, { setMessage, pulseFlash });
  };

  bindTitleActionButtons(scene, {
    pulseFlash,
    setMessage,
    windowRef,
    attemptWindowCloseImpl,
    openTitleStartLoadoutImpl,
    createMetaShopSceneImpl,
    loadCodexScene,
    loadSettingsScene,
  });

  bindTitleSceneInput(scene, {
    startGame,
    windowRef,
  });
}
