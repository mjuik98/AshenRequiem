import { renderActionButton } from '../shared/actionButtonTheme.js';
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

  return `
    <div class="pv-backdrop"></div>
    <div class="pv-panel" role="dialog" aria-label="일시정지 메뉴">
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
      <footer class="pv-footer">
        ${forfeitButton}
        ${resumeButton}
      </footer>
    </div>
  `;
}
