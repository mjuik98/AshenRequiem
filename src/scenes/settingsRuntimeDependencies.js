import { createDocumentAccessibilityRuntime } from '../ui/shared/accessibilityRuntime.js';

export function createSettingsRuntimeDependencies(
  game = {},
  {
    accessibilityRuntimeFactory = createDocumentAccessibilityRuntime,
  } = {},
) {
  return {
    renderer: game?.renderer ?? null,
    soundSystem: game?.soundSystem ?? null,
    accessibilityRuntime: accessibilityRuntimeFactory(),
    inputManager: game?.input ?? null,
    resizeCanvas: game?._resizeCanvas?.bind?.(game) ?? null,
  };
}
