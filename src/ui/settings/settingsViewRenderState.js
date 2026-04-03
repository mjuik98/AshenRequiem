import {
  renderSubscreenFooter,
  renderSubscreenHeader,
} from '../shared/subscreenTheme.js';
import {
  SETTINGS_TABS,
  renderSettingsNavItem,
} from './settingsViewSections.js';

function renderSettingsNav(activeTab) {
  return SETTINGS_TABS.map((tab) => renderSettingsNavItem(tab.id, activeTab)).join('');
}

function renderSettingsFooter() {
  return renderSubscreenFooter({
    footerClass: 'sv-footer',
    backButtonClass: 'sv-btn sv-btn-back',
    beforeBack: `
      <button class="sv-btn sv-btn-reset" type="button">기본값 초기화</button>
      <div class="sv-footer-right">
    `,
    afterBack: `
        <button class="sv-btn sv-btn-primary" type="button">저장하고 닫기</button>
      </div>
    `,
  });
}

function captureSettingsShellRefs(view) {
  view._shellRefs = {
    panel: view.el.querySelector('.sv-panel'),
    nav: view.el.querySelector('.sv-sidenav'),
    content: view.el.querySelector('.sv-content'),
  };
}

export function renderSettingsShell({
  activeTab = 'audio',
  sectionHtml = '',
} = {}) {
  return `
    <div class="sv-panel ss-panel" role="dialog" aria-modal="true" aria-label="설정" tabindex="-1">
      ${renderSubscreenHeader({
        headerClass: 'sv-header',
        leftClass: 'sv-header-left',
        headingClass: 'sv-heading',
        runeClass: 'sv-rune',
        titleClass: 'sv-title',
        subtitleClass: 'sv-subtitle',
        titleTag: 'h2',
        rune: '⚙',
        title: 'Settings',
        subtitle: '오디오, 그래픽, 화면 옵션을 조정합니다.',
      })}

      <div class="sv-body">
        <nav class="sv-sidenav" aria-label="설정 탭">
          ${renderSettingsNav(activeTab)}
        </nav>

        <div class="sv-content ss-scroll" role="tabpanel">
          ${sectionHtml}
        </div>
      </div>

      ${renderSettingsFooter()}
    </div>
  `;
}

export function syncSettingsShellState(view, { sectionHtml = '' } = {}) {
  if (!view?._shellRefs?.panel) {
    view.el.innerHTML = renderSettingsShell({
      activeTab: view._tab,
      sectionHtml,
    });
    captureSettingsShellRefs(view);
    return;
  }

  view._shellRefs.nav.innerHTML = renderSettingsNav(view._tab);
  view._shellRefs.content.innerHTML = sectionHtml;
}
