export const OUTPUT_ROOTS = {
  core: 'output/web-game/deterministic-smoke-core',
  full: 'output/web-game/deterministic-smoke-full',
};

export const SCENARIOS = {
  title_to_play: {
    id: 'title_to_play',
    artifactSlug: 'title-to-play',
    suite: 'core',
    stepNames: ['title', 'play'],
  },
  title_loadout_accessibility: {
    id: 'title_loadout_accessibility',
    artifactSlug: 'title-loadout-accessibility',
    suite: 'core',
    stepNames: ['title', 'loadout', 'responsive', 'keyboard'],
  },
  title_codex: {
    id: 'title_codex',
    artifactSlug: 'title-codex',
    suite: 'extended',
    stepNames: ['title', 'codex', 'accessory'],
  },
  title_meta_shop: {
    id: 'title_meta_shop',
    artifactSlug: 'title-meta-shop',
    suite: 'core',
    stepNames: ['title', 'shop', 'purchase'],
  },
  title_settings: {
    id: 'title_settings',
    artifactSlug: 'title-settings',
    suite: 'extended',
    stepNames: ['title', 'settings'],
  },
  title_settings_persist: {
    id: 'title_settings_persist',
    artifactSlug: 'title-settings-persist',
    suite: 'core',
    stepNames: ['title', 'settings', 'persist'],
  },
  pause_overlay: {
    id: 'pause_overlay',
    artifactSlug: 'pause-overlay',
    suite: 'core',
    stepNames: ['play', 'pause', 'keyboard'],
  },
  levelup_overlay: {
    id: 'levelup_overlay',
    artifactSlug: 'levelup-overlay',
    suite: 'core',
    stepNames: ['play', 'levelup', 'keyboard'],
  },
  pause_layout: {
    id: 'pause_layout',
    artifactSlug: 'pause-layout',
    suite: 'extended',
    stepNames: ['play', 'pause', 'responsive'],
    experimental: true,
  },
  result_screen: {
    id: 'result_screen',
    artifactSlug: 'result-screen',
    suite: 'core',
    stepNames: ['play', 'result', 'keyboard'],
  },
  combat_pressure: {
    id: 'combat_pressure',
    artifactSlug: 'combat-pressure',
    suite: 'core',
    stepNames: ['play', 'combat', 'guidance'],
  },
  boss_readability: {
    id: 'boss_readability',
    artifactSlug: 'boss-readability',
    suite: 'extended',
    stepNames: ['play', 'boss', 'hud'],
  },
  touch_hud_mobile: {
    id: 'touch_hud_mobile',
    artifactSlug: 'touch-hud-mobile',
    suite: 'extended',
    stepNames: ['play', 'touch', 'mobile'],
  },
  daily_seed_run: {
    id: 'daily_seed_run',
    artifactSlug: 'daily-seed-run',
    suite: 'extended',
    stepNames: ['title', 'loadout', 'daily', 'play'],
  },
};

export function getOutputRootForRun({
  scenarioId = null,
  suite = 'core',
  all = false,
} = {}) {
  if (all) return OUTPUT_ROOTS.full;
  if (scenarioId) {
    return SCENARIOS[scenarioId]?.suite === 'core'
      ? OUTPUT_ROOTS.core
      : OUTPUT_ROOTS.full;
  }
  return suite === 'core' ? OUTPUT_ROOTS.core : OUTPUT_ROOTS.full;
}

export function resolveScenarioArtifactDir(scenarioId, options = {}) {
  const scenario = SCENARIOS[scenarioId];
  if (!scenario) {
    throw new Error(`Unknown scenario: ${scenarioId}`);
  }
  return `${getOutputRootForRun({ ...options, scenarioId })}/${scenario.artifactSlug}`;
}

export function getScenarioIds(options = {}) {
  const suite = options.suite ?? null;
  const includeExperimental = options.includeExperimental ?? false;
  return Object.values(SCENARIOS)
    .filter((scenario) => suite == null || scenario.suite === suite)
    .filter((scenario) => includeExperimental || scenario.experimental !== true)
    .map((scenario) => scenario.id);
}
