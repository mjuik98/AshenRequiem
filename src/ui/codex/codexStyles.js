import { SUBSCREEN_SHARED_CSS } from '../shared/subscreenTheme.js';
import { CODEX_ACCESSORY_TAB_CSS } from './codexAccessoryStyles.js';
import { CODEX_LAYOUT_CSS } from './codexLayoutStyles.js';
import { CODEX_RESPONSIVE_CSS } from './codexResponsiveStyles.js';
import { CODEX_TAB_CSS } from './codexTabStyles.js';

export const CODEX_VIEW_STYLE_ID = 'codex-view-styles';

export const CODEX_VIEW_CSS = `
  ${SUBSCREEN_SHARED_CSS}
  ${CODEX_LAYOUT_CSS}
  ${CODEX_TAB_CSS}
  ${CODEX_ACCESSORY_TAB_CSS}
  ${CODEX_RESPONSIVE_CSS}
`;
