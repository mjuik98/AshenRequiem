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
  runLevelUpOverlayScenario,
  runPauseLayoutScenario,
  runPauseOverlayScenario,
  runResultScreenScenario,
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
};

export async function runSmokeScenario(url, scenarioId, artifactDir, transport) {
  const runner = RUNNERS[scenarioId];
  if (!runner) {
    throw new Error(`No runner registered for scenario: ${scenarioId}`);
  }

  return runner(url, artifactDir, transport);
}
