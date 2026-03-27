import {
  renderSubscreenFooter,
  renderSubscreenHeader,
} from '../shared/subscreenTheme.js';

const TAB_SUMMARY_TEXT = {
  enemy: '선택한 적의 특성과 처치 기록을 먼저 읽고 아래 목록에서 탐색하세요.',
  weapon: '선택한 무기의 핵심 성능과 진화 조건을 먼저 읽고 아래 목록에서 비교하세요.',
  accessory: '선택한 장신구의 효과와 연결된 진화를 먼저 읽고 아래 목록에서 탐색하세요.',
  records: '핵심 기록을 먼저 읽고 아래에서 업적과 해금 진행도를 확인하세요.',
};

export function getCodexTabSummaryText(activeTab = 'enemy') {
  return TAB_SUMMARY_TEXT[activeTab] ?? TAB_SUMMARY_TEXT.enemy;
}

export function renderCodexViewShell({
  discovery,
  activeTab,
  totalEnemies,
  totalWeapons,
  totalAccessories,
}) {
  const discovered = discovery.totalDiscovered;
  return `
    <div class="cx-panel ss-panel">
      ${renderSubscreenHeader({
        headerClass: 'cx-header',
        leftClass: 'cx-header-left',
        runeClass: 'cx-rune',
        titleClass: 'cx-title',
        titleTag: 'h2',
        rune: '📖',
        title: 'Codex',
        right: `<span class="cx-prog-pill ss-pill">${discovered} / ${totalEnemies + totalWeapons + totalAccessories} 발견됨</span>`,
      })}
      <div class="cx-discovery-strip" aria-label="도감 발견 통계">
        ${discovery.entries.map((entry) => `
          <div class="cx-disc-pill ${entry.tone}">
            <span class="cx-disc-label">${entry.icon} ${entry.label}</span>
            <span class="cx-disc-value">${entry.discovered} / ${entry.total}</span>
          </div>
        `).join('')}
      </div>
      <nav class="cx-tabs" role="tablist" aria-label="도감 탭">
        <button class="cx-tab ${activeTab === 'enemy' ? 'active' : ''}" role="tab" aria-selected="${activeTab === 'enemy'}" data-tab="enemy">
          적 도감 <span class="cx-tab-cnt">${totalEnemies}</span>
        </button>
        <button class="cx-tab ${activeTab === 'weapon' ? 'active' : ''}" role="tab" aria-selected="${activeTab === 'weapon'}" data-tab="weapon">
          무기 도감 <span class="cx-tab-cnt">${totalWeapons}</span>
        </button>
        <button class="cx-tab ${activeTab === 'accessory' ? 'active' : ''}" role="tab" aria-selected="${activeTab === 'accessory'}" data-tab="accessory">
          장신구 도감 <span class="cx-tab-cnt">${totalAccessories}</span>
        </button>
        <button class="cx-tab ${activeTab === 'records' ? 'active' : ''}" role="tab" aria-selected="${activeTab === 'records'}" data-tab="records">
          기록
        </button>
      </nav>
      <div class="cx-tab-summary">${getCodexTabSummaryText(activeTab)}</div>
      <div class="cx-content ss-scroll">
        <div class="cx-tab-content ${activeTab === 'enemy' ? 'active' : ''}" id="cx-tab-enemy" role="tabpanel"></div>
        <div class="cx-tab-content ${activeTab === 'weapon' ? 'active' : ''}" id="cx-tab-weapon" role="tabpanel"></div>
        <div class="cx-tab-content ${activeTab === 'accessory' ? 'active' : ''}" id="cx-tab-accessory" role="tabpanel"></div>
        <div class="cx-tab-content ${activeTab === 'records' ? 'active' : ''}" id="cx-tab-records" role="tabpanel"></div>
      </div>
      ${renderSubscreenFooter({
        footerClass: 'cx-footer',
        backButtonClass: 'cx-back-btn',
        backButtonId: 'cx-back-btn',
      })}
    </div>
  `;
}
