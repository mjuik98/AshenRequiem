import { createPlayResultApplicationService } from '../../app/play/playResultApplicationService.js';
import { PlayModeStateMachine } from '../../core/PlayModeStateMachine.js';
import { createLevelUpController } from './levelUpController.js';

function defaultDevicePixelRatioReader() {
  return 1;
}

function createEmptyRuntimeState() {
  return {
    ctx: null,
    pipeline: null,
    pipelineCtx: null,
    systems: null,
    ui: null,
    resultHandler: null,
    uiState: null,
    gameData: null,
    levelUpController: null,
    lastUiIssue: null,
    accessibilityRuntime: null,
    devicePixelRatioReader: defaultDevicePixelRatioReader,
  };
}

export function createPlaySceneRuntimeState({
  runtime = null,
  session = null,
  getWorld = () => null,
  isBlocked = () => false,
  showResult = () => {},
} = {}) {
  if (!runtime) return createEmptyRuntimeState();

  const state = {
    ...createEmptyRuntimeState(),
    ctx: runtime.ctx ?? null,
    pipeline: runtime.pipeline ?? null,
    pipelineCtx: runtime.pipelineCtx ?? null,
    systems: runtime.systems ?? null,
    ui: runtime.ui ?? null,
    gameData: runtime.gameData ?? null,
    accessibilityRuntime: runtime.accessibilityRuntime ?? null,
    devicePixelRatioReader: runtime.devicePixelRatioReader ?? defaultDevicePixelRatioReader,
    resultHandler: createPlayResultApplicationService(session, {
      gameData: runtime.gameData ?? null,
    }),
  };

  state.levelUpController = createLevelUpController({
    getWorld,
    getData: () => ({
      ...(state.gameData ?? {}),
      session,
    }),
    isBlocked,
    showLevelUp: (config) => state.ui?.showLevelUp(config),
  });

  state.uiState = new PlayModeStateMachine({
    onLevelUp: () => state.levelUpController?.show(),
    onDead: () => showResult(),
    onResume: () => {
      state.ui?.hidePause();
      state.ui?.hideLevelUp();
    },
  });

  return state;
}

export function getPlaySceneDebugSurface(runtimeState = null) {
  return {
    ui: runtimeState?.ui ?? null,
    gameData: runtimeState?.gameData ?? null,
    levelUpController: runtimeState?.levelUpController ?? null,
    lastUiIssue: runtimeState?.lastUiIssue ?? null,
  };
}

export function disposePlaySceneRuntimeState(runtimeState = null) {
  runtimeState?.ui?.destroy?.();
  runtimeState?.uiState?.reset?.();
  runtimeState?.ctx?.dispose?.();
  return createEmptyRuntimeState();
}
