import { logRuntimeError, logRuntimeWarn } from '../../utils/runtimeLogger.js';
import { buildModuleLoadFailureMessage } from '../../utils/runtimeIssue.js';

function defaultChangeWithGuard(commit, onError = null) {
  return Promise.resolve()
    .then(() => commit())
    .catch((error) => {
      onError?.(error);
      return false;
    });
}

function reportTitleLoadFailure(
  label,
  error,
  setMessage,
  {
    buildModuleLoadFailureMessageImpl = buildModuleLoadFailureMessage,
    logRuntimeErrorImpl = logRuntimeError,
  } = {},
) {
  setMessage(buildModuleLoadFailureMessageImpl(label, error));
  logRuntimeErrorImpl('TitleScene', `${label}Scene 로드 실패:`, error);
}

export function createTitleSceneApplicationService({
  pulseFlash = () => {},
  setMessage = () => {},
  changeScene = () => {},
  changeWithGuard = defaultChangeWithGuard,
  isStartLoadoutOpen = () => false,
  openStartLoadout = () => null,
  createMetaShopScene = async () => null,
  createCodexScene = async () => null,
  createSettingsScene = async () => null,
  attemptWindowClose = () => null,
  windowRef = globalThis.window,
  buildModuleLoadFailureMessageImpl = buildModuleLoadFailureMessage,
  logRuntimeErrorImpl = logRuntimeError,
  logRuntimeWarnImpl = logRuntimeWarn,
} = {}) {
  async function runAction(action) {
    if (isStartLoadoutOpen()) {
      return false;
    }

    if (action === 'start') {
      pulseFlash();
      setMessage('시작 무기 선택 중…');
      return openStartLoadout({ setMessage, pulseFlash });
    }

    if (action === 'shop') {
      return changeWithGuard(async () => {
        const nextScene = await createMetaShopScene();
        changeScene(nextScene);
      });
    }

    if (action === 'codex') {
      return changeWithGuard(async () => {
        const nextScene = await createCodexScene();
        changeScene(nextScene);
      }, (error) => {
        reportTitleLoadFailure('Codex', error, setMessage, {
          buildModuleLoadFailureMessageImpl,
          logRuntimeErrorImpl,
        });
      });
    }

    if (action === 'settings') {
      return changeWithGuard(async () => {
        const nextScene = await createSettingsScene();
        changeScene(nextScene);
      }, (error) => {
        reportTitleLoadFailure('설정', error, setMessage, {
          buildModuleLoadFailureMessageImpl,
          logRuntimeErrorImpl,
        });
      });
    }

    if (action === 'quit') {
      pulseFlash();
      return attemptWindowClose({
        windowRef,
        setMessage,
        onError: (error) => {
          logRuntimeWarnImpl('TitleScene', '창 종료 시도 실패:', error);
        },
      });
    }

    return false;
  }

  return {
    runAction,
    startGame() {
      return runAction('start');
    },
  };
}
