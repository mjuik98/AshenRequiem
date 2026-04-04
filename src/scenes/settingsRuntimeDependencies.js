export function createSettingsRuntimeDependencies(
  game = {},
  {
    accessibilityRuntimeFactory = () => game?.accessibilityRuntime ?? null,
  } = {},
) {
  const resizeCanvas = game?.runtimeCapabilities?.resizeCanvas
    ?? game?._resizeCanvas?.bind?.(game)
    ?? null;

  return {
    renderer: game?.renderer ?? null,
    soundSystem: game?.soundSystem ?? null,
    accessibilityRuntime: accessibilityRuntimeFactory(),
    inputManager: game?.input ?? null,
    resizeCanvas,
  };
}
