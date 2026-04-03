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
import { resolveTitleSceneRuntimeTarget } from './titleSceneRuntimeState.js';
import {
  ensureTitleStyles,
  TITLE_SCREEN_HTML,
} from './titleScreenContent.js';
import {
  resetTitleSceneShellState,
  syncTitleSceneShellState,
} from './titleSceneShell.js';

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
  const runtimeTarget = resolveTitleSceneRuntimeTarget(scene);
  syncTitleSceneShellState(runtimeTarget, {
    documentRef,
    titleScreenHtml,
  });
  initBackgroundImpl(scene);
  return runtimeTarget.root;
}

export async function initTitleSceneBackground(scene, {
  loadTitleBackgroundRenderer = () => import('./TitleBackgroundRenderer.js'),
} = {}) {
  const { TitleBackgroundRenderer } = await loadTitleBackgroundRenderer();
  const runtimeTarget = resolveTitleSceneRuntimeTarget(scene);
  if (!runtimeTarget.root) return null;
  runtimeTarget.background = new TitleBackgroundRenderer(
    runtimeTarget.shellRefs?.canvas ?? runtimeTarget.root.querySelector('#title-bg-canvas'),
    {
      host: scene?.game?.runtimeHost ?? globalThis.window ?? globalThis,
    },
  );
  runtimeTarget.background.start();
  return runtimeTarget.background;
}

export function teardownTitleSceneRuntime(scene, {
  windowRef = scene?.game?.runtimeHost ?? window,
} = {}) {
  const runtimeTarget = resolveTitleSceneRuntimeTarget(scene);
  windowRef.removeEventListener('mousemove', runtimeTarget.onMouseMove);
  windowRef.removeEventListener('resize', runtimeTarget.onResize);
  windowRef.removeEventListener('keydown', runtimeTarget.onKeyDown);

  runtimeTarget.background?.destroy();
  runtimeTarget.background = null;

  if (runtimeTarget.root) {
    runtimeTarget.root.remove();
    runtimeTarget.root = null;
  }
  resetTitleSceneShellState(runtimeTarget);
  runtimeTarget.loadoutView?.destroy();
  runtimeTarget.loadoutView = null;
  runtimeTarget.loadoutViewPromise = null;
  runtimeTarget.onMouseMove = null;
  runtimeTarget.onResize = null;
  runtimeTarget.onKeyDown = null;
}

export function bindTitleSceneEvents(scene, {
  windowRef = scene?.game?.runtimeHost ?? window,
  createTitleStatusControllerImpl = createTitleStatusController,
  attemptWindowCloseImpl = attemptWindowClose,
  openTitleStartLoadoutImpl = openTitleStartLoadout,
  createMetaShopSceneImpl = (game) => scene?.game?.sceneFactory?.createMetaShopScene?.(game) ?? null,
  createCodexSceneImpl = (game, from = 'title') => scene?.game?.sceneFactory?.createCodexScene?.(game, from) ?? null,
  createSettingsSceneImpl = (game) => scene?.game?.sceneFactory?.createSettingsScene?.(game) ?? null,
} = {}) {
  const runtimeTarget = resolveTitleSceneRuntimeTarget(scene);
  const liveEl = runtimeTarget.shellRefs?.live ?? runtimeTarget.root?.querySelector('#title-live');
  const flashEl = runtimeTarget.shellRefs?.flash ?? runtimeTarget.root?.querySelector('#title-flash');
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
    createCodexSceneImpl,
    createSettingsSceneImpl,
  });

  bindTitleSceneInput(scene, {
    startGame,
    windowRef,
  });
}
