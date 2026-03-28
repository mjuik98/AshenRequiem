const FOCUSABLE_SELECTOR = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * @typedef {object} BindDialogRuntimeOptions
 * @property {Element | null} [root]
 * @property {string} [panelSelector]
 * @property {string} [initialFocusSelector]
 * @property {(() => void) | null} [onRequestClose]
 * @property {Document} [documentRef]
 * @property {Window & typeof globalThis} [windowRef]
 */

function isEscapeEvent(event) {
  return event?.key === 'Escape' || event?.code === 'Escape' || event?.key === 'Esc';
}

function isTabEvent(event) {
  return event?.key === 'Tab' || event?.code === 'Tab';
}

function isVisibleRoot(root) {
  return Boolean(root) && root.style?.display !== 'none';
}

function getPanel(root, panelSelector) {
  return root?.querySelector?.(panelSelector) ?? null;
}

function getFocusableElements(panel) {
  return Array.from(panel?.querySelectorAll?.(FOCUSABLE_SELECTOR) ?? [])
    .filter((element) => {
      const tabIndex = element?.getAttribute?.('tabindex');
      return tabIndex !== '-1';
    });
}

/**
 * @param {BindDialogRuntimeOptions} options
 */
export function bindDialogRuntime({
  root,
  panelSelector,
  initialFocusSelector = panelSelector,
  onRequestClose = null,
  documentRef = globalThis.document,
  windowRef = globalThis.window,
} = {}) {
  /** @type {HTMLElement | null} */
  const previousActiveElement = /** @type {HTMLElement | null} */ (documentRef?.activeElement ?? null);

  const handleKeyDown = (event) => {
    if (!isVisibleRoot(root)) return;

    if (isEscapeEvent(event)) {
      if (!onRequestClose) return;
      event?.preventDefault?.();
      onRequestClose();
      return;
    }

    if (!isTabEvent(event)) return;

    const panel = getPanel(root, panelSelector);
    if (!panel) return;

    const focusables = getFocusableElements(panel);
    if (focusables.length === 0) {
      event?.preventDefault?.();
      panel.focus?.({ preventScroll: true });
      return;
    }

    const activeElement = documentRef?.activeElement ?? null;
    const activeInsidePanel = activeElement === panel || panel.contains?.(activeElement);
    if (!activeInsidePanel) {
      event?.preventDefault?.();
      (event?.shiftKey ? focusables.at(-1) : focusables[0])?.focus?.({ preventScroll: true });
      return;
    }

    const currentIndex = focusables.indexOf(activeElement);
    if (currentIndex === -1) {
      event?.preventDefault?.();
      (event?.shiftKey ? focusables.at(-1) : focusables[0])?.focus?.({ preventScroll: true });
      return;
    }

    if (!event?.shiftKey && currentIndex === focusables.length - 1) {
      event?.preventDefault?.();
      focusables[0]?.focus?.({ preventScroll: true });
      return;
    }

    if (event?.shiftKey && currentIndex === 0) {
      event?.preventDefault?.();
      focusables.at(-1)?.focus?.({ preventScroll: true });
    }
  };

  windowRef?.addEventListener?.('keydown', handleKeyDown);

  return {
    focusInitial() {
      /** @type {HTMLElement | null} */
      const initialTarget = /** @type {HTMLElement | null} */ (
        root?.querySelector?.(initialFocusSelector) ?? getPanel(root, panelSelector)
      );
      initialTarget?.focus?.({ preventScroll: true });
    },
    dispose({ restoreFocus = true } = {}) {
      windowRef?.removeEventListener?.('keydown', handleKeyDown);
      if (!restoreFocus) return;
      previousActiveElement?.focus?.();
    },
  };
}
