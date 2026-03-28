import { MODAL_TONES } from './modalTheme.js';

function buildModalActionTone(modalTone = {}) {
  const accent = modalTone.accent ?? '#d4af6a';
  const focusRing = modalTone.focusRing ?? 'rgba(217,179,107,0.46)';
  const panelBorder = modalTone.panelBorder ?? 'rgba(212,175,106,0.28)';
  const accentSoft = modalTone.accentSoft ?? 'rgba(212,175,106,0.72)';

  return {
    border: panelBorder,
    background: focusRing.replace(/0?\.\d+\)/, '0.14)'),
    color: accent,
    hoverBorder: accentSoft.replace(/0?\.\d+\)/, '0.82)'),
    hoverBackground: focusRing.replace(/0?\.\d+\)/, '0.24)'),
  };
}

const ACTION_BUTTON_THEME_MAP = {
  accent: {
    border: 'rgba(212,175,106,0.32)',
    background: 'rgba(212,175,106,0.12)',
    color: '#d4af6a',
    hoverBorder: 'rgba(212,175,106,0.5)',
    hoverBackground: 'rgba(212,175,106,0.2)',
  },
  neutral: {
    border: 'rgba(144,164,174,0.28)',
    background: 'rgba(144,164,174,0.14)',
    color: '#f0f4f7',
    hoverBorder: 'rgba(144,164,174,0.44)',
    hoverBackground: 'rgba(144,164,174,0.22)',
  },
  danger: {
    border: 'rgba(180,60,60,0.28)',
    background: 'rgba(180,60,60,0.12)',
    color: 'rgba(255,160,160,0.82)',
    hoverBorder: 'rgba(220,90,90,0.42)',
    hoverBackground: 'rgba(180,60,60,0.2)',
  },
  success: {
    border: 'rgba(102,187,106,0.34)',
    background: 'rgba(102,187,106,0.16)',
    color: '#dff4e0',
    hoverBorder: 'rgba(129,199,132,0.5)',
    hoverBackground: 'rgba(102,187,106,0.24)',
  },
  loadout: buildModalActionTone(MODAL_TONES.loadout),
  pause: buildModalActionTone(MODAL_TONES.pause),
  reward: buildModalActionTone(MODAL_TONES.reward),
  'result-victory': buildModalActionTone(MODAL_TONES['result-victory']),
  'result-defeat': buildModalActionTone(MODAL_TONES['result-defeat']),
};

export const ACTION_BUTTON_THEME = Object.freeze(ACTION_BUTTON_THEME_MAP);

function buildToneCss(tone, values) {
  return `
  .ui-action-btn--${tone} {
    border-color: ${values.border};
    background: ${values.background};
    color: ${values.color};
  }
  .ui-action-btn--${tone}:hover {
    border-color: ${values.hoverBorder};
    background: ${values.hoverBackground};
  }`;
}

export const ACTION_BUTTON_SHARED_CSS = `
  .ui-action-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 12px 16px;
    border-radius: 10px;
    border: 1px solid transparent;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s, transform 0.15s, box-shadow 0.15s;
    text-decoration: none;
    box-sizing: border-box;
    white-space: nowrap;
  }
  .ui-action-btn:hover {
    transform: translateY(-1px);
  }
  .ui-action-btn:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px rgba(212,175,106,0.22);
  }
  .ui-action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
  .ui-action-btn--pill {
    border-radius: 999px;
  }
  .ui-action-btn--compact {
    min-height: 36px;
    padding: 8px 14px;
    font-size: 11px;
  }
  ${Object.entries(ACTION_BUTTON_THEME).map(([tone, values]) => buildToneCss(tone, values)).join('\n')}
  .ui-action-btn--solid.ui-action-btn--accent {
    background: linear-gradient(180deg, #d8bb78 0%, #9a7130 100%);
    border-color: rgba(212,175,106,0.74);
    color: #140d03;
    box-shadow: 0 8px 24px rgba(154,113,48,0.2);
  }
  .ui-action-btn--solid.ui-action-btn--accent:hover {
    background: linear-gradient(180deg, #e2c98d 0%, #a97d37 100%);
    border-color: rgba(241,209,138,0.82);
  }
  .ui-action-btn--stretch {
    width: 100%;
  }
`;

export function renderActionButton({
  className = '',
  id = '',
  type = 'button',
  tone = 'accent',
  shape = 'default',
  size = 'md',
  solid = false,
  label = '',
  ariaLabel = '',
  leading = '',
  trailing = '',
  disabled = false,
  stretch = false,
  attributes = {},
} = {}) {
  const safeTone = Object.hasOwn(ACTION_BUTTON_THEME, tone) ? tone : 'accent';
  const classes = [
    'ui-action-btn',
    `ui-action-btn--${safeTone}`,
    shape === 'pill' ? 'ui-action-btn--pill' : '',
    size === 'sm' ? 'ui-action-btn--compact' : '',
    solid ? 'ui-action-btn--solid' : '',
    stretch ? 'ui-action-btn--stretch' : '',
    className,
  ].filter(Boolean).join(' ');

  const extraAttrs = Object.entries(attributes).map(([key, value]) => {
    if (value === false || value == null) return '';
    if (value === true) return key;
    return `${key}="${String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('"', '&quot;')}"`;
  }).filter(Boolean).join(' ');

  const attrs = [
    `class="${classes}"`,
    id ? `id="${id}"` : '',
    ariaLabel ? `aria-label="${ariaLabel}"` : '',
    extraAttrs,
    `type="${type}"`,
    disabled ? 'disabled' : '',
  ].filter(Boolean).join(' ');

  return `<button ${attrs}>${leading}${label}${trailing}</button>`;
}
