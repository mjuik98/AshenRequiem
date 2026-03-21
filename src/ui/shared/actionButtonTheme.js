export const ACTION_BUTTON_THEME = Object.freeze({
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
});

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
  }
  .ui-action-btn:hover {
    transform: translateY(-1px);
  }
  .ui-action-btn:disabled {
    opacity: 0.5;
    cursor: wait;
    transform: none;
  }
  .ui-action-btn--accent {
    border-color: ${ACTION_BUTTON_THEME.accent.border};
    background: ${ACTION_BUTTON_THEME.accent.background};
    color: ${ACTION_BUTTON_THEME.accent.color};
  }
  .ui-action-btn--accent:hover {
    border-color: ${ACTION_BUTTON_THEME.accent.hoverBorder};
    background: ${ACTION_BUTTON_THEME.accent.hoverBackground};
  }
  .ui-action-btn--neutral {
    border-color: ${ACTION_BUTTON_THEME.neutral.border};
    background: ${ACTION_BUTTON_THEME.neutral.background};
    color: ${ACTION_BUTTON_THEME.neutral.color};
  }
  .ui-action-btn--neutral:hover {
    border-color: ${ACTION_BUTTON_THEME.neutral.hoverBorder};
    background: ${ACTION_BUTTON_THEME.neutral.hoverBackground};
  }
  .ui-action-btn--danger {
    border-color: ${ACTION_BUTTON_THEME.danger.border};
    background: ${ACTION_BUTTON_THEME.danger.background};
    color: ${ACTION_BUTTON_THEME.danger.color};
  }
  .ui-action-btn--danger:hover {
    border-color: ${ACTION_BUTTON_THEME.danger.hoverBorder};
    background: ${ACTION_BUTTON_THEME.danger.hoverBackground};
  }
  .ui-action-btn--success {
    border-color: ${ACTION_BUTTON_THEME.success.border};
    background: ${ACTION_BUTTON_THEME.success.background};
    color: ${ACTION_BUTTON_THEME.success.color};
  }
  .ui-action-btn--success:hover {
    border-color: ${ACTION_BUTTON_THEME.success.hoverBorder};
    background: ${ACTION_BUTTON_THEME.success.hoverBackground};
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
  label = '',
  ariaLabel = '',
  leading = '',
  trailing = '',
  disabled = false,
  stretch = false,
} = {}) {
  const safeTone = Object.hasOwn(ACTION_BUTTON_THEME, tone) ? tone : 'accent';
  const classes = [
    'ui-action-btn',
    `ui-action-btn--${safeTone}`,
    stretch ? 'ui-action-btn--stretch' : '',
    className,
  ].filter(Boolean).join(' ');

  const attrs = [
    `class="${classes}"`,
    `type="${type}"`,
    id ? `id="${id}"` : '',
    ariaLabel ? `aria-label="${ariaLabel}"` : '',
    disabled ? 'disabled' : '',
  ].filter(Boolean).join(' ');

  return `<button ${attrs}>${leading}${label}${trailing}</button>`;
}
