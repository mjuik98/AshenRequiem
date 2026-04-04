import { ACTION_BUTTON_SHARED_CSS } from '../shared/actionButtonTheme.js';
import { MODAL_SHARED_CSS } from '../shared/modalTheme.js';
import { PAUSE_AUDIO_CSS } from './pauseAudioStyles.js';
import { PAUSE_LAYOUT_CSS } from './pauseLayoutStyles.js';
import { PAUSE_LOADOUT_CSS } from './pauseLoadoutStyles.js';
import { PAUSE_RESPONSIVE_CSS } from './pauseResponsiveStyles.js';

export const PAUSE_VIEW_STYLE_ID = 'pauseview-v3-styles';

export const PAUSE_VIEW_CSS = `
  ${MODAL_SHARED_CSS}
  ${ACTION_BUTTON_SHARED_CSS}
  ${PAUSE_LAYOUT_CSS}
  ${PAUSE_LOADOUT_CSS}
  ${PAUSE_AUDIO_CSS}
  ${PAUSE_RESPONSIVE_CSS}
`;

export function ensurePauseViewStyles(documentRef = document) {
  if (documentRef.getElementById(PAUSE_VIEW_STYLE_ID)) return;
  const style = documentRef.createElement('style');
  style.id = PAUSE_VIEW_STYLE_ID;
  style.textContent = PAUSE_VIEW_CSS;
  documentRef.head.appendChild(style);
}
