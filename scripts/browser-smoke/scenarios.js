export const OUTPUT_ROOT = 'output/web-game/deterministic-smoke';

export const SCENARIOS = {
  title_to_play: {
    id: 'title_to_play',
    artifactDir: `${OUTPUT_ROOT}/title-to-play`,
    stepNames: ['title', 'play'],
  },
  pause_overlay: {
    id: 'pause_overlay',
    artifactDir: `${OUTPUT_ROOT}/pause-overlay`,
    stepNames: ['play', 'pause'],
  },
  pause_layout: {
    id: 'pause_layout',
    artifactDir: `${OUTPUT_ROOT}/pause-layout`,
    stepNames: ['play', 'pause', 'responsive'],
    experimental: true,
  },
  result_screen: {
    id: 'result_screen',
    artifactDir: `${OUTPUT_ROOT}/result-screen`,
    stepNames: ['play', 'result'],
  },
};

export function getScenarioIds(options = {}) {
  const includeExperimental = options.includeExperimental ?? false;
  return Object.values(SCENARIOS)
    .filter((scenario) => includeExperimental || scenario.experimental !== true)
    .map((scenario) => scenario.id);
}
