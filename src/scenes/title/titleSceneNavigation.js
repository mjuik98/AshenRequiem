import { logRuntimeError, logRuntimeWarn } from '../../utils/runtimeLogger.js';
import { resolveTitleSceneRuntimeTarget } from './titleSceneRuntimeState.js';

function isStartLoadoutOpen(scene) {
  const runtimeTarget = resolveTitleSceneRuntimeTarget(scene);
  const loadoutEl = runtimeTarget?.loadoutView?._el;
  return Boolean(loadoutEl && loadoutEl.style?.display !== 'none');
}

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
  createMetaShopSceneImpl = (game) => scene?.game?.sceneFactory?.createMetaShopScene?.(game) ?? null,
  createCodexSceneImpl = (game, from = 'title') => scene?.game?.sceneFactory?.createCodexScene?.(game, from) ?? null,
  createSettingsSceneImpl = (game) => scene?.game?.sceneFactory?.createSettingsScene?.(game) ?? null,
} = {}) {
  const runtimeTarget = resolveTitleSceneRuntimeTarget(scene);
  if (isStartLoadoutOpen(scene)) {
    return false;
  }

  if (action === 'start') {
    pulseFlash();
    setMessage('시작 무기 선택 중…');
    return openTitleStartLoadoutImpl(scene, { setMessage, pulseFlash });
  }

  if (action === 'shop') {
    return runtimeTarget.nav?.change(async () => {
      const nextScene = await createMetaShopSceneImpl(scene.game);
      scene.game.sceneManager.changeScene(nextScene);
    });
  }

  if (action === 'codex') {
    return runtimeTarget.nav?.change(async () => {
      const nextScene = await createCodexSceneImpl(scene.game, 'title');
      scene.game.sceneManager.changeScene(nextScene);
    }, (error) => {
      reportTitleLoadFailure('Codex', error, setMessage);
      logRuntimeError('TitleScene', 'CodexScene 로드 실패:', error);
    });
  }

  if (action === 'settings') {
    return runtimeTarget.nav?.change(async () => {
      const nextScene = await createSettingsSceneImpl(scene.game);
      scene.game.sceneManager.changeScene(nextScene);
    }, (error) => {
      reportTitleLoadFailure('설정', error, setMessage);
      logRuntimeError('TitleScene', 'SettingsScene 로드 실패:', error);
    });
  }

  if (action === 'quit') {
    pulseFlash();
    return attemptWindowCloseImpl({
      windowRef,
      setMessage,
      onError: (error) => {
        logRuntimeWarn('TitleScene', '창 종료 시도 실패:', error);
      },
    });
  }

  return false;
}

export function bindTitleActionButtons(scene, {
  pulseFlash,
  setMessage,
  windowRef = window,
  attemptWindowCloseImpl,
  openTitleStartLoadoutImpl,
  createMetaShopSceneImpl = (game) => scene?.game?.sceneFactory?.createMetaShopScene?.(game) ?? null,
  createCodexSceneImpl = (game, from = 'title') => scene?.game?.sceneFactory?.createCodexScene?.(game, from) ?? null,
  createSettingsSceneImpl = (game) => scene?.game?.sceneFactory?.createSettingsScene?.(game) ?? null,
} = {}) {
  const runtimeTarget = resolveTitleSceneRuntimeTarget(scene);
  const root = runtimeTarget.root;
  if (!root?.addEventListener) return;

  root.addEventListener('click', (event) => {
    const target = event?.target?.closest?.('[data-action]') ?? event?.target;
    if (!root.contains?.(target) || !target?.dataset?.action) return;
    runTitleAction(target.dataset.action, scene, {
      pulseFlash,
      setMessage,
      windowRef,
      attemptWindowCloseImpl,
      openTitleStartLoadoutImpl,
      createMetaShopSceneImpl,
      createCodexSceneImpl,
      createSettingsSceneImpl,
    });
  });
}
