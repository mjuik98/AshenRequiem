import {
  runTitleCodexScenario,
  runTitleLoadoutAccessibilityScenario,
  runTitleMetaShopScenario,
  runTitleSettingsScenario,
  runTitleSettingsPersistScenario,
  runTitleToPlayScenario,
} from './smokeTitleScenarios.mjs';
import {
  runBossReadabilityScenario,
  runCombatPressureScenario,
  runDailySeedScenario,
  runLevelUpOverlayScenario,
  runPauseLayoutScenario,
  runPauseOverlayScenario,
  runResultScreenScenario,
  runTouchHudMobileScenario,
} from './smokePlayScenarios.mjs';

const RUNNERS = {
  title_to_play: runTitleToPlayScenario,
  title_loadout_accessibility: runTitleLoadoutAccessibilityScenario,
  title_codex: runTitleCodexScenario,
  title_meta_shop: runTitleMetaShopScenario,
  title_settings: runTitleSettingsScenario,
  title_settings_persist: runTitleSettingsPersistScenario,
  pause_overlay: runPauseOverlayScenario,
  levelup_overlay: runLevelUpOverlayScenario,
  pause_layout: runPauseLayoutScenario,
  result_screen: runResultScreenScenario,
  combat_pressure: runCombatPressureScenario,
  boss_readability: runBossReadabilityScenario,
  touch_hud_mobile: runTouchHudMobileScenario,
  daily_seed_run: runDailySeedScenario,
};

export async function runSmokeScenario(url, scenarioId, artifactDir, transport) {
  const runner = RUNNERS[scenarioId];
  if (!runner) {
    throw new Error(`No runner registered for scenario: ${scenarioId}`);
  }

  return runner(url, artifactDir, transport);
}
