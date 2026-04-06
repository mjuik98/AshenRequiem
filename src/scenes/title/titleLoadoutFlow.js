import { createTitleLoadoutSceneApplicationService } from '../../app/title/titleLoadoutSceneApplicationService.js';
import { resolveTitleSceneRuntimeTarget } from './titleSceneRuntimeState.js';

export function isTitleStartLoadoutOpen(scene) {
  const runtimeTarget = resolveTitleSceneRuntimeTarget(scene);
  const loadoutView = runtimeTarget?.loadoutView;
  if (typeof loadoutView?.isVisible === 'function') {
    return Boolean(loadoutView.isVisible());
  }
  const loadoutEl = loadoutView?._el;
  return Boolean(loadoutEl && loadoutEl.style?.display !== 'none');
}

export async function ensureTitleLoadoutView(scene, {
  loadStartLoadoutView = () => import('../../ui/title/StartLoadoutView.js'),
} = {}) {
  const runtimeTarget = resolveTitleSceneRuntimeTarget(scene);
  if (runtimeTarget.loadoutView) return runtimeTarget.loadoutView;
  if (!runtimeTarget.loadoutViewPromise) {
    runtimeTarget.loadoutViewPromise = loadStartLoadoutView().then(({ StartLoadoutView }) => {
      if (!runtimeTarget.root) return null;
      runtimeTarget.loadoutView = new StartLoadoutView(runtimeTarget.root);
      return runtimeTarget.loadoutView;
    });
  }
  return runtimeTarget.loadoutViewPromise;
}

export async function openTitleStartLoadout(scene, {
  setMessage,
  pulseFlash,
  ensureTitleLoadoutViewImpl = ensureTitleLoadoutView,
  createTitleLoadoutSceneServiceImpl = createTitleLoadoutSceneApplicationService,
  buildTitleLoadoutConfigImpl,
  createTitleLoadoutServiceImpl = null,
  createPlaySceneImpl = null,
  setTimeoutFn = globalThis.setTimeout,
} = {}) {
  const loadoutView = await ensureTitleLoadoutViewImpl(scene);
  if (!loadoutView) return null;
  const titleLoadoutSceneService = createTitleLoadoutSceneServiceImpl({
    game: scene?.game,
    setMessage,
    pulseFlash,
    changeScene: (nextScene) => {
      scene?.game?.sceneManager?.changeScene(nextScene);
    },
    buildTitleLoadoutConfigImpl,
    createTitleLoadoutServiceImpl,
    createPlaySceneImpl: createPlaySceneImpl
      ?? ((game) => scene?.game?.sceneFactory?.createPlayScene?.(game) ?? null),
    setTimeoutFn,
  });

  return titleLoadoutSceneService.showLoadoutView(loadoutView);
}
