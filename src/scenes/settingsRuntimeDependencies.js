export function createSettingsRuntimeDependencies(
  game = {},
  {
    accessibilityRuntimeFactory = () => game?.accessibilityRuntime ?? null,
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
