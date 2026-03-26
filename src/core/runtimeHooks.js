import { hasRuntimeQueryFlag } from '../adapters/browser/runtimeEnv.js';

function getHookHost() {
  return typeof globalThis !== 'undefined' ? globalThis : null;
}

function shouldEnableRuntimeHooks(options = {}, host = getHookHost()) {
  if (options.enabled === true) return true;
  if (options.enabled === false) return false;
  if (!host) return false;
  if (host.__ASHEN_DEBUG_RUNTIME__ === true) return true;
  return hasRuntimeQueryFlag('debugRuntime', host);
}

function getSceneName(scene) {
  return scene?.sceneId ?? scene?.constructor?.name ?? 'UnknownScene';
}

function buildSnapshot(game) {
  const scene = game?.sceneManager?.currentScene ?? null;
  const world = scene?.world ?? null;
  const ui = scene?._ui ?? null;

  if (!scene) {
    return { scene: 'none' };
  }

  if (!world) {
    return { scene: getSceneName(scene) };
  }

  return {
    scene: getSceneName(scene),
    playMode: world.run.playMode ?? null,
    elapsedTime: world.run.elapsedTime ?? 0,
    killCount: world.run.killCount ?? 0,
    runCurrencyEarned: world.run.runCurrencyEarned ?? 0,
    player: world.entities.player
      ? {
          hp: world.entities.player.hp ?? 0,
          maxHp: world.entities.player.maxHp ?? 0,
          level: world.entities.player.level ?? 1,
          weapons: (world.entities.player.weapons ?? []).map((weapon) => weapon.id),
          accessories: (world.entities.player.accessories ?? []).map((accessory) => accessory.id),
        }
      : null,
    rerollsRemaining: world.progression.runRerollsRemaining ?? null,
    banishesRemaining: world.progression.runBanishesRemaining ?? null,
    pendingLevelUpChoices: (world.progression.pendingLevelUpChoices ?? []).map((choice) => choice?.id).filter(Boolean),
    ui: {
      pauseVisible: ui?.isPaused?.() ?? false,
      levelUpVisible: ui?.isLevelUpVisible?.() ?? false,
      resultVisible: ui?.isResultVisible?.() ?? false,
    },
  };
}

function openPauseOverlay(game) {
  const scene = game?.sceneManager?.currentScene ?? null;
  const ui = scene?._ui ?? null;
  const world = scene?.world ?? null;
  if (!ui?.showPause || !world) return false;

  ui.showPause({
    player: world.entities.player,
    data: scene?._gameData ?? game?.gameData ?? {},
    world,
    session: game?.session ?? null,
    onResume: null,
    onForfeit: null,
    onOptionsChange: null,
  });

  return ui?.isPaused?.() ?? true;
}

function openResultOverlay(game, overrides = {}) {
  const scene = game?.sceneManager?.currentScene ?? null;
  const ui = scene?._ui ?? null;
  const world = scene?.world ?? null;
  if (!ui?.showResult || !world) return false;

  ui.showResult({
    survivalTime: world.run.elapsedTime ?? 0,
    level: world.entities.player?.level ?? 1,
    killCount: world.run.killCount ?? 0,
    outcome: world.run.runOutcome?.type ?? 'defeat',
    currencyEarned: overrides.currencyEarned ?? 0,
    totalCurrency: overrides.totalCurrency ?? game?.session?.meta?.currency ?? 0,
    ...overrides,
  }, overrides.onRestart ?? (() => {}), overrides.onTitle ?? (() => {}));

  return ui?.isResultVisible?.() ?? true;
}

function buildDebugHost(game) {
  return {
    getGame() {
      return game;
    },
    advanceTime(ms) {
      return game?.advanceTime?.(ms);
    },
    getSnapshot() {
      return buildSnapshot(game);
    },
    openPauseOverlay() {
      return openPauseOverlay(game);
    },
    openResultOverlay(overrides = {}) {
      return openResultOverlay(game, overrides);
    },
  };
}

export function registerRuntimeHooks(game, options = {}) {
  const host = getHookHost();
  if (!host) return;
  if (!shouldEnableRuntimeHooks(options, host)) return false;

  const debugHost = buildDebugHost(game);
  host.__ASHEN_DEBUG__ = debugHost;
  host.__ASHEN_RUNTIME__ = { game };
  host.advanceTime = (ms) => debugHost.advanceTime(ms);
  host.render_game_to_text = () => JSON.stringify(debugHost.getSnapshot());
  return true;
}

export function unregisterRuntimeHooks() {
  const host = getHookHost();
  if (!host) return;

  delete host.__ASHEN_DEBUG__;
  delete host.__ASHEN_RUNTIME__;
  delete host.advanceTime;
  delete host.render_game_to_text;
}
