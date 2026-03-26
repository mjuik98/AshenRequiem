import { GameConfig } from '../../core/GameConfig.js';
import { transitionPlayMode, PlayMode } from '../../state/PlayMode.js';
import { getEffectiveDevicePixelRatio } from '../../state/sessionOptions.js';
import { updateSessionOptionsAndSave } from '../../state/sessionFacade.js';
import {
  createPauseOverlayConfig,
  createResultSceneActions,
} from '../../scenes/play/playSceneOverlays.js';

export function syncPlaySceneDevicePixelRatio({
  sessionOptions,
  currentDpr,
  devicePixelRatio = 1,
  defaultUseDevicePixelRatio = GameConfig.useDevicePixelRatio,
  resolveDevicePixelRatio = getEffectiveDevicePixelRatio,
} = {}) {
  const dpr = resolveDevicePixelRatio(
    sessionOptions,
    devicePixelRatio,
    defaultUseDevicePixelRatio,
  );
  return { dpr, changed: dpr !== currentDpr };
}

export function runPlaySceneFrame({
  world,
  pipeline,
  pipelineCtx,
  ui,
  dt,
  dpr,
}) {
  if (!world || !pipeline || !pipelineCtx) return false;
  world.runtime.deltaTime = dt;
  pipelineCtx.dt = dt;
  pipelineCtx.dpr = dpr;
  pipeline.run(pipelineCtx);
  ui?.update?.(world);
  return true;
}

export function togglePlayScenePause({
  world,
  ui,
  data,
  session,
  isBlocked = () => false,
  onOptionsChange,
  transition = transitionPlayMode,
}) {
  if (!world || isBlocked()) return false;

  if (world.run.playMode === PlayMode.PLAYING) {
    transition(world, PlayMode.PAUSED);
    ui?.showPause?.(createPauseOverlayConfig({
      world,
      data,
      session,
      isBlocked,
      transitionPlayMode: transition,
      hidePause: () => ui?.hidePause?.(),
      onOptionsChange,
    }));
    return 'paused';
  }

  if (world.run.playMode === PlayMode.PAUSED) {
    transition(world, PlayMode.PLAYING);
    ui?.hidePause?.();
    return 'resumed';
  }

  return false;
}

export function persistPauseSceneOptions(
  session,
  nextOptions,
  {
    updateSessionOptions = updateSessionOptionsAndSave,
    applyRuntimeOptions = null,
  } = {},
) {
  if (!session) return null;
  const mergedOptions = updateSessionOptions(session, nextOptions);
  applyRuntimeOptions?.(mergedOptions);
  return mergedOptions;
}

export function showPlaySceneResult({
  world,
  resultHandler,
  ui,
  isBlocked = () => false,
  setBlocked = () => {},
  restart,
  goToTitle,
}) {
  if (isBlocked()) return null;
  const stats = resultHandler?.process?.(world) ?? null;
  const actions = createResultSceneActions({
    isBlocked,
    setBlocked,
    restart,
    goToTitle,
  });
  ui?.showResult?.(stats, actions.onRestart, actions.onTitle);
  return stats;
}
