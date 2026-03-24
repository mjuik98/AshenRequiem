import { setSelectedStartWeaponAndSave } from '../../state/sessionFacade.js';
import { loadPlaySceneModule } from '../sceneLoaders.js';
import { buildTitleLoadoutConfig } from './titleLoadout.js';

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
  createPlaySceneImpl = async (game) => {
    const { PlayScene } = await loadPlaySceneModule();
    return new PlayScene(game);
  },
  setTimeoutFn = globalThis.setTimeout,
} = {}) {
  const loadoutView = await ensureTitleLoadoutViewImpl(scene);
  if (!loadoutView) return null;
  const loadoutConfig = buildTitleLoadoutConfigImpl(scene.game.gameData, scene.game.session, {
    onCancel: () => {
      setMessage('게임 시작 입력을 기다리는 중입니다.');
    },
    onStart: (weaponId) => {
      if (!loadoutConfig.canStart || !weaponId) {
        setMessage('시작 가능한 기본 무기가 없습니다.');
        return;
      }

      const saveResult = setSelectedStartWeaponAndSaveImpl(scene.game.session, weaponId, scene.game.gameData);
      if (!saveResult?.saved) {
        setMessage('시작 가능한 기본 무기가 없습니다.');
        return;
      }

      pulseFlash();
      setMessage('씬 전환 중…');
      setTimeoutFn(() => {
        const nextScene = createPlaySceneImpl(scene.game);
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
