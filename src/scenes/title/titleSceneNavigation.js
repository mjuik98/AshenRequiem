import {
  loadCodexSceneModule,
  loadSettingsSceneModule,
} from '../sceneLoaders.js';
import { logRuntimeError, logRuntimeWarn } from '../../utils/runtimeLogger.js';

function formatTitleLoadFailureMessage(label, error) {
  const errorText = String(error?.message ?? error ?? '');
  if (errorText.includes('Failed to fetch dynamically imported module')) {
    return `${label} 화면을 불러오지 못했습니다. 개발 서버가 중지되었을 수 있습니다. 서버를 다시 켜고 새로고침한 뒤 다시 시도해주세요.`;
  }
  return `${label} 화면을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.`;
}

function reportTitleLoadFailure(label, error, setMessage) {
  setMessage(formatTitleLoadFailureMessage(label, error));
}

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
    }, (error) => {
      reportTitleLoadFailure('Codex', error, setMessage);
      logRuntimeError('TitleScene', 'CodexScene 로드 실패:', error);
    });
    return;
  }

  if (action === 'settings') {
    scene._nav.load(loadSettingsScene, ({ SettingsScene }) => {
      scene.game.sceneManager.changeScene(new SettingsScene(scene.game));
    }, (error) => {
      reportTitleLoadFailure('설정', error, setMessage);
      logRuntimeError('TitleScene', 'SettingsScene 로드 실패:', error);
    });
    return;
  }

  if (action === 'quit') {
    pulseFlash();
    attemptWindowCloseImpl({
      windowRef,
      setMessage,
      onError: (error) => {
        logRuntimeWarn('TitleScene', '창 종료 시도 실패:', error);
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
