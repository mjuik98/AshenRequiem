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
 *   NEW  푸터 버튼: ESC / M 단축키 배지
 *   NEW  show()에 world 파라미터 추가 (생존 시간·킬 수 표시용, optional)
 *
 * API 변경:
 *   show(player, data, onResume, onMainMenu?, world?) — world 추가(선택)
 *   PlayUI.showPause() / PlayScene._handlePauseToggle() 에서 world 전달 권장
 *
 * FIX: synergyData / weaponEvolutionData 직접 import 제거 (R-18 준수)
 *   data 파라미터로 DI 수신
 *
 * FIX: destroy() 시 tooltip DOM 반드시 정리 (TOOLTIP-LEAK)
 */

// ── 상수 ─────────────────────────────────────────────────────────────────────
const GOLD          = '#d4af6a';
const GOLD_DIM      = 'rgba(212,175,106,0.55)';
const GOLD_BG       = 'rgba(212,175,106,0.1)';
const GOLD_BORDER   = 'rgba(212,175,106,0.28)';

/** behaviorId → 타입 태그 매핑 */
const WEAPON_TYPE_TAG = {
  targetProjectile: { label: '투사체', cls: 't-proj'  },
  orbit:            { label: '궤도',   cls: 't-orbit' },
  areaBurst:        { label: '폭발',   cls: 't-burst' },
  boomerang:        { label: '투사체', cls: 't-proj'  },
  chainLightning:   { label: '연쇄',   cls: 't-chain' },
  omnidirectional:  { label: '투사체', cls: 't-proj'  },
};

/** 플레이어 기본 스탯 (보너스 산출용) */
const BASE_STATS = {
  moveSpeed:       200,
  magnetRadius:    60,
  lifesteal:       0,
  critChance:      0.05,
  critMultiplier:  2.0,
  xpMult:          1.0,
  globalDamageMult:1.0,
};

export class PauseView {
  constructor(container) {
    this.el = document.createElement('div');
    this.el.className = 'pv-overlay';
    this.el.style.display = 'none';
    this.el.setAttribute('aria-hidden', 'true');

    this._onResume        = null;
    this._onMainMenu      = null;
    this._tt              = null;
    this._ttHideTimer     = null;
    this._data            = null;
    this._indexes         = null;
    this._isClosingToMenu = false;

    this._injectStyles();
    container.appendChild(this.el);
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * @param {object}        player
   * @param {object}        data          GameDataLoader 반환값
   * @param {Function}      onResume
   * @param {Function|null} onMainMenu
   * @param {object|null}   world         선택 — 생존시간·킬수 표시용
   */
  show(player, data, onResume, onMainMenu = null, world = null) {
    clearTimeout(this._ttHideTimer);
    this._isClosingToMenu = false;
    this._onResume   = onResume;
    this._onMainMenu = onMainMenu;
    this._data       = data;
    this._indexes    = this._buildIndexes(data);

    this._render(player, world);
    this._bindTooltips(player);
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
    this._onMainMenu      = null;
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
    this._isClosingToMenu = false;
    this.el.remove();
  }

  // ── 렌더 ──────────────────────────────────────────────────────────────────

  _render(player, world) {
    const weapons          = player.weapons        ?? [];
    const accessories      = player.accessories    ?? [];
    const maxWpnSlots      = player.maxWeaponSlots ?? 3;
    const maxAccSlots      = player.maxAccessorySlots ?? 3;
    const activeSynergyIds = new Set(player.activeSynergies ?? []);
    const synergyData      = this._data?.synergyData ?? [];
    const activeSynergies  = synergyData.filter(s => activeSynergyIds.has(s.id));
    const bonusProjs       = player.bonusProjectileCount ?? 0;

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

    this.el.innerHTML = `
      <div class="pv-backdrop"></div>
      <div class="pv-panel" role="dialog" aria-label="일시정지 메뉴">

        <!-- ── 헤더 ── -->
        <header class="pv-header">
          <div class="pv-pause-badge">
            <div class="pv-pause-icon" aria-hidden="true">
              <div class="pv-pbar"></div><div class="pv-pbar"></div>
            </div>
            <span class="pv-pause-title">Paused</span>
          </div>
          <div class="pv-run-stats" aria-label="현재 런 정보">
            <div class="pv-run-stat"><span class="pv-run-val">${_escapeHtml(timeStr)}</span><span class="pv-run-key">생존</span></div>
            <div class="pv-run-div"></div>
            <div class="pv-run-stat"><span class="pv-run-val">${_escapeHtml(String(killStr))}</span><span class="pv-run-key">킬</span></div>
            <div class="pv-run-div"></div>
            <div class="pv-run-stat"><span class="pv-run-val">Lv.${level}</span><span class="pv-run-key">레벨</span></div>
          </div>
        </header>

        <!-- ── HP 바 ── -->
        <section class="pv-hp-section" aria-label="체력">
          <span class="pv-hp-label">HP</span>
          <div class="pv-hp-track">
            <div class="pv-hp-fill ${hpFillClass}" style="width:${hpPct}%;background:${hpFillColor}"></div>
          </div>
          <div class="pv-hp-meta">
            <span class="pv-hp-frac">${hp} / ${maxHp}</span>
            <span class="pv-hp-pct" style="color:${hpPctColor}">${Math.round(hpPct)}%</span>
            ${hpPct <= 30 ? '<span class="pv-hp-warn" aria-live="assertive">위험</span>' : ''}
          </div>
        </section>

        <!-- ── 탭 네비 ── -->
        <nav class="pv-tabs" role="tablist" aria-label="정보 탭">
          <button class="pv-tab active" type="button" role="tab" aria-selected="true" data-tab-name="weapons">
            무기 <span class="pv-tab-cnt">${weapons.length}/${maxWpnSlots}</span>
          </button>
          <button class="pv-tab" type="button" role="tab" aria-selected="false" data-tab-name="accessories">
            장신구 <span class="pv-tab-cnt">${accessories.length}/${maxAccSlots}</span>
          </button>
          <button class="pv-tab" type="button" role="tab" aria-selected="false" data-tab-name="stats">
            스탯
          </button>
        </nav>

        <!-- ── 무기 탭 ── -->
        <div class="pv-tab-content active" id="pv-tab-weapons" role="tabpanel">
          <div class="pv-weapon-list">
            ${weapons.length > 0
              ? weapons.map(w => this._renderWeaponCard(w, bonusProjs, player)).join('')
              : '<div class="pv-empty-msg">보유 무기 없음</div>'}
          </div>
        </div>

        <!-- ── 장신구 탭 ── -->
        <div class="pv-tab-content" id="pv-tab-accessories" role="tabpanel">
          <div class="pv-acc-grid">
            ${this._renderAccessoryGrid(accessories, maxAccSlots)}
          </div>
        </div>

        <!-- ── 스탯 탭 ── -->
        <div class="pv-tab-content" id="pv-tab-stats" role="tabpanel">
          ${this._renderStats(player, activeSynergies)}
        </div>

        <!-- ── 푸터 ── -->
        <footer class="pv-footer">
          <button class="pv-btn-resume" id="pv-resume-btn" type="button" aria-label="게임 재개 (ESC)">
            <span class="pv-btn-arrow" aria-hidden="true"></span>
            재개
            <kbd class="pv-kbd">ESC</kbd>
          </button>
          ${this._onMainMenu != null
            ? `<button class="pv-btn-menu" id="pv-menu-btn" type="button" aria-label="메인메뉴로 (M)">
                메인메뉴 <kbd class="pv-kbd pv-kbd-dim">M</kbd>
               </button>`
            : ''}
        </footer>

      </div>
    `;

    // 버튼 이벤트
    const resumeBtn = this.el.querySelector('#pv-resume-btn');
    resumeBtn?.addEventListener('click', () => {
      if (this._isClosingToMenu) return;
      this._onResume?.();
    });

    const menuBtn = this.el.querySelector('#pv-menu-btn');
    menuBtn?.addEventListener('click', () => {
      if (this._isClosingToMenu || !this._onMainMenu) return;
      this._isClosingToMenu = true;
      resumeBtn?.setAttribute('disabled', 'disabled');
      menuBtn.setAttribute('disabled', 'disabled');
      this._onMainMenu();
    });

    this._bindTabs();
  }

  // ── 무기 카드 ─────────────────────────────────────────────────────────────

  _renderWeaponCard(weapon, bonusProjs, player) {
    const isEvolved   = !!weapon.isEvolved;
    const behaviorId  = weapon.behaviorId ?? 'targetProjectile';
    const typeInfo    = isEvolved
      ? { label: '진화', cls: 't-evo' }
      : (WEAPON_TYPE_TAG[behaviorId] ?? { label: '투사체', cls: 't-proj' });

    const maxLevel  = weapon.maxLevel ?? 5;
    const level     = weapon.level    ?? 1;
    const cooldown  = weapon.cooldown ?? 1;
    const currentCd = weapon.currentCooldown ?? 0;
    const cdRatio   = Math.max(0, Math.min(1, (cooldown - currentCd) / cooldown));
    const isReady   = currentCd <= 0.05;
    const cdText    = isReady ? 'Ready' : `${Math.max(0, currentCd).toFixed(1)}s`;

    const totalProj = (weapon.projectileCount ?? 1) + Math.floor(bonusProjs);

    const pips = Array.from({ length: maxLevel }, (_, i) =>
      `<div class="pv-pip${i < level ? ' filled' : ''}"></div>`
    ).join('');

    // 진화 힌트
    const evoHint = this._buildEvoHintForWeapon(weapon.id, player);

    // 부가 스탯
    const extraStats = [];
    if (weapon.pierce != null && !['orbit','areaBurst'].includes(behaviorId)) {
      extraStats.push(`관통 <b>×${weapon.pierce}</b>`);
    }
    if (totalProj > 1) extraStats.push(`${totalProj}발`);
    if (weapon.range  != null && behaviorId === 'areaBurst') {
      extraStats.push(`범위 <b>${Math.round(weapon.range ?? weapon.radius ?? 80)}px</b>`);
    }
    if (weapon.orbitCount) extraStats.push(`구체 <b>×${weapon.orbitCount + Math.floor(bonusProjs)}</b>`);

    return `
      <div class="pv-wcard${isEvolved ? ' evolved' : ''}" data-tip-weapon="${_escapeAttr(weapon.id ?? '')}" tabindex="0" role="group" aria-label="${_escapeAttr(weapon.name ?? '무기')} 상세 정보">
        <div class="pv-wcard-top">
          <div class="pv-wicon" aria-hidden="true">
            ${_weaponEmoji(behaviorId)}
            ${isEvolved ? '<div class="pv-evo-crown" aria-label="진화 무기">★</div>' : ''}
          </div>
          <div class="pv-winfo">
            <div class="pv-wname">
              ${_escapeHtml(weapon.name ?? weapon.id ?? '무기')}
              <span class="pv-wtag ${typeInfo.cls}" aria-label="무기 타입">${typeInfo.label}</span>
            </div>
            <div class="pv-wstats">
              <span class="pv-wst">DMG <b>${weapon.damage ?? '—'}</b></span>
              <span class="pv-wst">CD <b>${cooldown.toFixed(1)}s</b></span>
              ${extraStats.map(s => `<span class="pv-wst">${s}</span>`).join('')}
            </div>
          </div>
          <div class="pv-wright" aria-label="레벨 ${level}/${maxLevel}">
            <div class="pv-level-pips">${pips}</div>
          </div>
        </div>

        <!-- 쿨다운 프로그레스 바 -->
        <div class="pv-cd-row" aria-label="쿨다운 ${cdText}">
          <div class="pv-cd-dot ${isReady ? 'ready' : 'cooling'}" aria-hidden="true"></div>
          <div class="pv-cd-track">
            <div class="pv-cd-fill ${isReady ? 'ready' : 'cooling'}" style="width:${Math.round(cdRatio * 100)}%"></div>
          </div>
          <span class="pv-cd-text${isReady ? ' ready' : ''}">${cdText}</span>
        </div>

        ${evoHint}
      </div>
    `;
  }

  _buildEvoHintForWeapon(weaponId, player) {
    const evoData = this._data?.weaponEvolutionData ?? [];
    const recipe  = evoData.find(r => r.requires?.weaponId === weaponId);
    if (!recipe) return '';

    const alreadyEvolved = player.evolvedWeapons?.has(recipe.id);
    if (alreadyEvolved) return '';

    const accessoryById = this._indexes?.accessoryById ?? new Map();
    const accNames = (recipe.requires?.accessoryIds ?? [])
      .map(id => accessoryById.get(id)?.name ?? id)
      .join(', ');

    const weapon   = player.weapons?.find(w => w.id === weaponId);
    const maxLevel = (this._data?.weaponData ?? []).find(w => w.id === weaponId)?.maxLevel ?? 5;
    const curLevel = weapon?.level ?? 0;

    const pips = Array.from({ length: maxLevel }, (_, i) =>
      `<div class="pv-evo-pip${i < curLevel ? ' done' : ''}"></div>`
    ).join('');

    return `
      <div class="pv-evo-hint" aria-label="진화 조건">
        <span class="pv-evo-hint-icon" aria-hidden="true">✦</span>
        <span class="pv-evo-hint-text">
          Lv.MAX${accNames ? ` + <strong>${_escapeHtml(accNames)}</strong>` : ''} 보유 시 진화
        </span>
        <div class="pv-evo-pips" aria-label="레벨 진행도">${pips}</div>
      </div>
    `;
  }

  // ── 장신구 그리드 ─────────────────────────────────────────────────────────

  _renderAccessoryGrid(accessories, maxAccSlots) {
    const items = [];

    for (let i = 0; i < maxAccSlots; i++) {
      const acc = accessories[i];
      if (acc) {
        const isRare = acc.rarity === 'rare';
        const lvPips = Array.from({ length: acc.maxLevel ?? 5 }, (_, j) =>
          `<div class="pv-pip${j < (acc.level ?? 1) ? ' filled' : ''}"></div>`
        ).join('');

        items.push(`
          <div class="pv-acard${isRare ? ' rare' : ''}" data-tip-acc="${_escapeAttr(acc.id ?? '')}" tabindex="0" role="group" aria-label="${_escapeAttr(acc.name ?? '장신구')} 상세">
            <div class="pv-acard-head">
              <div class="pv-aicon-wrap" aria-hidden="true">💎</div>
              <span class="pv-rarity-badge ${isRare ? 'rb-rare' : 'rb-common'}">${isRare ? '희귀' : '일반'}</span>
            </div>
            <div class="pv-aname">${_escapeHtml(acc.name ?? acc.id ?? '장신구')}</div>
            <div class="pv-aeffect">${_escapeHtml(acc.description ?? '')}</div>
            <div class="pv-alevel-row">
              <div class="pv-level-pips">${lvPips}</div>
              <span class="pv-alv-label">Lv.${acc.level ?? 1}</span>
            </div>
          </div>
        `);
      } else {
        // 빈 슬롯 (해금됨 — 점선 테두리)
        items.push(`
          <div class="pv-slot-empty" aria-label="빈 장신구 슬롯">
            <div class="pv-slot-ring" aria-hidden="true"></div>
            <span class="pv-slot-text">빈 슬롯</span>
          </div>
        `);
      }
    }

    // 잠금 슬롯: maxAccSlots 이상은 상점 해금 필요
    const totalSlotDisplay = Math.min(maxAccSlots + 1, 6);
    for (let i = maxAccSlots; i < totalSlotDisplay; i++) {
      items.push(`
        <div class="pv-slot-locked" aria-label="잠긴 장신구 슬롯 — 상점에서 해금">
          <div class="pv-lock-wrap" aria-hidden="true">
            <div class="pv-lock-arc"></div>
            <div class="pv-lock-body"></div>
          </div>
          <span class="pv-slot-text">상점 해금</span>
        </div>
      `);
    }

    return items.join('');
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
    const cd   = player.cooldownMult ?? 1.0;
    const cdBonus = Math.round((1.0 - cd) * 100);
    const bp   = player.bonusProjectileCount ?? 0;

    // 보너스 계산 (base 대비)
    const msBonus  = ms  - BASE_STATS.moveSpeed;
    const magBonus = mag - BASE_STATS.magnetRadius;
    const lsBonus  = ls  - (BASE_STATS.lifesteal * 100);
    const ccBonus  = cc  - (BASE_STATS.critChance * 100);
    const cmBonus  = cm  - (BASE_STATS.critMultiplier * 100);
    const xpmBonus = xpm - (BASE_STATS.xpMult * 100);
    const dmgBonus = dmg - (BASE_STATS.globalDamageMult * 100);

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
                <div class="pv-syn-bonus">${_escapeHtml(_formatSynergyBonus(s.bonus))}</div>
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
          ${st('⟳', '쿨다운 배율',    `×${cd.toFixed(2)}`, cdBonus, cdBonus > 0 ? '% 단축' : '', `쿨다운 배율 ×${cd.toFixed(2)}`)}
          ${bp > 0 ? st('+', '추가 투사체', 0, bp, '발', `추가 투사체 +${bp}발`) : ''}
        </div>
      </div>
      ${synHtml}
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

  _activateTab(name) {
    if (!name) return;

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

  _buildIndexes(data) {
    const weaponById    = new Map((data?.weaponData    ?? []).map(w => [w?.id, w]));
    const accessoryById = new Map((data?.accessoryData ?? []).map(a => [a?.id, a]));
    const synergiesByWeaponId = new Map();

    for (const synergy of data?.synergyData ?? []) {
      for (const req of synergy?.requires ?? []) {
        const id = typeof req === 'string'
          ? (req.startsWith('up_') ? req.slice(3) : req.startsWith('get_') ? req.slice(4) : req)
          : null;
        if (!id) continue;
        const list = synergiesByWeaponId.get(id) ?? [];
        list.push(synergy);
        synergiesByWeaponId.set(id, list);
      }
    }

    return { weaponById, accessoryById, synergiesByWeaponId };
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

    bind('[data-tip-weapon]', (el) => this._buildWeaponTip(el.dataset.tipWeapon, player));
    bind('[data-tip-acc]',    (el) => this._buildAccTip(el.dataset.tipAcc, player));
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

  _buildWeaponTip(weaponId, player) {
    const weapon = player.weapons?.find(w => w.id === weaponId);
    if (!weapon) return '';

    const evoData           = this._data?.weaponEvolutionData ?? [];
    const accessoryById     = this._indexes?.accessoryById ?? new Map();
    const relatedSynergies  = this._indexes?.synergiesByWeaponId?.get(weaponId) ?? [];
    const activeSynergyIds  = new Set(player.activeSynergies ?? []);
    const bonusProjs        = player.bonusProjectileCount ?? 0;
    const totalProj         = (weapon.projectileCount ?? 1) + Math.floor(bonusProjs);

    const stats = [
      ['데미지',    weapon.damage],
      ['쿨다운',    _formatSeconds(weapon.cooldown, 2)],
      ['관통',      weapon.pierce != null && !['orbit','areaBurst'].includes(weapon.behaviorId) ? weapon.pierce : null],
      ['투사체',    totalProj > 1 ? totalProj : null],
      ['사거리',    weapon.range  != null ? `${Math.round(weapon.range)}px`       : null],
      ['오라 반경', weapon.orbitRadius != null ? `${Math.round(weapon.orbitRadius)}px` : null],
    ].filter(([, v]) => v != null && v !== '');

    const statsHtml = stats.map(([k, v]) =>
      `<div class="pvt-row"><span class="pvt-key">${_escapeHtml(k)}</span><span class="pvt-val">${_escapeHtml(String(v))}</span></div>`
    ).join('');

    const statusHtml = weapon.statusEffectId
      ? (() => {
          const label = { slow:'슬로우', poison:'독', stun:'스턴' }[weapon.statusEffectId] ?? weapon.statusEffectId;
          const pct   = Math.round((weapon.statusEffectChance ?? 1) * 100);
          return `<div class="pvt-row"><span class="pvt-key">상태이상</span><span class="pvt-val pvt-status">${_escapeHtml(label)} ${pct}%</span></div>`;
        })()
      : '';

    const synHtml = relatedSynergies.map(s => {
      const active = activeSynergyIds.has(s.id);
      return `<div class="pvt-synergy${active ? ' pvt-synergy-active' : ''}">
        <span class="pvt-syn-icon">${active ? '✦' : '◇'}</span>
        <div><div class="pvt-syn-name">${_escapeHtml(s.name ?? s.id)}</div><div class="pvt-syn-desc">${_escapeHtml(s.description ?? '')}</div></div>
      </div>`;
    }).join('');

    const evoRecipe = evoData.find(r => r.requires?.weaponId === weaponId);
    const evoHtml   = evoRecipe
      ? (() => {
          const done  = player.evolvedWeapons?.has(evoRecipe.id);
          const names = (evoRecipe.requires?.accessoryIds ?? []).map(id => accessoryById.get(id)?.name ?? id).join(', ');
          return `<div class="pvt-divider"></div>
            <div class="pvt-evo${done ? ' pvt-evo-done' : ''}">
              <span class="pvt-evo-icon">${done ? '✓' : '✨'}</span>
              <div>
                <div class="pvt-evo-name">${done ? '진화 완료' : '진화 조건'}</div>
                <div class="pvt-evo-desc">Lv.MAX${names ? ` + ${_escapeHtml(names)}` : ''} 보유 시 진화</div>
              </div>
            </div>`;
        })()
      : '';

    return `
      <div class="pvt-header">${_escapeHtml(weapon.name ?? weapon.id ?? '무기')} <span class="pvt-lv">Lv.${weapon.level ?? 1}</span></div>
      ${statsHtml}${statusHtml}
      ${relatedSynergies.length > 0 ? '<div class="pvt-divider"></div>' + synHtml : ''}
      ${evoHtml}
    `;
  }

  _buildAccTip(accessoryId, player) {
    const acc = player.accessories?.find(a => a.id === accessoryId);
    if (!acc) return '';

    const evoData    = this._data?.weaponEvolutionData ?? [];
    const weaponById = this._indexes?.weaponById ?? new Map();

    const statLabel = {
      moveSpeed:'이동 속도', maxHp:'최대 HP', lifesteal:'흡혈',
      magnetRadius:'자석 반경', invincibleDuration:'무적 시간',
      damageMult:'데미지 배율', cooldownMult:'쿨다운 단축',
      projectileSpeedMult:'투사체 속도', projectileSizeMult:'투사체 크기',
      xpMult:'경험치 배율', critChance:'크리티컬 확률',
      critMultiplier:'크리티컬 배율', bonusProjectileCount:'추가 투사체',
    };

    const effHtml = (acc.effects ?? []).map(e => {
      const label = statLabel[e?.stat] ?? (e?.stat ?? '효과');
      const isRatio = ['Mult','lifesteal','critChance'].some(k => (e?.stat ?? '').includes(k));
      const val = isRatio
        ? `${(e?.value ?? 0) > 0 ? '+' : ''}${Math.round((e?.value ?? 0) * 100)}%`
        : `${(e?.value ?? 0) > 0 ? '+' : ''}${e?.value ?? 0}`;
      return `<div class="pvt-row"><span class="pvt-key">${_escapeHtml(label)}</span><span class="pvt-val">${_escapeHtml(val)}</span></div>`;
    }).join('');

    const evoRecipes = evoData.filter(r => r.requires?.accessoryIds?.includes(accessoryId));
    const evoHtml    = evoRecipes.map(r => {
      const done = player.evolvedWeapons?.has(r.id);
      const wName = weaponById.get(r.requires?.weaponId)?.name ?? r.requires?.weaponId ?? '무기';
      return `<div class="pvt-evo${done ? ' pvt-evo-done' : ''}">
        <span class="pvt-evo-icon">${done ? '✓' : '✨'}</span>
        <div>
          <div class="pvt-evo-name">${done ? '진화 완료' : '진화 조건'}</div>
          <div class="pvt-evo-desc">${_escapeHtml(wName)} Lv.MAX 달성 시 진화 가능</div>
        </div>
      </div>`;
    }).join('');

    const rarityLabel = acc.rarity === 'rare' ? '희귀' : '일반';

    return `
      <div class="pvt-header">${_escapeHtml(acc.name ?? acc.id ?? '장신구')} <span class="pvt-rarity pvt-rarity-${_escapeAttr(acc.rarity ?? 'common')}">${rarityLabel}</span></div>
      ${effHtml}
      ${evoRecipes.length > 0 ? '<div class="pvt-divider"></div>' + evoHtml : ''}
    `;
  }

  // ── 키보드 단축키 ─────────────────────────────────────────────────────────

  _bindKeyboard() {
    this._onKeyDown = (e) => {
      if (!this.isVisible()) return;
      // ESC는 PlayScene._handlePauseToggle()이 단독 처리 (중복 방지)
      if (e.key === 'm' || e.key === 'M') {
        if (this._onMainMenu && !this._isClosingToMenu) {
          e.preventDefault();
          this._isClosingToMenu = true;
          this._onMainMenu();
        }
      }
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
      /* ── 레이아웃 ── */
      .pv-overlay {
        position: absolute; inset: 0;
        display: flex; align-items: center; justify-content: center;
        z-index: 35;
        font-family: 'Segoe UI', 'Noto Sans KR', sans-serif;
      }
      .pv-backdrop {
        position: absolute; inset: 0;
        background: rgba(4,3,10,0.82);
        backdrop-filter: blur(3px);
      }
      .pv-panel {
        position: relative; z-index: 1;
        width: min(700px, calc(100vw - 24px));
        max-height: calc(100vh - 40px);
        overflow-y: auto;
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

      /* ── 무기 카드 ── */
      .pv-weapon-list { display: flex; flex-direction: column; gap: 9px; }
      .pv-wcard {
        background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
        border-radius: 12px; padding: 12px 14px; cursor: default;
        transition: border-color 0.15s, background 0.15s; outline: none;
      }
      .pv-wcard:hover, .pv-wcard:focus-visible { background: rgba(255,255,255,0.055); border-color: rgba(212,175,106,0.3); }
      .pv-wcard.evolved { border-color: rgba(212,175,106,0.28); background: rgba(212,175,106,0.04); }
      .pv-wcard.evolved:hover, .pv-wcard.evolved:focus-visible { border-color: rgba(212,175,106,0.48); }

      .pv-wcard-top { display: grid; grid-template-columns: 48px 1fr auto; gap: 12px; align-items: center; margin-bottom: 10px; }
      .pv-wicon {
        width: 48px; height: 48px; border-radius: 10px;
        background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
        display: flex; align-items: center; justify-content: center; font-size: 20px;
        position: relative; flex-shrink: 0;
      }
      .pv-evo-crown {
        position: absolute; top: -6px; right: -6px; width: 14px; height: 14px;
        border-radius: 50%; background: rgba(212,175,106,0.2); border: 1px solid rgba(212,175,106,0.35);
        font-size: 8px; display: flex; align-items: center; justify-content: center; color: #d4af6a;
      }
      .pv-winfo { min-width: 0; }
      .pv-wname { font-size: 14px; font-weight: 700; color: rgba(255,255,255,0.88); margin-bottom: 4px; display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
      .pv-wtag { font-size: 9px; font-weight: 700; letter-spacing: 1.5px; padding: 2px 7px; border-radius: 4px; text-transform: uppercase; }
      .t-evo    { background: rgba(212,175,106,0.18); color: #d4af6a;   border: 1px solid rgba(212,175,106,0.3); }
      .t-orbit  { background: rgba(100,195,230,0.12); color: #7ecde8;  border: 1px solid rgba(100,195,230,0.22); }
      .t-proj   { background: rgba(220,200,100,0.12); color: #d4c85a;  border: 1px solid rgba(220,200,100,0.22); }
      .t-chain  { background: rgba(170,140,220,0.12); color: #b89fd4;  border: 1px solid rgba(170,140,220,0.22); }
      .t-burst  { background: rgba(220,160,80,0.14);  color: #d4965a;  border: 1px solid rgba(220,160,80,0.25); }
      .pv-wstats { display: flex; gap: 12px; flex-wrap: wrap; }
      .pv-wst    { font-size: 11px; color: rgba(255,255,255,0.3); }
      .pv-wst b  { color: rgba(255,255,255,0.6); font-weight: 600; }

      .pv-wright { display: flex; flex-direction: column; align-items: flex-end; gap: 5px; flex-shrink: 0; }
      .pv-level-pips { display: flex; gap: 3px; }
      .pv-pip { width: 7px; height: 7px; border-radius: 50%; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15); }
      .pv-pip.filled { background: #d4af6a; border-color: #d4af6a; }

      /* 쿨다운 바 */
      .pv-cd-row  { display: flex; align-items: center; gap: 9px; }
      .pv-cd-dot  { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
      .pv-cd-dot.ready   { background: #66bb6a; }
      .pv-cd-dot.cooling { background: #ffa726; }
      .pv-cd-track { flex: 1; height: 3px; background: rgba(255,255,255,0.08); border-radius: 2px; overflow: hidden; }
      .pv-cd-fill  { height: 100%; border-radius: 2px; }
      .pv-cd-fill.ready   { background: #66bb6a; }
      .pv-cd-fill.cooling { background: #ffa726; }
      .pv-cd-text { font-size: 10px; color: rgba(255,255,255,0.28); width: 30px; text-align: right; flex-shrink: 0; }
      .pv-cd-text.ready { color: #66bb6a; }

      /* 진화 힌트 */
      .pv-evo-hint {
        display: flex; align-items: center; gap: 8px;
        background: rgba(212,175,106,0.07); border: 1px solid rgba(212,175,106,0.2);
        border-radius: 8px; padding: 7px 10px; margin-top: 8px;
      }
      .pv-evo-hint-icon { font-size: 11px; color: #d4af6a; flex-shrink: 0; }
      .pv-evo-hint-text { font-size: 11px; color: rgba(212,175,106,0.6); flex: 1; }
      .pv-evo-hint-text strong { color: #d4af6a; font-weight: 600; }
      .pv-evo-pips { display: flex; gap: 3px; flex-shrink: 0; }
      .pv-evo-pip { width: 7px; height: 7px; border-radius: 50%; background: rgba(212,175,106,0.15); border: 1px solid rgba(212,175,106,0.28); }
      .pv-evo-pip.done { background: #d4af6a; border-color: #d4af6a; }

      /* ── 장신구 ── */
      .pv-acc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; }
      .pv-acard {
        background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
        border-radius: 12px; padding: 13px; cursor: default; outline: none;
        transition: border-color 0.15s;
      }
      .pv-acard:hover, .pv-acard:focus-visible { border-color: rgba(212,175,106,0.28); }
      .pv-acard.rare { border-color: rgba(212,175,106,0.2); }
      .pv-acard-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
      .pv-aicon-wrap {
        width: 30px; height: 30px; border-radius: 7px;
        background: rgba(212,175,106,0.1); border: 1px solid rgba(212,175,106,0.2);
        display: flex; align-items: center; justify-content: center; font-size: 14px;
      }
      .pv-rarity-badge { font-size: 9px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; }
      .rb-rare   { color: rgba(212,175,106,0.7); }
      .rb-common { color: rgba(200,190,160,0.45); }
      .pv-aname   { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.82); margin-bottom: 4px; }
      .pv-aeffect { font-size: 11px; color: rgba(255,255,255,0.36); margin-bottom: 10px; line-height: 1.5; }
      .pv-alevel-row { display: flex; align-items: center; justify-content: space-between; }
      .pv-alv-label  { font-size: 10px; font-weight: 700; color: rgba(212,175,106,0.5); }

      /* 빈/잠금 슬롯 */
      .pv-slot-empty {
        border: 1px dashed rgba(255,255,255,0.13); background: rgba(255,255,255,0.015);
        border-radius: 12px; padding: 13px;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        gap: 7px; min-height: 100px;
      }
      .pv-slot-locked {
        border: 1px solid rgba(255,255,255,0.06); background: rgba(0,0,0,0.2);
        border-radius: 12px; padding: 13px; opacity: 0.4;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        gap: 6px; min-height: 100px;
      }
      .pv-slot-ring { width: 22px; height: 22px; border-radius: 50%; border: 1.5px dashed rgba(255,255,255,0.2); }
      .pv-lock-wrap { display: flex; flex-direction: column; align-items: center; gap: 1px; }
      .pv-lock-arc  { width: 12px; height: 7px; border: 2px solid rgba(255,255,255,0.3); border-bottom: none; border-radius: 6px 6px 0 0; }
      .pv-lock-body { width: 14px; height: 10px; background: rgba(255,255,255,0.2); border-radius: 2px; }
      .pv-slot-text { font-size: 10px; letter-spacing: 1.5px; color: rgba(255,255,255,0.2); text-transform: uppercase; }

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

      /* ── 푸터 ── BUG FIX: 하드코딩 rgba, hover 전에도 항상 표시 */
      .pv-footer {
        display: flex; gap: 10px; padding: 16px 24px;
        border-top: 1px solid rgba(255,255,255,0.06);
      }
      .pv-btn-resume {
        flex: 1; padding: 12px;
        background: rgba(212,175,106,0.12);         /* ← 하드코딩 */
        border: 1px solid rgba(212,175,106,0.32);    /* ← 하드코딩 */
        color: #d4af6a;                             /* ← 하드코딩 */
        border-radius: 10px; font-size: 12px; font-weight: 700;
        letter-spacing: 2px; text-transform: uppercase; cursor: pointer;
        transition: background 0.15s, border-color 0.15s;
        display: flex; align-items: center; justify-content: center; gap: 10px;
      }
      .pv-btn-resume:hover { background: rgba(212,175,106,0.2); border-color: rgba(212,175,106,0.5); }
      .pv-btn-resume:disabled { opacity: 0.5; cursor: wait; }
      .pv-btn-arrow { width: 0; height: 0; border-style: solid; border-width: 4px 0 4px 7px; border-color: transparent transparent transparent #d4af6a; }

      .pv-btn-menu {
        padding: 12px 18px;
        background: rgba(255,255,255,0.07);          /* ← 하드코딩 */
        border: 1px solid rgba(255,255,255,0.18);    /* ← 하드코딩 */
        color: rgba(255,255,255,0.6);               /* ← 하드코딩 */
        border-radius: 10px; font-size: 12px; font-weight: 600;
        cursor: pointer; transition: all 0.15s;
        display: flex; align-items: center; gap: 8px;
      }
      .pv-btn-menu:hover { background: rgba(255,255,255,0.12); color: rgba(255,255,255,0.85); border-color: rgba(255,255,255,0.28); }
      .pv-btn-menu:disabled { opacity: 0.5; cursor: wait; }

      .pv-kbd {
        font-size: 10px; font-weight: 700;
        background: rgba(212,175,106,0.1); border: 1px solid rgba(212,175,106,0.25);
        border-radius: 5px; padding: 2px 7px; color: rgba(212,175,106,0.55); letter-spacing: 0;
      }
      .pv-kbd-dim { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.14); color: rgba(255,255,255,0.3); }

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

      @media (max-width: 540px) {
        .pv-stats-grid { grid-template-columns: 1fr 1fr; }
        .pv-footer      { flex-direction: column-reverse; }
        .pv-btn-resume, .pv-btn-menu { justify-content: center; }
      }
      @media (prefers-reduced-motion: reduce) {
        .pv-panel, .pv-btn-resume, .pv-btn-menu, .pv-tab-content { animation: none !important; transition: none !important; }
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

function _formatSeconds(val, digits = 1) {
  return Number.isFinite(val) ? `${val.toFixed(digits)}s` : '—';
}

function _formatSynergyBonus(bonus) {
  if (!bonus) return '';
  if (bonus.speedMult)       return `속도 ×${bonus.speedMult}`;
  if (bonus.lifestealDelta)  return `흡혈 +${Math.round(bonus.lifestealDelta * 100)}%`;
  if (bonus.damageDelta)     return `데미지 +${bonus.damageDelta}`;
  if (bonus.pierceDelta)     return `관통 +${bonus.pierceDelta}`;
  if (bonus.cooldownMult)    return `CD ×${bonus.cooldownMult}`;
  if (bonus.orbitRadiusDelta)return `궤도 +${bonus.orbitRadiusDelta}px`;
  return '';
}

function _weaponEmoji(behaviorId) {
  const MAP = {
    targetProjectile: '🔵', orbit: '⚡', areaBurst: '✨',
    boomerang: '🪃', chainLightning: '⚡', omnidirectional: '🌀',
  };
  return MAP[behaviorId] ?? '⚔';
}

function _escapeHtml(v) {
  return String(v ?? '')
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'","&#39;");
}

function _escapeAttr(v) {
  return _escapeHtml(v).replaceAll('`','&#96;');
}
