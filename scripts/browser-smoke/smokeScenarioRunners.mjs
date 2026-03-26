import {
  runTitleCodexScenario,
  runTitleMetaShopScenario,
  runTitleSettingsScenario,
  runTitleSettingsPersistScenario,
  runTitleToPlayScenario,
} from './smokeTitleScenarios.mjs';
import {
  runPauseLayoutScenario,
  runPauseOverlayScenario,
  runResultScreenScenario,
} from './smokePlayScenarios.mjs';

const RUNNERS = {
  title_to_play: runTitleToPlayScenario,
  title_codex: runTitleCodexScenario,
  title_meta_shop: runTitleMetaShopScenario,
  title_settings: runTitleSettingsScenario,
  title_settings_persist: runTitleSettingsPersistScenario,
  pause_overlay: runPauseOverlayScenario,
  pause_layout: runPauseLayoutScenario,
  result_screen: runResultScreenScenario,
};

export async function runSmokeScenario(url, scenarioId, artifactDir, transport) {
  const runner = RUNNERS[scenarioId];
  if (!runner) {
    throw new Error(`No runner registered for scenario: ${scenarioId}`);
  }

  return runner(url, artifactDir, transport);
}
