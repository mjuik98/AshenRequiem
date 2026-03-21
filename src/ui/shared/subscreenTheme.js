/**
 * src/ui/shared/subscreenTheme.js
 *
 * 타이틀 하위 DOM 화면(Codex/Settings/MetaShop)용 공통 셸 토큰.
 */

export const SUBSCREEN_BACK_LABEL = '← 메인 화면으로';

export const SUBSCREEN_THEME = Object.freeze({
  background: 'radial-gradient(circle at 48% 14%, #261830 0%, #0c0b16 48%, #020205 100%)',
  panelBackground: 'linear-gradient(180deg, rgba(18,12,26,0.97) 0%, rgba(8,7,15,0.985) 100%)',
  border: 'rgba(217,179,107,0.3)',
  borderSoft: 'rgba(217,179,107,0.16)',
  accent: '#d9b36b',
  accentSoft: 'rgba(217,179,107,0.13)',
  text: 'rgba(246,239,226,0.92)',
  muted: 'rgba(246,239,226,0.54)',
  shadow: '0 30px 90px rgba(0,0,0,0.58), inset 0 1px 0 rgba(255,255,255,0.04)',
});

export const SUBSCREEN_SHARED_CSS = `
  .ss-root {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px 16px;
    overflow-y: auto;
    box-sizing: border-box;
    color: ${SUBSCREEN_THEME.text};
    background:
      radial-gradient(circle at 20% 12%, rgba(217,179,107,0.1), transparent 28%),
      radial-gradient(circle at 82% 18%, rgba(106,66,150,0.14), transparent 24%),
      ${SUBSCREEN_THEME.background};
    font-family: 'Noto Serif KR', 'Segoe UI', sans-serif;
    pointer-events: auto;
    z-index: 50;
  }

  .ss-panel {
    width: min(820px, 100%);
    margin: 0 auto;
    border-radius: 24px;
    border: 1px solid ${SUBSCREEN_THEME.border};
    background: ${SUBSCREEN_THEME.panelBackground};
    box-shadow: ${SUBSCREEN_THEME.shadow};
    position: relative;
    overflow: hidden;
  }

  .ss-panel::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      linear-gradient(180deg, rgba(255,255,255,0.035), transparent 18%),
      linear-gradient(135deg, rgba(217,179,107,0.05), transparent 32%);
    pointer-events: none;
  }

  .ss-header {
    position: relative;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    padding: 22px 26px 18px;
    border-bottom: 1px solid ${SUBSCREEN_THEME.borderSoft};
  }

  .ss-header-left {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  .ss-rune {
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    border: 1px solid ${SUBSCREEN_THEME.border};
    background: rgba(217,179,107,0.12);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
    font-size: 17px;
  }

  .ss-heading {
    min-width: 0;
  }

  .ss-title {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 3.2px;
    text-transform: uppercase;
    color: ${SUBSCREEN_THEME.accent};
  }

  .ss-subtitle {
    margin: 6px 0 0;
    font-size: 12px;
    line-height: 1.45;
    color: ${SUBSCREEN_THEME.muted};
  }

  .ss-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 11px;
    border-radius: 999px;
    border: 1px solid rgba(217,179,107,0.24);
    background: rgba(217,179,107,0.09);
    color: rgba(217,179,107,0.82);
    font-size: 11px;
    white-space: nowrap;
  }

  .ss-back-btn {
    appearance: none;
    border: 1px solid rgba(217,179,107,0.22);
    background:
      linear-gradient(180deg, rgba(217,179,107,0.14), rgba(217,179,107,0.08));
    color: ${SUBSCREEN_THEME.text};
    border-radius: 999px;
    padding: 10px 16px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.2px;
    cursor: pointer;
    transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
  }

  .ss-back-btn:hover {
    transform: translateY(-1px);
    border-color: rgba(217,179,107,0.4);
    background:
      linear-gradient(180deg, rgba(217,179,107,0.2), rgba(217,179,107,0.1));
  }

  .ss-back-btn:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px rgba(217,179,107,0.4);
  }

  .ss-scroll {
    scrollbar-width: thin;
    scrollbar-color: rgba(217,179,107,0.34) transparent;
  }

  .ss-scroll::-webkit-scrollbar {
    width: 7px;
  }

  .ss-scroll::-webkit-scrollbar-track {
    background: transparent;
  }

  .ss-scroll::-webkit-scrollbar-thumb {
    background: rgba(217,179,107,0.34);
    border-radius: 999px;
  }

  .ss-scroll::-webkit-scrollbar-thumb:hover {
    background: rgba(217,179,107,0.5);
  }
`;

function joinClasses(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function renderSubscreenHeader({
  headerClass = '',
  leftClass = '',
  headingClass = '',
  runeClass = '',
  titleClass = '',
  subtitleClass = '',
  titleTag = 'h1',
  rune = '',
  title = '',
  subtitle = '',
  right = '',
}) {
  const safeTitleTag = titleTag === 'h2' ? 'h2' : 'h1';

  return `
    <header class="${joinClasses('ss-header', headerClass)}">
      <div class="${joinClasses('ss-header-left', leftClass)}">
        <div class="${joinClasses('ss-rune', runeClass)}" aria-hidden="true">${rune}</div>
        <div class="${joinClasses('ss-heading', headingClass)}">
          <${safeTitleTag} class="${joinClasses('ss-title', titleClass)}">${title}</${safeTitleTag}>
          ${subtitle ? `<p class="${joinClasses('ss-subtitle', subtitleClass)}">${subtitle}</p>` : ''}
        </div>
      </div>
      ${right}
    </header>
  `;
}

export function renderSubscreenFooter({
  footerClass = '',
  backButtonClass = '',
  backButtonId = '',
  backLabel = SUBSCREEN_BACK_LABEL,
  backAttrs = 'type="button"',
  extra = '',
  beforeBack = '',
  afterBack = '',
} = {}) {
  const idAttr = backButtonId ? ` id="${backButtonId}"` : '';
  const prefix = beforeBack || extra;

  return `
    <footer class="${footerClass}">
      ${prefix}
      <button class="${joinClasses('ss-back-btn', backButtonClass)}"${idAttr} ${backAttrs}>${backLabel}</button>
      ${afterBack}
    </footer>
  `;
}
