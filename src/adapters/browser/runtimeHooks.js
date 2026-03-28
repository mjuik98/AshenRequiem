import { hasRuntimeQueryFlag } from './runtimeEnv.js';
import { PlayMode, transitionPlayMode } from '../../state/PlayMode.js';

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

  ui.hideLevelUp?.();
  ui.hideResult?.();
  transitionPlayMode(world, PlayMode.PAUSED);

  ui.showPause({
    player: world.entities.player,
    data: scene?._gameData ?? game?.gameData ?? {},
    world,
    session: game?.session ?? null,
    onResume: () => {
      transitionPlayMode(world, PlayMode.PLAYING);
      ui.hidePause?.();
    },
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

  ui.hidePause?.();
  ui.hideLevelUp?.();

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

function openLevelUpOverlay(game, overrides = {}) {
  const scene = game?.sceneManager?.currentScene ?? null;
  const world = scene?.world ?? null;
  const controller = scene?._levelUpController ?? null;
  const player = world?.entities?.player ?? null;
  if (!world || !controller?.show || !player) return false;

  scene?._ui?.hidePause?.();
  scene?._ui?.hideResult?.();
  world.run ??= {};
  world.progression ??= {};
  world.run.playMode ??= PlayMode.PLAYING;
  player.weapons = [
    { id: 'flame_zone', level: 1, currentCooldown: 0 },
    { id: 'magic_bolt', level: 7, currentCooldown: 0 },
  ];
  player.accessories = [{ id: 'iron_heart', level: 2 }];
  player.acquiredUpgrades = new Set(['up_magic_bolt']);
  world.progression.pendingLevelUpChoices = overrides.choices ?? [
    { id: 'up_flame_zone', type: 'weapon_upgrade', weaponId: 'flame_zone', name: '화염 지대', description: '지속 화염 피해가 강화됩니다.' },
    { id: 'up_iron_heart', type: 'accessory_upgrade', accessoryId: 'iron_heart', name: '강철 심장', description: '생존력이 한 단계 더 올라갑니다.' },
    { id: 'get_boomerang', type: 'weapon_new', weaponId: 'boomerang', name: '부메랑', description: '회전하며 돌아오는 부메랑을 던집니다.' },
    { id: 'get_tome_of_power', type: 'accessory', accessoryId: 'tome_of_power', name: '마력의 고서', description: '모든 무기 데미지가 상승합니다.' },
    { id: 'evolution_arcane_nova', type: 'weapon_evolution', weaponId: 'magic_bolt', resultWeaponId: 'arcane_nova', name: '아케인 노바', description: '비전 폭발 무기로 진화합니다.' },
  ];
  world.progression.pendingLevelUpType = 'levelup';
  world.progression.levelUpActionMode = 'select';
  world.progression.runRerollsRemaining = overrides.rerollsRemaining ?? 1;
  world.progression.runBanishesRemaining = overrides.banishesRemaining ?? 1;
  transitionPlayMode(world, PlayMode.LEVELUP);
  controller.show();
  return scene?._ui?.isLevelUpVisible?.() ?? true;
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
    openLevelUpOverlay(overrides = {}) {
      return openLevelUpOverlay(game, overrides);
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
