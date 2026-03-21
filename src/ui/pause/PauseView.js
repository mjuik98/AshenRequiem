/**
 * src/ui/pause/PauseView.js — ESC 일시정지 오버레이 (v3 리디자인)
 *
 * 변경 사항 (v3):
 *   FIX  버튼 기본 가시성 버그 — CSS 변수 대신 rgba 하드코딩으로 항상 표시
 *   NEW  단일 포인트 컬러 #d4af6a 금색으로 전체 통일
 *   NEW  무기 타입 태그: 투사체 / 궤도 / 폭발(areaBurst) / 연쇄 / 진화
 *   NEW  스탯 탭: 크리티컬 데미지 · 데미지 증가 · 경험치 증가 추가
 *   NEW  스탯 수치: 기본값 + 보너스 분리 표시 (200 +42 형식)
 *   NEW  무기 카드: 쿨다운 프로그레스 바 추가
 *   NEW  무기 카드: 진화 조건 힌트 + 레벨 진행도 표시
 *   NEW  헤더: 생존 시간 · 킬 수 · 레벨 3종 run stat
 *   NEW  HP 바: 30% 이하 pulse 경고, 색상 3단계 전환
 *   NEW  장신구: 빈 슬롯(점선) vs 잠금 슬롯(자물쇠) 구분
 *   NEW  탭 전환 fade-up 애니메이션
 *   NEW  푸터 버튼: ESC 단축키 배지
 *   NEW  show()에 world 파라미터 추가 (생존 시간·킬 수 표시용, optional)
 *
 * API 변경:
 *   show({ player, data, onResume, onForfeit?, world?, session? })
 *
 * FIX: synergyData / weaponEvolutionData 직접 import 제거 (R-18 준수)
 *   data 파라미터로 DI 수신
 *
 * FIX: destroy() 시 tooltip DOM 반드시 정리 (TOOLTIP-LEAK)
 */

import { SESSION_OPTION_DEFAULTS } from '../../state/sessionOptions.js';
import { ACTION_BUTTON_SHARED_CSS, renderActionButton } from '../shared/actionButtonTheme.js';
import {
  renderPauseHeader,
  renderPauseTabNavigation,
  renderPauseTabPanels,
} from './pauseViewSections.js';
import {
  buildPauseLoadoutItems,
  getDefaultPauseSelection,
  normalizePauseSynergyRequirementId,
  renderPauseLoadoutPanel,
} from './pauseLoadoutContent.js';
import {
  buildPauseAccessoryTooltipContent,
  buildPauseWeaponTooltipContent,
  formatWeaponSynergyBonus,
} from './pauseTooltipContent.js';

/** 플레이어 기본 스탯 (보너스 산출용) */
const BASE_STATS = {
  moveSpeed:       200,
  magnetRadius:    60,
  lifesteal:       0,
  critChance:      0.05,
  critMultiplier:  2.0,
  xpMult:          1.0,
  globalDamageMult:1.0,
  currencyMult:    1.0,
  projectileSizeMult: 1.0,
  projectileLifetimeMult: 1.0,
};

const PAUSE_AUDIO_DEFAULTS = {
  soundEnabled: SESSION_OPTION_DEFAULTS.soundEnabled,
  musicEnabled: SESSION_OPTION_DEFAULTS.musicEnabled,
  masterVolume: SESSION_OPTION_DEFAULTS.masterVolume,
  bgmVolume: SESSION_OPTION_DEFAULTS.bgmVolume,
  sfxVolume: SESSION_OPTION_DEFAULTS.sfxVolume,
};

export class PauseView {
  constructor(container) {
    this.el = document.createElement('div');
    this.el.className = 'pv-overlay';
    this.el.style.display = 'none';
    this.el.setAttribute('aria-hidden', 'true');

    this._onResume        = null;
    this._onForfeit       = null;
    this._onOptionsChange = null;
    this._tt              = null;
    this._ttHideTimer     = null;
    this._data            = null;
    this._indexes         = null;
    this._player          = null;
    this._world           = null;
    this._session         = null;
    this._loadoutItems    = [];
    this._selectedLoadoutKey = null;
    this._pauseOptions    = { ...PAUSE_AUDIO_DEFAULTS };
    this._activeTabName   = 'loadout';
    this._isClosingToMenu = false;

    this._injectStyles();
    container.appendChild(this.el);
  }

  // ── Public API ────────────────────────────────────────────────────────────

  show({
    player,
    data,
    onResume,
    onForfeit = null,
    onOptionsChange = null,
    world = null,
    session = null,
  }) {
    clearTimeout(this._ttHideTimer);
    this._isClosingToMenu = false;
    this._onResume   = onResume;
    this._onForfeit = onForfeit;
    this._onOptionsChange = onOptionsChange;
    this._data       = data;
    this._indexes    = this._buildIndexes(data);
    this._player     = player;
    this._world      = world;
    this._session    = session;
    this._loadoutItems = buildPauseLoadoutItems({ player });
    this._selectedLoadoutKey = getDefaultPauseSelection({ player })?.selectionKey ?? null;
    this._pauseOptions = {
      ...PAUSE_AUDIO_DEFAULTS,
      ...(session?.options ?? {}),
    };
    this._activeTabName = 'loadout';

    this._render(player, world);
    this._bindTooltips(player);
    this._bindAudioControls();
    this._bindKeyboard();

    this.el.setAttribute('aria-hidden', 'false');
    this.el.style.display = 'flex';
  }

  hide() {
    clearTimeout(this._ttHideTimer);
    this._hideTooltip();
    this._unbindKeyboard();
    this.el.setAttribute('aria-hidden', 'true');
    this.el.style.display = 'none';
    this._onResume        = null;
    this._onForfeit       = null;
    this._onOptionsChange = null;
    this._player          = null;
    this._world           = null;
    this._session         = null;
    this._loadoutItems    = [];
    this._selectedLoadoutKey = null;
    this._pauseOptions    = { ...PAUSE_AUDIO_DEFAULTS };
    this._activeTabName   = 'loadout';
    this._isClosingToMenu = false;
  }

  isVisible() {
    return this.el.style.display !== 'none';
  }

  destroy() {
    clearTimeout(this._ttHideTimer);
    this._unbindKeyboard();
    this._tt?.remove();
    this._tt     = null;
    this._data   = null;
    this._indexes = null;
    this._player = null;
    this._world = null;
    this._session = null;
    this._loadoutItems = [];
    this._selectedLoadoutKey = null;
    this._pauseOptions = { ...PAUSE_AUDIO_DEFAULTS };
    this._isClosingToMenu = false;
    this.el.remove();
  }

  // ── 렌더 ──────────────────────────────────────────────────────────────────

  _render(player, world) {
    const weapons          = player.weapons        ?? [];
    const activeSynergyIds = new Set(player.activeSynergies ?? []);
    const synergyData      = this._data?.synergyData ?? [];
    const activeSynergies  = synergyData.filter(s => activeSynergyIds.has(s.id));

    // HP
    const hp    = Math.ceil(player.hp    ?? 0);
    const maxHp = Math.max(1, Math.ceil(player.maxHp ?? 100));
    const hpPct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
    const hpFillClass = hpPct <= 30 ? 'low' : hpPct <= 60 ? 'mid' : 'high';
    const hpPctColor  = hpPct <= 30 ? '#e74c3c' : hpPct <= 60 ? '#e67e22' : 'rgba(255,255,255,0.55)';
    const hpFillColor = hpPct <= 30 ? '#e74c3c' : hpPct <= 60 ? '#e67e22' : '#c0392b';

    // Run stats (world가 있을 때만)
    const elapsed   = world?.elapsedTime ?? null;
    const killCount = world?.killCount   ?? null;
    const level     = player.level ?? 1;
    const timeStr   = elapsed != null ? _formatTime(elapsed) : '--:--';
    const killStr   = killCount != null ? killCount : '—';
    const loadoutPanelHtml = renderPauseLoadoutPanel({
      items: this._loadoutItems,
      selectedItemKey: this._selectedLoadoutKey,
      player,
      data: this._data,
      indexes: this._indexes,
    });
    const statsHtml = this._renderStats(player, activeSynergies);
    const soundControlsHtml = this._renderSoundControls();
    const forfeitButton = this._onForfeit
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

    this.el.innerHTML = `
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
          activeTabName: this._activeTabName,
          weaponCount: weapons.length,
          maxWpnSlots: player.maxWeaponSlots ?? 3,
          accessoryCount: player.accessories?.length ?? 0,
          maxAccSlots: player.maxAccessorySlots ?? 3,
        })}
        ${renderPauseTabPanels({
          activeTabName: this._activeTabName,
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

    // 버튼 이벤트
    const resumeBtn = this.el.querySelector('#pv-resume-btn');
    resumeBtn?.addEventListener('click', () => {
      if (this._isClosingToMenu) return;
      this._onResume?.();
    });

    const forfeitBtn = this.el.querySelector('#pv-forfeit-btn');
    forfeitBtn?.addEventListener('click', () => {
      if (this._isClosingToMenu) return;
      this._onForfeit?.();
    });

    this._bindTabs();
    this._bindLoadoutSelection();
  }

  // ── 스탯 탭 ──────────────────────────────────────────────────────────────

  _renderStats(player, activeSynergies) {
    const ms   = player.moveSpeed    ?? 200;
    const mag  = player.magnetRadius ?? 60;
    const ls   = (player.lifesteal   ?? 0) * 100;
    const cc   = (player.critChance  ?? 0.05) * 100;
    const cm   = (player.critMultiplier ?? 2.0) * 100;
    const xpm  = (player.xpMult      ?? 1.0) * 100;
    const dmg  = (player.globalDamageMult ?? 1.0) * 100;
    const gold = (player.currencyMult ?? 1.0) * 100;
    const projSize = (player.projectileSizeMult ?? 1.0) * 100;
    const projLifetime = (player.projectileLifetimeMult ?? 1.0) * 100;
    const cd   = player.cooldownMult ?? 1.0;
    const cdBonus = Math.round((1.0 - cd) * 100);
    const bp   = player.bonusProjectileCount ?? 0;
    const wallet = this._session?.meta?.currency ?? 0;

    // 보너스 계산 (base 대비)
    const msBonus  = ms  - BASE_STATS.moveSpeed;
    const magBonus = mag - BASE_STATS.magnetRadius;
    const lsBonus  = ls  - (BASE_STATS.lifesteal * 100);
    const ccBonus  = cc  - (BASE_STATS.critChance * 100);
    const cmBonus  = cm  - (BASE_STATS.critMultiplier * 100);
    const xpmBonus = xpm - (BASE_STATS.xpMult * 100);
    const dmgBonus = dmg - (BASE_STATS.globalDamageMult * 100);
    const goldBonus = gold - (BASE_STATS.currencyMult * 100);
    const projSizeBonus = projSize - (BASE_STATS.projectileSizeMult * 100);
    const projLifetimeBonus = projLifetime - (BASE_STATS.projectileLifetimeMult * 100);

    const st = (icon, key, base, bonus, unit, ariaLabel) => {
      const bonusHtml = bonus > 0.05
        ? `<span class="pv-stat-bonus">+${Math.round(bonus)}</span>`
        : bonus < -0.05
        ? `<span class="pv-stat-bonus neg">${Math.round(bonus)}</span>`
        : '';
      return `
        <div class="pv-stat-cell">
          <div class="pv-sicon" aria-hidden="true">${icon}</div>
          <div class="pv-stat-info">
            <div class="pv-stat-key">${key}</div>
            <div class="pv-stat-val-row" aria-label="${ariaLabel}">
              <span class="pv-stat-base">${base}</span>
              ${bonusHtml}
              ${unit ? `<span class="pv-stat-unit">${unit}</span>` : ''}
            </div>
          </div>
        </div>
      `;
    };

    const synHtml = activeSynergies.length > 0
      ? `<div class="pv-stats-section">
          <div class="pv-sec-label">활성 시너지</div>
          <div class="pv-syn-list">
            ${activeSynergies.map(s => `
              <div class="pv-syn-row">
                <div class="pv-syn-dot" aria-hidden="true"></div>
                <div class="pv-syn-info">
                  <div class="pv-syn-name">${_escapeHtml(s.name ?? s.id)}</div>
                  <div class="pv-syn-desc">${_escapeHtml(s.description ?? '')}</div>
                </div>
                <div class="pv-syn-bonus">${_escapeHtml(formatWeaponSynergyBonus(s.bonus))}</div>
              </div>
            `).join('')}
          </div>
        </div>`
      : '';

    return `
      <div class="pv-stats-section">
        <div class="pv-sec-label">전투 스탯</div>
        <div class="pv-stats-grid">
          ${st('→', '이동 속도',      Math.round(BASE_STATS.moveSpeed), msBonus,  'px/s', `이동 속도 ${Math.round(ms)} px/s`)}
          ${st('◎', '자석 반경',      Math.round(BASE_STATS.magnetRadius), magBonus, 'px', `자석 반경 ${Math.round(mag)} px`)}
          ${st('♥', '흡혈',          Math.round(BASE_STATS.lifesteal*100), lsBonus, '%', `흡혈 ${ls.toFixed(0)}%`)}
          ${st('!', '크리티컬 확률',  Math.round(BASE_STATS.critChance*100), ccBonus, '%', `크리티컬 확률 ${cc.toFixed(0)}%`)}
          ${st('×', '크리티컬 데미지',Math.round(BASE_STATS.critMultiplier*100), cmBonus, '%', `크리티컬 데미지 ${cm.toFixed(0)}%`)}
          ${st('⚔', '데미지 증가',    Math.round(BASE_STATS.globalDamageMult*100), dmgBonus, '%', `데미지 증가 ${dmg.toFixed(0)}%`)}
          ${st('★', '경험치 획득',    100, xpmBonus, '%', `경험치 획득 ${xpm.toFixed(0)}%`)}
          ${st('💰', '골드 획득',     100, goldBonus, '%', `골드 획득 ${gold.toFixed(0)}%`)}
          ${st('◌', '투사체 크기/범위', 100, projSizeBonus, '%', `투사체 크기/범위 ${projSize.toFixed(0)}%`)}
          ${st('⌛', '투사체 지속시간', 100, projLifetimeBonus, '%', `투사체 지속시간 ${projLifetime.toFixed(0)}%`)}
          ${st('⟳', '쿨다운 배율',    `×${cd.toFixed(2)}`, cdBonus, cdBonus > 0 ? '% 단축' : '', `쿨다운 배율 ×${cd.toFixed(2)}`)}
          ${bp > 0 ? st('+', '추가 투사체', 0, bp, '발', `추가 투사체 +${bp}발`) : ''}
          ${st('¤', '보유 재화', wallet.toLocaleString(), 0, '', `보유 재화 ${wallet}`)}
        </div>
      </div>
      ${synHtml}
    `;
  }

  _renderSoundControls() {
    const opts = this._pauseOptions;
    return `
      <div class="pv-sound-panel">
        <div class="pv-sec-label">Quick Audio</div>
        ${this._renderSoundSlider('masterVolume', '마스터 볼륨', opts.masterVolume)}
        ${this._renderSoundSlider('bgmVolume', '배경음악 (BGM)', opts.bgmVolume)}
        ${this._renderSoundSlider('sfxVolume', '효과음 (SFX)', opts.sfxVolume)}

        <div class="pv-sound-toggles">
          ${this._renderSoundToggle('musicEnabled', '배경음악', opts.musicEnabled)}
          ${this._renderSoundToggle('soundEnabled', '효과음', opts.soundEnabled)}
        </div>

        <div class="pv-sound-note">
          변경 즉시 적용됩니다.
        </div>
      </div>
    `;
  }

  _renderSoundSlider(key, label, value) {
    return `
      <label class="pv-sound-row">
        <div class="pv-sound-row-head">
          <span>${_escapeHtml(label)}</span>
          <span id="pv-sound-value-${_escapeAttr(key)}">${value}</span>
        </div>
        <input
          class="pv-audio-slider"
          type="range"
          min="0"
          max="100"
          step="1"
          value="${value}"
          data-sound-key="${_escapeAttr(key)}"
          aria-label="${_escapeAttr(label)}"
        />
      </label>
    `;
  }

  _renderSoundToggle(key, label, enabled) {
    return `
      <button
        class="pv-sound-toggle${enabled ? ' active' : ''}"
        type="button"
        data-toggle-key="${_escapeAttr(key)}"
        aria-pressed="${enabled}"
      >
        <span>${_escapeHtml(label)}</span>
        <span class="pv-sound-toggle-pill">${enabled ? 'ON' : 'OFF'}</span>
      </button>
    `;
  }

  // ── 툴팁 ─────────────────────────────────────────────────────────────────

  _bindTabs() {
    const tabs = [...this.el.querySelectorAll('.pv-tab')];
    if (tabs.length === 0) return;

    tabs.forEach((tab, index) => {
      const activate = () => this._activateTab(tab.dataset.tabName);
      tab.addEventListener('click', activate);
      tab.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activate();
          return;
        }

        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          tabs[(index + 1) % tabs.length]?.focus();
        }

        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          tabs[(index - 1 + tabs.length) % tabs.length]?.focus();
        }

        if (e.key === 'Home') {
          e.preventDefault();
          tabs[0]?.focus();
        }

        if (e.key === 'End') {
          e.preventDefault();
          tabs[tabs.length - 1]?.focus();
        }
      });
    });
  }

  _bindLoadoutSelection() {
    this.el.querySelectorAll('.pv-loadout-card[data-loadout-key]').forEach((card) => {
      const key = card.dataset.loadoutKey;
      if (!key) return;

      card.addEventListener('click', () => this._selectLoadoutItem(key));
      card.addEventListener('focus', () => this._selectLoadoutItem(key));
      card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          this._selectLoadoutItem(key);
        }
      });
    });
  }

  _selectLoadoutItem(selectedLoadoutKey) {
    if (!selectedLoadoutKey || this._selectedLoadoutKey === selectedLoadoutKey) return;
    this._selectedLoadoutKey = selectedLoadoutKey;
    this._renderLoadoutPanel();
  }

  _renderLoadoutPanel() {
    const panel = this.el.querySelector('#pv-tab-loadout');
    if (!panel || !this._player) return;

    panel.innerHTML = renderPauseLoadoutPanel({
      items: this._loadoutItems,
      selectedItemKey: this._selectedLoadoutKey,
      player: this._player,
      data: this._data,
      indexes: this._indexes,
    });
    this._bindLoadoutSelection();
    this._bindTooltips(this._player);
  }

  _activateTab(name) {
    if (!name) return;
    this._activeTabName = name;

    this.el.querySelectorAll('.pv-tab').forEach(tab => {
      const active = tab.dataset.tabName === name;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });

    this.el.querySelectorAll('.pv-tab-content').forEach(panel => {
      panel.classList.toggle('active', panel.id === `pv-tab-${name}`);
    });
  }

  _bindAudioControls() {
    this.el.querySelectorAll('.pv-audio-slider').forEach(input => {
      input.addEventListener('input', (event) => {
        const key = event.currentTarget.dataset.soundKey;
        const value = Number(event.currentTarget.value);
        this._pauseOptions[key] = value;
        const valueEl = this.el.querySelector(`#pv-sound-value-${key}`);
        if (valueEl) valueEl.textContent = String(value);
        this._emitOptionsChange();
      });
    });

    this.el.querySelectorAll('.pv-sound-toggle').forEach(button => {
      button.addEventListener('click', (event) => {
        const key = event.currentTarget.dataset.toggleKey;
        this._pauseOptions[key] = !this._pauseOptions[key];
        event.currentTarget.classList.toggle('active', this._pauseOptions[key]);
        event.currentTarget.setAttribute('aria-pressed', String(this._pauseOptions[key]));
        const pill = event.currentTarget.querySelector('.pv-sound-toggle-pill');
        if (pill) pill.textContent = this._pauseOptions[key] ? 'ON' : 'OFF';
        this._emitOptionsChange();
      });
    });
  }

  _emitOptionsChange() {
    this._onOptionsChange?.({ ...this._pauseOptions });
  }

  _buildIndexes(data) {
    const weaponById    = new Map((data?.weaponData    ?? []).map(w => [w?.id, w]));
    const accessoryById = new Map((data?.accessoryData ?? []).map(a => [a?.id, a]));
    const synergiesByWeaponId = new Map();
    const synergiesByAccessoryId = new Map();

    for (const synergy of data?.synergyData ?? []) {
      for (const req of synergy?.requires ?? []) {
        const id = normalizePauseSynergyRequirementId(req);
        if (!id) continue;

        if (weaponById.has(id)) {
          const list = synergiesByWeaponId.get(id) ?? [];
          list.push(synergy);
          synergiesByWeaponId.set(id, list);
        }

        if (accessoryById.has(id)) {
          const list = synergiesByAccessoryId.get(id) ?? [];
          list.push(synergy);
          synergiesByAccessoryId.set(id, list);
        }
      }
    }

    return { weaponById, accessoryById, synergiesByWeaponId, synergiesByAccessoryId };
  }

  _bindTooltips(player) {
    if (!this._tt) {
      this._tt = document.createElement('div');
      this._tt.className = 'pv-tooltip';
      this._tt.style.display = 'none';
      document.body.appendChild(this._tt);
    }

    const showTip = (el, buildFn, e) => {
      clearTimeout(this._ttHideTimer);
      const html = buildFn(el, player);
      if (!html?.trim()) return;
      this._tt.innerHTML = html;
      this._tt.style.display = 'block';
      this._positionTooltip(e);
    };
    const hideTip = () => {
      this._ttHideTimer = setTimeout(() => this._hideTooltip(), 80);
    };

    const bind = (selector, buildFn) => {
      this.el.querySelectorAll(selector).forEach(el => {
        el.addEventListener('mouseenter', e => showTip(el, buildFn, e));
        el.addEventListener('mousemove',  e => this._positionTooltip(e));
        el.addEventListener('mouseleave', hideTip);
        el.addEventListener('focusin',    e => showTip(el, buildFn, e));
        el.addEventListener('focusout',   hideTip);
      });
    };

    bind('.pv-loadout-card[data-loadout="weapon"]', (el) => buildPauseWeaponTooltipContent({
      weaponId: el.dataset.loadoutId,
      player,
      data: this._data,
      indexes: this._indexes,
    }));
    bind('.pv-loadout-card[data-loadout="accessory"]', (el) => buildPauseAccessoryTooltipContent({
      accessoryId: el.dataset.loadoutId,
      player,
      data: this._data,
      indexes: this._indexes,
    }));
  }

  _hideTooltip() {
    if (!this._tt) return;
    this._tt.style.display = 'none';
    this._tt.innerHTML = '';
  }

  _positionTooltip(e) {
    if (!this._tt) return;
    const pad = 14;
    const w   = this._tt.offsetWidth  || 220;
    const h   = this._tt.offsetHeight || 100;
    const rect = e.target?.getBoundingClientRect?.() ?? { right: 0, top: 0, height: 0 };
    const cx   = e.clientX ?? rect.right;
    const cy   = e.clientY ?? (rect.top + rect.height / 2);
    let x = cx + pad;
    let y = cy - h / 2;
    if (x + w > window.innerWidth  - 8) x = cx - w - pad;
    if (x < 8)                          x = 8;
    if (y + h > window.innerHeight - 8) y = window.innerHeight - h - 8;
    if (y < 8)                          y = 8;
    this._tt.style.left = `${x}px`;
    this._tt.style.top  = `${y}px`;
  }

  // ── 키보드 단축키 ─────────────────────────────────────────────────────────

  _bindKeyboard() {
    this._onKeyDown = (e) => {
      if (!this.isVisible()) return;
      // ESC는 PlayScene._handlePauseToggle()이 단독 처리 (중복 방지)
    };
    window.addEventListener('keydown', this._onKeyDown);
  }

  _unbindKeyboard() {
    if (this._onKeyDown) {
      window.removeEventListener('keydown', this._onKeyDown);
      this._onKeyDown = null;
    }
  }

  // ── 스타일 주입 ───────────────────────────────────────────────────────────

  _injectStyles() {
    if (document.getElementById('pauseview-v3-styles')) return;
    const s = document.createElement('style');
    s.id = 'pauseview-v3-styles';
    s.textContent = `
      ${ACTION_BUTTON_SHARED_CSS}
      /* ── 레이아웃 ── */
      .pv-overlay {
        position: absolute; inset: 0;
        display: flex; align-items: center; justify-content: center;
        z-index: 35;
        font-family: 'Segoe UI', 'Noto Sans KR', sans-serif;
        pointer-events: auto;
      }
      .pv-overlay * {
        pointer-events: auto;
      }
      .pv-backdrop {
        position: absolute; inset: 0;
        background: rgba(4,3,10,0.82);
        backdrop-filter: blur(3px);
      }
      .pv-panel {
        position: relative; z-index: 1;
        width: min(960px, calc(100vw - 24px));
        max-height: calc(100vh - 40px);
        overflow-y: auto;
        overscroll-behavior: contain;
        background: linear-gradient(160deg, rgba(24,18,36,0.98), rgba(10,8,18,0.99));
        border: 1px solid rgba(212,175,106,0.25);
        border-radius: 20px;
        box-shadow: 0 0 0 1px rgba(255,255,255,0.03) inset, 0 32px 80px rgba(0,0,0,0.7);
        animation: pv-enter 0.22s cubic-bezier(0.34,1.56,0.64,1) both;
      }
      @keyframes pv-enter { from{opacity:0;transform:scale(0.91) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }

      /* ── 헤더 ── */
      .pv-header {
        display: flex; align-items: center; justify-content: space-between;
        padding: 20px 24px 14px;
        border-bottom: 1px solid rgba(255,255,255,0.06);
      }
      .pv-pause-badge { display: flex; align-items: center; gap: 9px; }
      .pv-pause-icon {
        width: 26px; height: 26px;
        border: 1.5px solid rgba(212,175,106,0.55); border-radius: 50%;
        display: flex; align-items: center; justify-content: center; gap: 3px;
      }
      .pv-pbar { width: 3px; height: 9px; background: rgba(212,175,106,0.7); border-radius: 1px; }
      .pv-pause-title {
        font-size: 12px; font-weight: 700; letter-spacing: 4px;
        color: #d4af6a; text-transform: uppercase;
      }
      .pv-run-stats { display: flex; align-items: center; gap: 14px; }
      .pv-run-stat  { display: flex; flex-direction: column; align-items: center; gap: 2px; }
      .pv-run-val   { font-size: 14px; font-weight: 700; color: rgba(255,255,255,0.78); line-height: 1; }
      .pv-run-key   { font-size: 9px; letter-spacing: 1.5px; color: rgba(255,255,255,0.25); text-transform: uppercase; }
      .pv-run-div   { width: 1px; height: 20px; background: rgba(255,255,255,0.1); }

      /* ── HP ── */
      .pv-hp-section {
        display: flex; align-items: center; gap: 12px;
        padding: 14px 24px 0;
      }
      .pv-hp-label { font-size: 10px; font-weight: 700; letter-spacing: 2px; color: rgba(255,255,255,0.25); width: 16px; flex-shrink: 0; }
      .pv-hp-track { flex: 1; height: 8px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden; }
      .pv-hp-fill  { height: 100%; border-radius: 4px; transition: width 0.3s ease; position: relative; }
      .pv-hp-fill::after { content:''; position:absolute; top:0; left:0; right:0; height:3px; background:rgba(255,255,255,0.15); border-radius:4px 4px 0 0; }
      .pv-hp-fill.low  { animation: pv-hp-pulse 1.1s ease-in-out infinite; }
      @keyframes pv-hp-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      .pv-hp-meta  { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
      .pv-hp-frac  { font-size: 11px; color: rgba(255,255,255,0.4); }
      .pv-hp-pct   { font-size: 12px; font-weight: 700; min-width: 32px; text-align: right; }
      .pv-hp-warn  { font-size: 9px; font-weight: 700; letter-spacing: 1.5px; color: #e74c3c; text-transform: uppercase; animation: pv-hp-pulse 1.1s infinite; }

      /* ── 탭 ── */
      .pv-tabs {
        display: flex; padding: 14px 24px 0;
        border-bottom: 1px solid rgba(255,255,255,0.06);
        gap: 0;
      }
      .pv-tab {
        padding: 10px 18px; font-size: 11px; font-weight: 700; letter-spacing: 2px;
        color: rgba(255,255,255,0.28); cursor: pointer; border: none; background: none;
        border-bottom: 2px solid transparent; transition: all 0.15s; text-transform: uppercase;
        margin-bottom: -1px;
      }
      .pv-tab:hover { color: rgba(255,255,255,0.55); }
      .pv-tab.active { color: #d4af6a; border-bottom-color: #d4af6a; }
      .pv-tab-cnt {
        display: inline-block; font-size: 10px; background: rgba(255,255,255,0.07);
        border-radius: 10px; padding: 1px 6px; margin-left: 5px; font-weight: 400; letter-spacing: 0;
      }
      .pv-tab.active .pv-tab-cnt { background: rgba(212,175,106,0.14); color: rgba(212,175,106,0.65); }

      .pv-tab-content { display: none; padding: 18px 24px; animation: pv-fade-up 0.14s ease both; }
      .pv-tab-content.active { display: block; }
      @keyframes pv-fade-up { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }

      /* ── 로드아웃 ── */
      .pv-loadout-panel {
        display: grid;
        grid-template-columns: minmax(0, 0.92fr) minmax(300px, 1.08fr);
        gap: 16px;
        align-items: start;
      }
      .pv-loadout-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .pv-loadout-detail {
        display: flex;
        flex-direction: column;
        gap: 12px;
        min-height: 100%;
        padding: 16px;
        border-radius: 16px;
        background: linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.02));
        border: 1px solid rgba(212,175,106,0.18);
        box-shadow: 0 18px 40px rgba(0,0,0,0.28);
      }
      .pv-loadout-card {
        display: flex;
        flex-direction: column;
        gap: 8px;
        text-align: left;
        padding: 14px 15px;
        border-radius: 14px;
        background: linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02));
        border: 1px solid rgba(255,255,255,0.09);
        color: rgba(255,255,255,0.86);
        cursor: pointer;
        transition: border-color 0.15s ease, transform 0.15s ease, background 0.15s ease;
      }
      .pv-loadout-card:hover,
      .pv-loadout-card:focus-visible {
        border-color: rgba(212,175,106,0.26);
        transform: translateY(-1px);
        outline: none;
      }
      .pv-loadout-card.selected,
      .pv-loadout-card[aria-pressed="true"] {
        border-color: rgba(212,175,106,0.58);
        background: linear-gradient(180deg, rgba(212,175,106,0.14), rgba(255,255,255,0.05));
        box-shadow: 0 0 0 1px rgba(212,175,106,0.12) inset;
      }
      .pv-loadout-card.state-rare {
        border-color: rgba(200,143,80,0.36);
        box-shadow: inset 0 1px 0 rgba(231,183,124,0.16);
      }
      .pv-loadout-card.state-synergy-active {
        border-color: rgba(127,201,204,0.36);
        background: linear-gradient(180deg, rgba(96,171,175,0.12), rgba(255,255,255,0.03));
      }
      .pv-loadout-card.state-evolution-ready {
        border-color: rgba(212,175,106,0.7);
        background: linear-gradient(180deg, rgba(212,175,106,0.22), rgba(117,58,28,0.08));
      }
      .pv-loadout-card.state-empty {
        border-style: dashed;
        color: rgba(255,255,255,0.52);
      }
      .pv-loadout-card.state-locked {
        opacity: 0.65;
        color: rgba(255,255,255,0.46);
        background: rgba(0,0,0,0.18);
      }
      .pv-loadout-card-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }
      .pv-loadout-card-badge,
      .pv-loadout-card-kind {
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 1.4px;
        text-transform: uppercase;
      }
      .pv-loadout-card-badge {
        color: #e7c987;
      }
      .pv-loadout-card-kind {
        color: rgba(255,255,255,0.42);
      }
      .pv-loadout-card-name {
        font-size: 15px;
        font-weight: 700;
        color: rgba(255,255,255,0.9);
      }
      .pv-loadout-card-summary {
        font-size: 12px;
        color: rgba(255,255,255,0.56);
        line-height: 1.5;
      }
      .pv-loadout-assist-row {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        padding-top: 2px;
      }
      .pv-loadout-assist-pill {
        display: inline-flex;
        align-items: center;
        padding: 4px 8px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,0.1);
        background: rgba(255,255,255,0.04);
        font-size: 10px;
        color: rgba(255,255,255,0.55);
      }
      .pv-loadout-detail-header,
      .pv-loadout-role-summary,
      .pv-loadout-power,
      .pv-loadout-linked-items,
      .pv-loadout-synergy,
      .pv-loadout-evolution,
      .pv-loadout-guidance {
        padding: 0 0 12px;
        border-bottom: 1px solid rgba(255,255,255,0.06);
      }
      .pv-loadout-guidance {
        border-bottom: 0;
        padding-bottom: 0;
      }
      .pv-loadout-detail-kind {
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 2px;
        text-transform: uppercase;
        color: rgba(212,175,106,0.65);
        margin-bottom: 6px;
      }
      .pv-loadout-detail-name {
        margin: 0 0 6px;
        font-size: 22px;
        line-height: 1.1;
        color: rgba(255,255,255,0.92);
      }
      .pv-loadout-detail-summary,
      .pv-loadout-role-copy,
      .pv-loadout-empty-msg,
      .pv-loadout-evolution-desc,
      .pv-loadout-synergy-desc {
        font-size: 12px;
        line-height: 1.5;
        color: rgba(255,255,255,0.58);
      }
      .pv-loadout-role-copy.muted {
        color: rgba(255,255,255,0.42);
        margin-top: 6px;
      }
      .pv-loadout-section-title {
        margin: 0 0 10px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 1.8px;
        text-transform: uppercase;
        color: rgba(255,255,255,0.42);
      }
      .pv-loadout-power-lines,
      .pv-loadout-progress-block,
      .pv-loadout-link-list,
      .pv-loadout-synergy-list,
      .pv-loadout-evolution-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .pv-loadout-progress-block {
        padding: 10px 12px;
        border-radius: 12px;
        background: rgba(255,255,255,0.025);
        border: 1px solid rgba(255,255,255,0.06);
      }
      .pv-loadout-power-row,
      .pv-loadout-link-row,
      .pv-loadout-synergy-head,
      .pv-loadout-evolution-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .pv-loadout-chip-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .pv-loadout-chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 5px 9px;
        border-radius: 999px;
        background: rgba(127,201,204,0.12);
        border: 1px solid rgba(127,201,204,0.2);
        color: #b7e7ea;
        font-size: 11px;
      }
      .pv-loadout-chip.equipped {
        border-color: rgba(212,175,106,0.28);
        background: rgba(212,175,106,0.12);
        color: #f0d9a1;
      }
      .pv-loadout-chip-meta {
        color: rgba(255,255,255,0.45);
        font-size: 10px;
      }
      .pv-loadout-synergy-row,
      .pv-loadout-evolution-row {
        padding: 10px 12px;
        border-radius: 12px;
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.07);
      }
      .pv-loadout-synergy-row.active,
      .pv-loadout-evolution-row.done {
        border-color: rgba(212,175,106,0.28);
        background: rgba(212,175,106,0.08);
      }

      /* ── 스탯 ── */
      .pv-stats-section { margin-bottom: 20px; }
      .pv-sec-label { font-size: 9px; font-weight: 700; letter-spacing: 2.5px; color: rgba(255,255,255,0.22); text-transform: uppercase; margin-bottom: 10px; }
      .pv-stats-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 7px; }
      .pv-stat-cell {
        background: rgba(255,255,255,0.03); border-radius: 10px; padding: 10px 12px;
        display: flex; align-items: center; gap: 9px;
      }
      .pv-sicon {
        width: 28px; height: 28px; border-radius: 7px; flex-shrink: 0;
        background: rgba(212,175,106,0.1); color: #d4af6a;
        display: flex; align-items: center; justify-content: center; font-size: 12px;
      }
      .pv-stat-info    { min-width: 0; flex: 1; }
      .pv-stat-key     { font-size: 10px; color: rgba(255,255,255,0.28); letter-spacing: 0.3px; margin-bottom: 2px; }
      .pv-stat-val-row { display: flex; align-items: baseline; gap: 4px; }
      .pv-stat-base    { font-size: 14px; font-weight: 700; color: rgba(255,255,255,0.82); }
      .pv-stat-bonus   { font-size: 10px; font-weight: 700; color: #6dba72; }
      .pv-stat-bonus.neg { color: #e74c3c; }
      .pv-stat-unit    { font-size: 10px; color: rgba(255,255,255,0.28); }

      /* 시너지 */
      .pv-syn-list { display: flex; flex-direction: column; gap: 7px; }
      .pv-syn-row  {
        display: flex; align-items: center; gap: 10px;
        background: rgba(212,175,106,0.06); border: 1px solid rgba(212,175,106,0.16);
        border-radius: 9px; padding: 9px 13px;
      }
      .pv-syn-dot   { width: 6px; height: 6px; border-radius: 50%; background: #d4af6a; flex-shrink: 0; }
      .pv-syn-info  { flex: 1; min-width: 0; }
      .pv-syn-name  { font-size: 12px; font-weight: 600; color: #d4af6a; margin-bottom: 2px; }
      .pv-syn-desc  { font-size: 11px; color: rgba(255,255,255,0.32); }
      .pv-syn-bonus { font-size: 11px; font-weight: 700; color: rgba(212,175,106,0.6); background: rgba(212,175,106,0.08); border-radius: 6px; padding: 3px 8px; white-space: nowrap; flex-shrink: 0; }

      .pv-empty-msg { font-size: 12px; color: rgba(255,255,255,0.25); padding: 20px 0; text-align: center; }

      /* ── 사운드 ── */
      .pv-sound-panel {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      .pv-sound-row {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 12px 14px;
        border-radius: 12px;
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.06);
      }
      .pv-sound-row-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 12px;
        color: rgba(255,255,255,0.78);
      }
      .pv-audio-slider {
        width: 100%;
        accent-color: #d4af6a;
      }
      .pv-sound-toggles {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      .pv-sound-toggle {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 12px 14px;
        border-radius: 12px;
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.08);
        color: rgba(255,255,255,0.72);
        cursor: pointer;
      }
      .pv-sound-toggle.active {
        border-color: rgba(212,175,106,0.28);
        background: rgba(212,175,106,0.08);
        color: #e5cc90;
      }
      .pv-sound-toggle-pill {
        font-size: 10px;
        font-weight: 700;
        padding: 3px 8px;
        border-radius: 999px;
        background: rgba(255,255,255,0.08);
      }
      .pv-sound-note {
        font-size: 11px;
        color: rgba(255,255,255,0.35);
      }

      /* ── 푸터 ── BUG FIX: 하드코딩 rgba, hover 전에도 항상 표시 */
      .pv-footer {
        display: flex; gap: 10px; padding: 16px 24px;
        border-top: 1px solid rgba(255,255,255,0.06);
      }
      .pv-btn-forfeit {
        min-width: 132px;
      }
      .pv-btn-forfeit:hover {
        box-shadow: 0 8px 22px rgba(120, 34, 34, 0.24);
      }
      .pv-btn-resume {
        letter-spacing: 2px;
        text-transform: uppercase;
      }
      .pv-btn-resume:hover { box-shadow: 0 8px 24px rgba(212,175,106,0.18); }
      .pv-btn-arrow { width: 0; height: 0; border-style: solid; border-width: 4px 0 4px 7px; border-color: transparent transparent transparent #d4af6a; }

      .pv-kbd {
        font-size: 10px; font-weight: 700;
        background: rgba(212,175,106,0.1); border: 1px solid rgba(212,175,106,0.25);
        border-radius: 5px; padding: 2px 7px; color: rgba(212,175,106,0.55); letter-spacing: 0;
      }

      /* ── JS 툴팁 ── */
      .pv-tooltip {
        position: fixed; z-index: 9999; pointer-events: none;
        background: #12101e; border: 1px solid rgba(212,175,106,0.25);
        border-radius: 10px; padding: 10px 13px;
        font-family: 'Segoe UI', sans-serif; font-size: 12px; color: rgba(255,255,255,0.82);
        min-width: 180px; max-width: 250px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.6); line-height: 1.5;
      }
      .pvt-header { font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.9); margin-bottom: 8px; display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
      .pvt-lv     { font-size: 10px; font-weight: 700; color: #d4af6a; background: rgba(212,175,106,0.12); border-radius: 20px; padding: 1px 7px; border: 1px solid rgba(212,175,106,0.22); }
      .pvt-rarity { font-size: 10px; font-weight: 700; border-radius: 20px; padding: 1px 7px; }
      .pvt-rarity-rare   { color: #d4af6a;         background: rgba(212,175,106,0.12); border: 1px solid rgba(212,175,106,0.22); }
      .pvt-rarity-common { color: rgba(200,190,160,0.6); background: rgba(200,190,160,0.08); border: 1px solid rgba(200,190,160,0.15); }
      .pvt-row    { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 3px; }
      .pvt-key    { color: rgba(255,255,255,0.42); }
      .pvt-val    { color: rgba(255,255,255,0.82); font-weight: 500; text-align: right; }
      .pvt-status { color: #7ecde8; }
      .pvt-divider{ border: 0; border-top: 1px solid rgba(255,255,255,0.08); margin: 7px 0; }
      .pvt-synergy { display: flex; align-items: flex-start; gap: 7px; margin-bottom: 5px; padding: 6px 8px; border-radius: 6px; background: rgba(212,175,106,0.06); border: 1px solid rgba(212,175,106,0.12); }
      .pvt-synergy-active { background: rgba(212,175,106,0.1); border-color: rgba(212,175,106,0.22); }
      .pvt-syn-icon { color: #d4af6a; flex-shrink: 0; font-size: 10px; margin-top: 2px; }
      .pvt-syn-name { font-size: 11px; font-weight: 700; color: #d4af6a; margin-bottom: 1px; }
      .pvt-syn-desc { font-size: 10px; color: rgba(255,255,255,0.4); line-height: 1.4; }
      .pvt-evo      { display: flex; align-items: flex-start; gap: 7px; padding: 6px 8px; border-radius: 6px; background: rgba(212,175,106,0.06); border: 1px solid rgba(212,175,106,0.18); }
      .pvt-evo-done { background: rgba(102,187,106,0.06); border-color: rgba(102,187,106,0.2); }
      .pvt-evo-icon { color: #d4af6a; flex-shrink: 0; font-size: 11px; }
      .pvt-evo-done .pvt-evo-icon { color: #81c784; }
      .pvt-evo-name { font-size: 11px; font-weight: 700; color: #d4af6a; margin-bottom: 1px; }
      .pvt-evo-done .pvt-evo-name { color: #81c784; }
      .pvt-evo-desc { font-size: 10px; color: rgba(255,255,255,0.42); line-height: 1.4; }
      .pvt-meta { font-size: 11px; color: rgba(255,255,255,0.62); margin-bottom: 5px; line-height: 1.45; }
      .pvt-note {
        margin-top: 7px;
        padding-top: 7px;
        border-top: 1px solid rgba(255,255,255,0.08);
        font-size: 10px;
        color: rgba(212,175,106,0.74);
      }

      @media (max-width: 780px) {
        .pv-loadout-panel {
          grid-template-columns: 1fr;
        }
      }
      @media (max-width: 540px) {
        .pv-stats-grid { grid-template-columns: 1fr 1fr; }
        .pv-sound-toggles { grid-template-columns: 1fr; }
        .pv-footer      { flex-direction: column-reverse; }
        .pv-btn-resume, .pv-btn-forfeit { justify-content: center; }
      }
      @media (prefers-reduced-motion: reduce) {
        .pv-panel, .pv-btn-resume, .pv-btn-forfeit, .pv-tab-content { animation: none !important; transition: none !important; }
        .pv-hp-fill.low, .pv-hp-warn { animation: none !important; }
      }
    `;
    document.head.appendChild(s);
  }
}

// ── 유틸 ─────────────────────────────────────────────────────────────────────

function _formatTime(secs) {
  const m  = Math.floor(secs / 60);
  const ss = String(Math.floor(secs % 60)).padStart(2, '0');
  return `${m}:${ss}`;
}

function _escapeHtml(v) {
  return String(v ?? '')
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'","&#39;");
}

function _escapeAttr(v) {
  return _escapeHtml(v).replaceAll('`','&#96;');
}
