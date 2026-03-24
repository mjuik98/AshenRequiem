import {
  loadCodexSceneModule,
  loadSettingsSceneModule,
} from '../sceneLoaders.js';

export function runTitleAction(action, scene, {
  pulseFlash,
  setMessage,
  windowRef = window,
  attemptWindowCloseImpl,
  openTitleStartLoadoutImpl,
  createMetaShopSceneImpl,
  loadCodexScene = loadCodexSceneModule,
  loadSettingsScene = loadSettingsSceneModule,
} = {}) {
  if (action === 'start') {
    pulseFlash();
    setMessage('시작 무기 선택 중…');
    openTitleStartLoadoutImpl(scene, { setMessage, pulseFlash });
    return;
  }

  if (action === 'shop') {
    scene._nav.change(async () => {
      const nextScene = await createMetaShopSceneImpl(scene.game);
      scene.game.sceneManager.changeScene(nextScene);
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
    pulseFlash();
    attemptWindowCloseImpl({
      windowRef,
      setMessage,
      onError: (error) => {
        console.warn('[TitleScene] 창 종료 시도 실패:', error);
      },
    });
  }
}

export function bindTitleActionButtons(scene, {
  pulseFlash,
  setMessage,
  windowRef = window,
  attemptWindowCloseImpl,
  openTitleStartLoadoutImpl,
  createMetaShopSceneImpl,
  loadCodexScene = loadCodexSceneModule,
  loadSettingsScene = loadSettingsSceneModule,
} = {}) {
  scene._el?.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', () => {
      runTitleAction(button.dataset.action, scene, {
        pulseFlash,
        setMessage,
        windowRef,
        attemptWindowCloseImpl,
        openTitleStartLoadoutImpl,
        createMetaShopSceneImpl,
        loadCodexScene,
        loadSettingsScene,
      });
    });
  });
}
