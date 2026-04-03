import { getHookHost, shouldEnableRuntimeHooks } from './runtimeDebugSurface.js';
import { buildAuthoringSnapshot, buildSnapshot } from './runtimeSnapshot.js';
import {
  openEncounterAuthoringOverlay,
  openLevelUpOverlay,
  openPauseOverlay,
  openResultOverlay,
} from './runtimeOverlayHelpers.js';
import { openBossReadabilityOverlay } from './runtimeScenarioHelpers.js';

export function buildDebugHost(game) {
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
    getAuthoringSnapshot() {
      return buildAuthoringSnapshot(game);
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
    openBossReadabilityOverlay() {
      return openBossReadabilityOverlay(game);
    },
    openEncounterAuthoringOverlay() {
      return openEncounterAuthoringOverlay(game);
    },
  };
}

export function registerRuntimeHooks(game, options = {}) {
  const host = getHookHost();
  if (!host) return false;
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
