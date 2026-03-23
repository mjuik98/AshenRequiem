import {
  renderSubscreenFooter,
  renderSubscreenHeader,
} from '../shared/subscreenTheme.js';

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
