/**
 * src/ui/codex/CodexView.js — 도감 DOM UI
 *
 * 탭별 데이터 가공과 마크업 생성을 별도 helper 모듈로 분리한 얇은 오케스트레이터.
 */
import {
  renderSubscreenFooter,
  renderSubscreenHeader,
} from '../shared/subscreenTheme.js';
import {
  buildCodexDiscoverySummary,
} from './codexRecords.js';
import {
  buildCodexEnemyDetailModel,
  buildCodexEnemyGridModel,
  renderCodexEnemyDetail,
  renderCodexEnemyGrid,
  renderCodexEnemyTabShell,
} from './codexEnemyTab.js';
import { renderCodexAccessoryTab } from './codexAccessoryTab.js';
import { renderCodexWeaponTab } from './codexWeaponTab.js';
import { renderCodexRecordsTab } from './codexRecordsTab.js';
import { CODEX_VIEW_CSS, CODEX_VIEW_STYLE_ID } from './codexStyles.js';

export class CodexView {
  constructor(container) {
    this.el = document.createElement('div');
    this.el.className = 'cx-root ss-root';
    this.el.style.display = 'none';
    this._injectStyles();
    container.appendChild(this.el);

    this._onBack = null;
    this._currentTier = 'all';
    this._activeTab = 'enemy';
    this._selectedEnemy = null;
    this._selectedWeapon = null;
    this._selectedAccessory = null;
    this._accessorySearch = '';
    this._accessoryRarityFilter = 'all';
    this._accessoryEffectFilter = 'all';
    this._gameData = null;
    this._session = null;

    this._handleKeyDown = (event) => {
      if (event.key === 'Escape' || event.key === 'Esc') {
        this._onBack?.();
      }
    };
  }

  /**
   * @param {object} gameData
   * @param {object} session
   * @param {Function} onBack
   */
  show(gameData, session, onBack) {
    this._onBack = onBack;
    this._gameData = gameData;
    this._session = session;
    this._currentTier = 'all';
    this._activeTab = 'enemy';
    this._selectedEnemy = null;
    this._selectedWeapon = null;
    this._selectedAccessory = null;
    this._accessorySearch = '';
    this._accessoryRarityFilter = 'all';
    this._accessoryEffectFilter = 'all';

    this._render();
    this.el.style.display = 'block';
    window.addEventListener('keydown', this._handleKeyDown, true);
  }

  destroy() {
    window.removeEventListener('keydown', this._handleKeyDown, true);
    this.el.remove();
  }

  _render() {
    const discovery = buildCodexDiscoverySummary({
      session: this._session,
      gameData: this._gameData,
    });
    const discovered = discovery.totalDiscovered;
    const totalEnemies = discovery.entries.find((entry) => entry.label === '적')?.total ?? 0;
    const totalWeapons = discovery.entries.find((entry) => entry.label === '무기')?.total ?? 0;
    const totalAccessories = discovery.entries.find((entry) => entry.label === '장신구')?.total ?? 0;

    this.el.innerHTML = `
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
          <button class="cx-tab ${this._activeTab === 'enemy' ? 'active' : ''}" role="tab" aria-selected="${this._activeTab === 'enemy'}" data-tab="enemy">
            적 도감 <span class="cx-tab-cnt">${totalEnemies}</span>
          </button>
          <button class="cx-tab ${this._activeTab === 'weapon' ? 'active' : ''}" role="tab" aria-selected="${this._activeTab === 'weapon'}" data-tab="weapon">
            무기 도감 <span class="cx-tab-cnt">${totalWeapons}</span>
          </button>
          <button class="cx-tab ${this._activeTab === 'accessory' ? 'active' : ''}" role="tab" aria-selected="${this._activeTab === 'accessory'}" data-tab="accessory">
            장신구 도감 <span class="cx-tab-cnt">${totalAccessories}</span>
          </button>
          <button class="cx-tab ${this._activeTab === 'records' ? 'active' : ''}" role="tab" aria-selected="${this._activeTab === 'records'}" data-tab="records">
            기록
          </button>
        </nav>
        <div class="cx-content ss-scroll">
          <div class="cx-tab-content ${this._activeTab === 'enemy' ? 'active' : ''}" id="cx-tab-enemy" role="tabpanel"></div>
          <div class="cx-tab-content ${this._activeTab === 'weapon' ? 'active' : ''}" id="cx-tab-weapon" role="tabpanel"></div>
          <div class="cx-tab-content ${this._activeTab === 'accessory' ? 'active' : ''}" id="cx-tab-accessory" role="tabpanel"></div>
          <div class="cx-tab-content ${this._activeTab === 'records' ? 'active' : ''}" id="cx-tab-records" role="tabpanel"></div>
        </div>
        ${renderSubscreenFooter({
          footerClass: 'cx-footer',
          backButtonClass: 'cx-back-btn',
          backButtonId: 'cx-back-btn',
        })}
      </div>
    `;

    this._bindTabEvents();
    this._renderEnemyTab();
    this._renderWeaponTab();
    this._renderAccessoryTab();
    this._renderRecordsTab();

    this.el.querySelector('#cx-back-btn')
      ?.addEventListener('click', () => this._onBack?.());
  }

  _bindTabEvents() {
    const tabs = /** @type {NodeListOf<HTMLButtonElement>} */ (this.el.querySelectorAll('.cx-tab'));
    tabs.forEach((button) => {
      button.addEventListener('click', () => {
        this._setActiveTab(button.dataset.tab ?? 'enemy');
      });
    });
  }

  _setActiveTab(tabName) {
    this._activeTab = tabName;
    this.el.querySelectorAll('.cx-tab').forEach((candidate) => {
      const isActive = candidate.dataset.tab === tabName;
      candidate.classList.toggle('active', isActive);
      candidate.setAttribute('aria-selected', String(isActive));
    });
    this.el.querySelectorAll('.cx-tab-content').forEach((content) => {
      content.classList.toggle('active', content.id === `cx-tab-${tabName}`);
    });
  }

  _showAccessoryCodex(accessoryId) {
    this._selectedAccessory = accessoryId;
    this._setActiveTab('accessory');
    this._renderAccessoryTab();
  }

  _showWeaponCodex(weaponId) {
    this._selectedWeapon = weaponId;
    this._setActiveTab('weapon');
    this._renderWeaponTab();
  }

  _renderEnemyTab() {
    const panel = /** @type {HTMLElement | null} */ (this.el.querySelector('#cx-tab-enemy'));
    if (!panel) return;

    panel.innerHTML = renderCodexEnemyTabShell();

    const searchInput = /** @type {HTMLInputElement | null} */ (panel.querySelector('#cx-enemy-search'));
    searchInput?.addEventListener('input', (event) => {
      const target = /** @type {HTMLInputElement} */ (event.target);
      this._refreshEnemyGrid(target.value);
    });

    const tierButtons = /** @type {NodeListOf<HTMLButtonElement>} */ (panel.querySelectorAll('.cx-tf'));
    tierButtons.forEach((button) => {
      button.addEventListener('click', () => {
        this._currentTier = button.dataset.tier;
        this._selectedEnemy = null;
        tierButtons.forEach((candidate) => candidate.classList.remove('active'));
        button.classList.add('active');
        if (searchInput) searchInput.value = '';
        this._refreshEnemyGrid('');
      });
    });

    this._refreshEnemyGrid('');
  }

  _refreshEnemyGrid(search) {
    const panel = /** @type {HTMLElement | null} */ (this.el.querySelector('#cx-tab-enemy'));
    if (!panel) return;
    const label = /** @type {HTMLElement | null} */ (panel.querySelector('#cx-enemy-label'));
    const grid = /** @type {HTMLElement | null} */ (panel.querySelector('#cx-enemy-grid'));
    const searchInput = /** @type {HTMLInputElement | null} */ (panel.querySelector('#cx-enemy-search'));
    if (!label || !grid) return;

    const model = buildCodexEnemyGridModel({
      enemyData: this._gameData?.enemyData ?? [],
      session: this._session,
      currentTier: this._currentTier,
      selectedEnemyId: this._selectedEnemy,
      search,
    });

    label.textContent = `${model.tierText} · ${model.entries.length}종`;
    grid.innerHTML = renderCodexEnemyGrid(model);

    const cards = /** @type {NodeListOf<HTMLElement>} */ (panel.querySelectorAll('.cx-ecard'));
    cards.forEach((card) => {
      const activate = () => {
        this._selectedEnemy = this._selectedEnemy === card.dataset.id ? null : card.dataset.id;
        this._refreshEnemyGrid(searchInput?.value ?? '');
      };
      card.addEventListener('click', activate);
      card.addEventListener('keydown', /** @param {KeyboardEvent} event */ (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activate();
        }
      });
    });

    this._renderEnemyDetail();
  }

  _renderEnemyDetail() {
    const detailRoot = /** @type {HTMLElement | null} */ (this.el.querySelector('#cx-enemy-detail'));
    if (!detailRoot) return;

    const model = buildCodexEnemyDetailModel({
      enemyData: this._gameData?.enemyData ?? [],
      session: this._session,
      selectedEnemyId: this._selectedEnemy,
    });

    detailRoot.innerHTML = renderCodexEnemyDetail(model);
  }

  _renderWeaponTab() {
    const panel = /** @type {HTMLElement | null} */ (this.el.querySelector('#cx-tab-weapon'));
    if (!panel) return;

    panel.innerHTML = renderCodexWeaponTab({
      weaponData: this._gameData?.weaponData ?? [],
      session: this._session,
      weaponEvolutionData: this._gameData?.weaponEvolutionData ?? [],
      accessoryData: this._gameData?.accessoryData ?? [],
      selectedWeaponId: this._selectedWeapon,
    });

    const cards = /** @type {NodeListOf<HTMLElement>} */ (panel.querySelectorAll('.cx-wcard'));
    cards.forEach((card) => {
      const activate = () => {
        this._selectedWeapon = this._selectedWeapon === card.dataset.wid ? null : card.dataset.wid;
        this._renderWeaponTab();
      };
      card.addEventListener('click', activate);
      card.addEventListener('keydown', /** @param {KeyboardEvent} event */ (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activate();
        }
      });
    });

    const typeButtons = /** @type {NodeListOf<HTMLButtonElement>} */ (panel.querySelectorAll('.cx-tf'));
    const baseGrid = /** @type {HTMLElement | null} */ (panel.querySelector('#cx-wgrid-base'));
    const evolvedGrid = /** @type {HTMLElement | null} */ (panel.querySelector('#cx-wgrid-evo'));
    typeButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const type = button.dataset.wtype;
        typeButtons.forEach((candidate) => candidate.classList.remove('active'));
        button.classList.add('active');
        if (baseGrid) baseGrid.style.display = type === 'all' || type === 'normal' ? '' : 'none';
        if (evolvedGrid) evolvedGrid.style.display = type === 'all' || type === 'evolved' ? '' : 'none';
      });
    });

    const recipeButtons = /** @type {NodeListOf<HTMLButtonElement>} */ (panel.querySelectorAll('[data-accessory-ref]'));
    recipeButtons.forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        const accessoryId = button.dataset.accessoryRef;
        if (accessoryId) this._showAccessoryCodex(accessoryId);
      });
      button.addEventListener('keydown', /** @param {KeyboardEvent} event */ (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          event.stopPropagation();
          const accessoryId = button.dataset.accessoryRef;
          if (accessoryId) this._showAccessoryCodex(accessoryId);
        }
      });
    });
  }

  _renderAccessoryTab() {
    const panel = /** @type {HTMLElement | null} */ (this.el.querySelector('#cx-tab-accessory'));
    if (!panel) return;

    panel.innerHTML = renderCodexAccessoryTab({
      accessoryData: this._gameData?.accessoryData ?? [],
      weaponEvolutionData: this._gameData?.weaponEvolutionData ?? [],
      weaponData: this._gameData?.weaponData ?? [],
      session: this._session,
      search: this._accessorySearch,
      rarityFilter: this._accessoryRarityFilter,
      effectFilter: this._accessoryEffectFilter,
      selectedAccessoryId: this._selectedAccessory,
    });

    const detail = /** @type {HTMLElement | null} */ (panel.querySelector('#cx-accessory-detail'));
    const hint = /** @type {HTMLElement | null} */ (panel.querySelector('.cx-discovery-hint'));
    void detail;
    void hint;

    const searchInput = /** @type {HTMLInputElement | null} */ (panel.querySelector('#cx-accessory-search'));
    searchInput?.addEventListener('input', (event) => {
      const target = /** @type {HTMLInputElement} */ (event.target);
      this._accessorySearch = target.value;
      this._renderAccessoryTab();
    });

    const rarityButtons = /** @type {NodeListOf<HTMLButtonElement>} */ (panel.querySelectorAll('.cx-af'));
    rarityButtons.forEach((button) => {
      button.addEventListener('click', () => {
        this._accessoryRarityFilter = button.dataset.afilter ?? 'all';
        this._renderAccessoryTab();
      });
    });

    const effectButtons = /** @type {NodeListOf<HTMLButtonElement>} */ (panel.querySelectorAll('.cx-ef'));
    effectButtons.forEach((button) => {
      button.addEventListener('click', () => {
        this._accessoryEffectFilter = button.dataset.efilter ?? 'all';
        this._renderAccessoryTab();
      });
    });

    const cards = /** @type {NodeListOf<HTMLElement>} */ (panel.querySelectorAll('.cx-acard'));
    cards.forEach((card) => {
      const activate = () => {
        this._selectedAccessory = this._selectedAccessory === card.dataset.aid ? null : card.dataset.aid;
        this._renderAccessoryTab();
      };
      card.addEventListener('click', activate);
      card.addEventListener('keydown', /** @param {KeyboardEvent} event */ (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activate();
        }
      });
    });

    const linkedWeapons = /** @type {NodeListOf<HTMLButtonElement>} */ (panel.querySelectorAll('[data-weapon-ref]'));
    linkedWeapons.forEach((button) => {
      button.addEventListener('click', () => {
        const weaponId = button.dataset.weaponRef;
        if (weaponId) this._showWeaponCodex(weaponId);
      });
      button.addEventListener('keydown', /** @param {KeyboardEvent} event */ (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          const weaponId = button.dataset.weaponRef;
          if (weaponId) this._showWeaponCodex(weaponId);
        }
      });
    });
  }

  _renderRecordsTab() {
    const panel = /** @type {HTMLElement | null} */ (this.el.querySelector('#cx-tab-records'));
    if (!panel) return;

    panel.innerHTML = renderCodexRecordsTab({
      session: this._session,
      gameData: this._gameData,
    });
  }

  _injectStyles() {
    if (document.getElementById(CODEX_VIEW_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = CODEX_VIEW_STYLE_ID;
    style.textContent = CODEX_VIEW_CSS;
    document.head.appendChild(style);
  }
}
