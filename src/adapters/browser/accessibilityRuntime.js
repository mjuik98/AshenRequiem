export const ACCESSIBILITY_ROOT_CLASSES = Object.freeze({
  reducedMotion: 'ash-access-reduced-motion',
  highVisibilityHud: 'ash-access-high-visibility',
  largeText: 'ash-access-large-text',
});

export function applyAccessibilityOptions(options = {}, { root = null } = {}) {
  const resolvedRoot = root ?? globalThis.document?.documentElement ?? null;
  if (!resolvedRoot?.classList) return options;

  resolvedRoot.classList.toggle(
    ACCESSIBILITY_ROOT_CLASSES.reducedMotion,
    options.reducedMotion === true,
  );
  resolvedRoot.classList.toggle(
    ACCESSIBILITY_ROOT_CLASSES.highVisibilityHud,
    options.highVisibilityHud === true,
  );
  resolvedRoot.classList.toggle(
    ACCESSIBILITY_ROOT_CLASSES.largeText,
    options.largeText === true,
  );
  return options;
}

export function createDocumentAccessibilityRuntime(root = null) {
  return {
    applyOptions(options = {}) {
      return applyAccessibilityOptions(options, { root });
    },
  };
}
