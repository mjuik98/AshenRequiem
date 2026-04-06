import { createTitleLoadoutApplicationService } from './titleLoadoutApplicationService.js';
import { buildTitleLoadoutConfig } from './titleLoadoutQueryService.js';

const TITLE_LOADOUT_UNAVAILABLE_MESSAGE = '시작 가능한 기본 무기가 없습니다.';
const TITLE_LOADOUT_IDLE_MESSAGE = '게임 시작 입력을 기다리는 중입니다.';
const TITLE_LOADOUT_TRANSITION_MESSAGE = '씬 전환 중…';

function resolveNextScene(nextScene, changeScene) {
  if (nextScene && typeof nextScene.then === 'function') {
    void nextScene.then((resolvedScene) => {
      changeScene(resolvedScene);
    });
    return;
  }
  changeScene(nextScene);
}

export function createTitleLoadoutSceneApplicationService({
  game,
  setMessage = () => {},
  pulseFlash = () => {},
  changeScene = () => {},
  buildTitleLoadoutConfigImpl = buildTitleLoadoutConfig,
  createTitleLoadoutServiceImpl = null,
  createPlaySceneImpl = (nextGame) => nextGame?.sceneFactory?.createPlayScene?.(nextGame) ?? null,
  setTimeoutFn = globalThis.setTimeout,
} = {}) {
  const resolvedCreateTitleLoadoutService = createTitleLoadoutServiceImpl
    ?? ((nextGame) => createTitleLoadoutApplicationService(nextGame, {
      createPlaySceneImpl,
    }));

  function showUnavailableMessage() {
    setMessage(TITLE_LOADOUT_UNAVAILABLE_MESSAGE);
  }

  function buildViewConfig() {
    let loadoutConfig = null;

    loadoutConfig = buildTitleLoadoutConfigImpl(game?.gameData, game?.session, {
      onCancel: () => {
        setMessage(TITLE_LOADOUT_IDLE_MESSAGE);
      },
      onStart: (weaponId, runOptions) => {
        if (!loadoutConfig?.canStart || !weaponId) {
          showUnavailableMessage();
          return;
        }

        const titleLoadoutService = resolvedCreateTitleLoadoutService(game);
        const startResult = titleLoadoutService.startRun(weaponId, runOptions);
        if (!startResult?.saved) {
          showUnavailableMessage();
          return;
        }

        pulseFlash();
        setMessage(TITLE_LOADOUT_TRANSITION_MESSAGE);
        setTimeoutFn(() => {
          resolveNextScene(startResult.nextScene, changeScene);
        }, 120);
      },
    });

    return loadoutConfig;
  }

  function showLoadoutView(loadoutView) {
    if (!loadoutView) return null;
    const loadoutConfig = buildViewConfig();
    if (!loadoutConfig?.canStart) {
      showUnavailableMessage();
    }
    loadoutView.show(loadoutConfig);
    return loadoutConfig;
  }

  return {
    buildViewConfig,
    showLoadoutView,
  };
}
