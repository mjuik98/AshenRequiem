export const MODAL_THEME = Object.freeze({
  backdrop: 'rgba(4, 3, 10, 0.78)',
  backdropGlow: 'radial-gradient(circle at 50% 18%, rgba(212, 175, 106, 0.12), transparent 36%)',
  panelBackground: 'linear-gradient(180deg, rgba(18, 12, 28, 0.98) 0%, rgba(9, 7, 15, 0.985) 100%)',
  panelBorder: 'rgba(212, 175, 106, 0.28)',
  panelShadow: '0 28px 80px rgba(0, 0, 0, 0.52)',
  text: '#f4ede0',
  muted: 'rgba(244, 237, 224, 0.68)',
  accent: '#d4af6a',
  accentSoft: 'rgba(212, 175, 106, 0.72)',
  line: 'rgba(255, 255, 255, 0.08)',
  scrollThumb: 'rgba(217, 179, 107, 0.34)',
  scrollThumbHover: 'rgba(217, 179, 107, 0.5)',
  focusRing: 'rgba(217, 179, 107, 0.46)',
});

export const MODAL_TONES = Object.freeze({
  loadout: {
    accent: '#d4af6a',
    accentSoft: 'rgba(212, 175, 106, 0.72)',
    focusRing: 'rgba(217, 179, 107, 0.46)',
    panelBorder: 'rgba(212, 175, 106, 0.28)',
    backdropGlow: 'radial-gradient(circle at 50% 18%, rgba(212, 175, 106, 0.12), transparent 36%)',
  },
  pause: {
    accent: '#8fb5c7',
    accentSoft: 'rgba(143, 181, 199, 0.78)',
    focusRing: 'rgba(143, 181, 199, 0.42)',
    panelBorder: 'rgba(143, 181, 199, 0.22)',
    backdropGlow: 'radial-gradient(circle at 50% 12%, rgba(143, 181, 199, 0.1), transparent 34%)',
  },
  reward: {
    accent: '#f5d47c',
    accentSoft: 'rgba(245, 212, 124, 0.78)',
    focusRing: 'rgba(245, 212, 124, 0.44)',
    panelBorder: 'rgba(245, 212, 124, 0.24)',
    backdropGlow: 'radial-gradient(circle at 50% 18%, rgba(245, 212, 124, 0.14), transparent 38%)',
  },
  'result-victory': {
    accent: '#97c459',
    accentSoft: 'rgba(151, 196, 89, 0.8)',
    focusRing: 'rgba(151, 196, 89, 0.42)',
    panelBorder: 'rgba(151, 196, 89, 0.22)',
    backdropGlow: 'radial-gradient(circle at 50% 18%, rgba(151, 196, 89, 0.12), transparent 38%)',
  },
  'result-defeat': {
    accent: '#f09595',
    accentSoft: 'rgba(240, 149, 149, 0.78)',
    focusRing: 'rgba(240, 149, 149, 0.4)',
    panelBorder: 'rgba(226, 75, 74, 0.24)',
    backdropGlow: 'radial-gradient(circle at 50% 18%, rgba(226, 75, 74, 0.12), transparent 38%)',
  },
});

function buildToneCss(tone, values) {
  return `
  .ui-modal-shell.ui-modal-tone--${tone} {
    --ui-modal-accent: ${values.accent};
    --ui-modal-accent-soft: ${values.accentSoft};
    --ui-modal-focus-ring: ${values.focusRing};
    --ui-modal-panel-border: ${values.panelBorder};
    --ui-modal-backdrop-glow: ${values.backdropGlow};
  }`;
}

export const MODAL_SHARED_CSS = `
  .ui-modal-shell {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    --ui-modal-accent: ${MODAL_THEME.accent};
    --ui-modal-accent-soft: ${MODAL_THEME.accentSoft};
    --ui-modal-focus-ring: ${MODAL_THEME.focusRing};
    --ui-modal-panel-border: ${MODAL_THEME.panelBorder};
    --ui-modal-backdrop-glow: ${MODAL_THEME.backdropGlow};
  }

  ${Object.entries(MODAL_TONES).map(([tone, values]) => buildToneCss(tone, values)).join('\n')}

  .ui-modal-backdrop {
    position: absolute;
    inset: 0;
    background: var(--ui-modal-backdrop-glow), ${MODAL_THEME.backdrop};
    backdrop-filter: blur(7px);
  }

  .ui-modal-panel {
    position: relative;
    z-index: 1;
    color: ${MODAL_THEME.text};
    background: ${MODAL_THEME.panelBackground};
    border: 1px solid var(--ui-modal-panel-border);
    border-radius: 24px;
    box-shadow: ${MODAL_THEME.panelShadow};
  }

  .ui-modal-panel--floating {
    animation: ui-modal-appear 0.24s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }

  .ui-modal-panel--scroll {
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-width: thin;
    scrollbar-color: ${MODAL_THEME.scrollThumb} transparent;
  }

  .ui-modal-panel--scroll::-webkit-scrollbar {
    width: 7px;
  }

  .ui-modal-panel--scroll::-webkit-scrollbar-track {
    background: transparent;
  }

  .ui-modal-panel--scroll::-webkit-scrollbar-thumb {
    background: ${MODAL_THEME.scrollThumb};
    border-radius: 999px;
  }

  .ui-modal-panel--scroll::-webkit-scrollbar-thumb:hover {
    background: ${MODAL_THEME.scrollThumbHover};
  }

  .ui-modal-panel:focus-visible {
    outline: none;
    box-shadow:
      0 0 0 2px var(--ui-modal-focus-ring),
      ${MODAL_THEME.panelShadow};
  }

  .ui-modal-header-stack {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .ui-modal-eyebrow {
    margin: 0;
    font-size: 11px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--ui-modal-accent-soft);
  }

  .ui-modal-title {
    margin: 0;
    font-size: 29px;
    font-weight: 700;
    line-height: 1.15;
    letter-spacing: 0.02em;
    color: ${MODAL_THEME.text};
  }

  .ui-modal-copy {
    margin: 0;
    font-size: 13px;
    line-height: 1.55;
    color: ${MODAL_THEME.muted};
  }

  .ui-modal-action-bar {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
  }

  @keyframes ui-modal-appear {
    from { opacity: 0; transform: scale(0.92) translateY(10px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
`;
