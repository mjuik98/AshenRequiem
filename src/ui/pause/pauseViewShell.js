import { renderActionButton } from '../shared/actionButtonTheme.js';
import { renderModalShell } from '../shared/modalShell.js';
import {
  renderPauseHeader,
  renderPauseTabNavigation,
  renderPauseTabPanels,
} from './pauseViewSections.js';

export function renderPauseViewShell({
  activeTabName,
  timeStr,
  killStr,
  level,
  hp,
  maxHp,
  hpPct,
  hpFillClass,
  hpFillColor,
  hpPctColor,
  weaponCount,
  maxWpnSlots,
  accessoryCount,
  maxAccSlots,
  loadoutPanelHtml,
  statsHtml,
  soundControlsHtml,
  showForfeitButton,
}) {
  const forfeitButton = showForfeitButton
    ? renderActionButton({
        className: 'pv-btn-forfeit',
        id: 'pv-forfeit-btn',
        label: '전투 포기',
        tone: 'danger',
        ariaLabel: '전투 포기',
      })
    : '';
  const resumeButton = renderActionButton({
    className: 'pv-btn-resume',
    id: 'pv-resume-btn',
    label: '재개',
    tone: 'accent',
    ariaLabel: '게임 재개 (ESC)',
    leading: '<span class="pv-btn-arrow" aria-hidden="true"></span>',
    trailing: '<kbd class="pv-kbd">ESC</kbd>',
    stretch: true,
  });

  const bodyHtml = `
    ${renderPauseHeader({
      timeStr,
      killStr,
      level,
      hp,
      maxHp,
      hpPct,
      hpFillClass,
      hpFillColor,
      hpPctColor,
    })}
    ${renderPauseTabNavigation({
      activeTabName,
      weaponCount,
      maxWpnSlots,
      accessoryCount,
      maxAccSlots,
    })}
    ${renderPauseTabPanels({
      activeTabName,
      loadoutPanelHtml,
      statsHtml,
      soundControlsHtml,
    })}
  `;
  const footerHtml = `
    <footer class="pv-footer ui-modal-action-bar">
      ${forfeitButton}
      ${resumeButton}
    </footer>
  `;

  return renderModalShell({
    tone: 'pause',
    shellClassName: 'pv-shell',
    backdropClassName: 'pv-backdrop',
    panelTag: 'div',
    panelClassName: 'pv-panel ui-modal-panel--scroll ui-modal-panel--floating',
    panelAttributes: {
      role: 'dialog',
      'aria-label': '일시정지 메뉴',
      tabindex: '-1',
    },
    bodyHtml,
    footerHtml,
  });
}
