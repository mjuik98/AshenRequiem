import { createTitleLoadoutApplicationService } from '../../app/title/titleLoadoutApplicationService.js';
import { buildTitleLoadoutConfig } from './titleLoadout.js';
import { resolveTitleSceneRuntimeTarget } from './titleSceneRuntimeState.js';

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
  buildTitleLoadoutConfigImpl = buildTitleLoadoutConfig,
  ensureTitleLoadoutViewImpl = ensureTitleLoadoutView,
  createTitleLoadoutServiceImpl = null,
  createPlaySceneImpl = null,
  setTimeoutFn = globalThis.setTimeout,
} = {}) {
  const resolvedCreatePlayScene = createPlaySceneImpl
    ?? ((game) => scene?.game?.sceneFactory?.createPlayScene?.(game) ?? null);
  const resolvedCreateTitleLoadoutService = createTitleLoadoutServiceImpl
    ?? ((game) => createTitleLoadoutApplicationService(game, {
      createPlaySceneImpl: resolvedCreatePlayScene,
    }));
  const loadoutView = await ensureTitleLoadoutViewImpl(scene);
  if (!loadoutView) return null;
  const loadoutConfig = buildTitleLoadoutConfigImpl(scene.game.gameData, scene.game.session, {
    onCancel: () => {
      setMessage('게임 시작 입력을 기다리는 중입니다.');
    },
    onStart: (weaponId, runOptions) => {
      if (!loadoutConfig.canStart || !weaponId) {
        setMessage('시작 가능한 기본 무기가 없습니다.');
        return;
      }

      const titleLoadoutService = resolvedCreateTitleLoadoutService(scene.game);
      const startResult = titleLoadoutService.startRun(weaponId, runOptions);
      if (!startResult?.saved) {
        setMessage('시작 가능한 기본 무기가 없습니다.');
        return;
      }

      pulseFlash();
      setMessage('씬 전환 중…');
      setTimeoutFn(() => {
        const nextScene = startResult.nextScene;
        if (nextScene && typeof nextScene.then === 'function') {
          void nextScene.then((resolvedScene) => {
            scene.game.sceneManager.changeScene(resolvedScene);
          });
          return;
        }
        scene.game.sceneManager.changeScene(nextScene);
      }, 120);
    },
  });

  if (!loadoutConfig.canStart) {
    setMessage('시작 가능한 기본 무기가 없습니다.');
  }

  loadoutView.show(loadoutConfig);
  return loadoutConfig;
}
